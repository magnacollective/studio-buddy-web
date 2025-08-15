// Temporary endpoint to reset user subscription status
// This should only be used for debugging/testing

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, newPlan = 'free' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  // This is a temporary debug endpoint - would need proper Firebase Admin setup
  res.status(200).json({ 
    message: `Would reset user ${userId} to plan: ${newPlan}`,
    note: 'This is a mock endpoint - actual implementation needs Firebase Admin SDK'
  });
}