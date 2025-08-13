export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚂 Proxying to Railway master API...');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);

    // Forward the request to Railway API
    const response = await fetch('https://studiobuddy-production.up.railway.app/master', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
        // Forward other relevant headers
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      body: req.body
    });

    console.log('Railway response status:', response.status);
    console.log('Railway response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Railway error:', errorText);
      return res.status(response.status).json({ 
        error: `Railway API error: ${response.status}`,
        details: errorText 
      });
    }

    // Forward the successful response
    const data = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/wav');
    res.setHeader('Content-Length', data.byteLength);
    res.status(200).send(Buffer.from(data));

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}