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
    const { file, userData } = req.body;

    if (!file || !userData) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo e dados de usuário são obrigatórios'
      });
    }

    // Simula upload (em produção salvar em storage real como S3, etc)
    const uploadId = Math.random().toString(36).slice(2, 10);
    console.log(`Comprovante enviado para ${userData.cpf}:`, uploadId);

    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso',
      uploadId: uploadId
    });

  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload: ' + error.message
    });
  }
}
