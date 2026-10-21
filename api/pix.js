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
    const { nome, email, phone, cpf, amount } = req.body;
    const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY;

    console.log('[PIX] Iniciando geração de PIX');
    console.log('[PIX] Dados recebidos:', { nome, email, phone, cpf: cpf?.substring(0, 3) + '***', amount });
    console.log('[PIX] API Key configurada:', !!BLACKCAT_API_KEY);

    if (!BLACKCAT_API_KEY) {
      console.error('[PIX] ERRO: Chave de API não configurada');
      return res.status(500).json({ 
        success: false, 
        error: 'Chave de API não configurada no servidor' 
      });
    }

    const amountCents = Math.round((amount || 67.20) * 100);
    const randId = Math.random().toString(36).slice(2, 10);

    const payload = {
      amount: amountCents,
      currency: 'BRL',
      paymentMethod: 'pix',
      items: [{
        title: 'SHOPIFY LOJA 02',
        unitPrice: amountCents,
        quantity: 1,
        tangible: false,
      }],
      customer: {
        name: nome || `Cliente ${randId}`,
        email: email || `cliente${randId}@gmail.com`,
        phone: phone || '11999999999',
        document: {
          number: cpf || '12345678901',
          type: 'cpf'
        }
      },
      pix: { expiresInDays: 1 },
      postbackUrl: 'https://agorafoi-two.vercel.app/api/webhook',
      externalRef: `order_${randId}`,
    };

    console.log('[PIX] Enviando para Blackcat:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.blackcatoficial.com/api/sales/create-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BLACKCAT_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('[PIX] Resposta da Blackcat:', data);

    if (!response.ok) {
      console.error('[PIX] ERRO na resposta:', response.status, data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Erro na gateway',
      });
    }

    const transactionId = data.data?.transactionId;
    const pixCode = data.data?.paymentData?.qrCode || data.data?.paymentData?.copyPaste;

    console.log('[PIX] IDs extraídos:', { transactionId, pixCode: pixCode?.substring(0, 20) + '...' });

    if (!transactionId || !pixCode) {
      console.error('[PIX] ERRO: Resposta incompleta');
      return res.status(500).json({
        success: false,
        error: 'Resposta incompleta da gateway',
      });
    }

    console.log('[PIX] Sucesso!');
    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      pixCode: pixCode,
      amount: amount || 67.20,
      status: 'pending',
    });

  } catch (error) {
    console.error('[PIX] ERRO não tratado:', error);
    return res.status(502).json({
      success: false,
      error: 'Erro ao conectar com gateway: ' + error.message,
    });
  }
}
