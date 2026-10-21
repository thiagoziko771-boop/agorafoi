export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    success: true,
    message: 'API funcionando',
    env: {
      hasBlackcatKey: !!process.env.BLACKCAT_API_KEY,
      keyPreview: process.env.BLACKCAT_API_KEY ? process.env.BLACKCAT_API_KEY.substring(0, 10) + '...' : 'NOT SET'
    }
  });
}
