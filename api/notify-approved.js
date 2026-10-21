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
    const { userData } = req.body;

    if (!userData) {
      return res.status(400).json({
        success: false,
        error: 'Dados de usuário não fornecidos'
      });
    }

    // Log da aprovação (em produção enviar email, salvar em BD, etc)
    console.log('Usuário aprovado:', userData);

    return res.status(200).json({
      success: true,
      message: 'Notificação de aprovação registrada'
    });

  } catch (error) {
    console.error('Erro ao notificar aprovação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao notificar aprovação: ' + error.message
    });
  }
}
