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

    // Retorna status pendente (em produção verificar com gateway real)
    return res.status(200).json({
      success: true,
      status: 'pending',
      transaction_id: id,
      message: 'Aguardando pagamento...'
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar pagamento: ' + error.message
    });
  }
}
