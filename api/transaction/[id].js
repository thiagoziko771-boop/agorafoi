export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de transação não fornecido'
      });
    }

    // Retorna dados simulados da transação (em produção buscar do BD)
    return res.status(200).json({
      success: true,
      transaction: {
        id: id,
        status: 'pending',
        amount: 67.20,
        currency: 'BRL',
        nome: 'Titular',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar transação: ' + error.message
    });
  }
}
