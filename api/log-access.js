export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Log de acesso do usuário
    const timestamp = new Date().toISOString();
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log(`[${timestamp}] Acesso de ${ip} - ${userAgent}`);

    return res.status(200).json({
      success: true,
      message: 'Log registrado'
    });

  } catch (error) {
    console.error('Erro ao registrar log:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao registrar log: ' + error.message
    });
  }
}
