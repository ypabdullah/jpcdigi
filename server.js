import express from 'express';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;
const secret = process.env.SECRET_WEBHOOK;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.json());

app.post('/payload', async (req, res) => {
    console.log('📩 Webhook diterima:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Extract event type
    const eventType = req.body.event || 'unknown';
    console.log('Event Type:', eventType);

    // Verify webhook signature
    const signature = req.headers['x-digiflazz-signature'];
    if (!signature) {
        console.error('❌ Tidak ada signature di header');
        return res.status(401).json({ error: 'No signature provided' });
    }

    const computedSignature = crypto
        .createHmac('sha1', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (computedSignature !== signature) {
        console.error('❌ Signature tidak valid:', computedSignature, '!=', signature);
        return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Signature valid');

    // Save to Supabase database based on event type
    if (req.body.data) {
        const data = req.body.data;
        console.log('Data to save:', data);
        
        if (eventType === 'create') {
            const { error } = await supabase.from('transaksi_digiflazz').insert([
                {
                    ref_id: data.ref_id,
                    customer_no: data.customer_no,
                    buyer_sku_code: data.buyer_sku_code,
                    status: data.status,
                    message: data.message,
                    rc: data.rc,
                    sn: data.sn || '',
                    price: data.price,
                    buyer_last_saldo: data.buyer_last_saldo,
                    created_at: new Date().toISOString()
                }
            ]);
            
            if (error) {
                console.error('❌ Error saving to Supabase:', error.message);
            } else {
                console.log('✅ Transaction created in Supabase');
            }
        } else if (eventType === 'update') {
            const { error } = await supabase
                .from('transaksi_digiflazz')
                .update({
                    status: data.status,
                    message: data.message,
                    sn: data.sn || '',
                    rc: data.rc,
                    buyer_last_saldo: data.buyer_last_saldo,
                })
                .eq('ref_id', data.buyer_tx_id); // ⬅️ Ini sudah benar, cocokkan ke ref_id lokal kamu
        
            if (error) {
                console.error('❌ Error updating Supabase:', error.message);
            } else {
                console.log('✅ Transaction updated in Supabase using buyer_tx_id');
                console.log('🔁 Matching: ref_id (local) vs buyer_tx_id (Digiflazz):', data.buyer_tx_id);

            }
        
        } else {
            console.log('⚠️ Unsupported event type:', eventType);
        }
    } else {
        console.log('❌ No data field in webhook payload. Full payload:', JSON.stringify(req.body, null, 2));
    }

    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`✅ Webhook server berjalan di http://202.10.44.157:${port}/payload`);
});
