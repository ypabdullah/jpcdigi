// This endpoint now serves as a listener for webhook test responses from Digiflazz

// Define types manually or use any if necessary
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log incoming webhook data for debugging
    console.log('Webhook received:', req.body);
    
    // Simply acknowledge receipt of the webhook
    // In a real implementation, you would validate the signature and process the data
    res.status(200).json({ message: 'Webhook received successfully', data: req.body });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: `Failed to process webhook: ${error.message}` });
  }
}
