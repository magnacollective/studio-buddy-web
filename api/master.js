import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚂 Proxying to Railway master API...');
    console.log('Headers:', req.headers);
    console.log('Content-Length:', req.headers['content-length']);

    // Stream the request directly to Railway to avoid Vercel limits
    const response = await fetch('https://studiobuddy-production.up.railway.app/master', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
        'Content-Length': req.headers['content-length'],
      },
      body: Readable.from(req),
      duplex: 'half'
    });

    console.log('Railway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Railway error:', errorText);
      return res.status(response.status).json({ 
        error: `Railway API error: ${response.status}`,
        details: errorText 
      });
    }

    // Stream the response back
    const contentType = response.headers.get('content-type') || 'audio/wav';
    res.setHeader('Content-Type', contentType);
    
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'));
    }

    // Stream the response body
    const reader = response.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } finally {
      reader.releaseLock();
    }

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
    bodyParser: false, // Disable default body parser to handle multipart data
  },
}