import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, ref_id, sign, webhook_url } = req.body;
    console.log('Webhook test proxy request received:', { username, ref_id, webhook_url });

    // Forward the request to Digiflazz webhook test endpoint
    console.log('Forwarding request to Digiflazz...');
    const response = await fetch('https://api.digiflazz.com/v1/webhook-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        ref_id,
        sign,
        webhook_url
      }),
    });

    console.log('Response received from Digiflazz:', response.status, response.statusText);
    // Check if response has content before attempting to parse as JSON
    const text = await response.text();
    console.log('Raw response text:', text);
    let data;
    try {
      data = text ? JSON.parse(text) : { message: 'No response content from Digiflazz' };
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      data = { error: 'Invalid JSON response from Digiflazz', rawResponse: text };
    }

    if (response.ok) {
      console.log('Webhook test successful:', data);
      res.status(200).json({ message: 'Webhook test successful', data });
    } else {
      console.error('Webhook test failed with status:', response.status, data);
      res.status(response.status).json({ error: data.error || 'Failed to test webhook', details: data });
    }
  } catch (error: any) {
    console.error('Error proxying webhook test request:', error);
    res.status(500).json({ error: `Failed to proxy webhook test request: ${error.message}` });
  }
}
