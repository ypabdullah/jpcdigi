import http from 'http';
import crypto from 'crypto';

const WEBHOOK_URL = 'http://202.10.44.157:5173/payload';
const SECRET = 'jpcdigi';

const payload = {
  event: "update",
  data: {
    ref_id: "1749486136249-683",
    customer_no: "085712345678",
    buyer_tx_id: "1749486136249-683",
    buyer_sku_code: "plncek",
    status: "Sukses",
    message: "Transaksi berhasil",
    rc: "00",
    sn: "SN1234567890",
    price: 10000,
    buyer_last_saldo: 980000,
    tele: "@testuser",
    wa: "085712345678"
  }
};

const signature = crypto
  .createHmac('sha1', SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-digiflazz-signature': signature,
    'Content-Length': Buffer.byteLength(JSON.stringify(payload))
  }
};

const req = http.request(WEBHOOK_URL, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`✅ Respon dari server: ${res.statusCode}`);
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`❌ Gagal kirim request: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();
