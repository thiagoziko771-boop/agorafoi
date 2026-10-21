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

    console.log('[UPLOAD] Recebendo upload de comprovante');
    console.log('[UPLOAD] Dados do usuário:', { cpf: userData?.cpf?.substring(0, 3) + '***', nome: userData?.nome });

    if (!file) {
      console.error('[UPLOAD] Erro: arquivo não fornecido');
      return res.status(400).json({
        success: false,
        error: 'Arquivo é obrigatório'
      });
    }

    if (!userData || !userData.cpf) {
      console.error('[UPLOAD] Erro: dados de usuário não fornecidos');
      return res.status(400).json({
        success: false,
        error: 'Dados de usuário são obrigatórios'
      });
    }

    // Gera ID único para o upload
    const uploadId = `${userData.cpf}_${Date.now()}`;
    const fileName = `comprovante_${userData.cpf}_${Date.now()}.jpg`;

    console.log('[UPLOAD] Arquivo salvo:', fileName);
    console.log('[UPLOAD] Upload ID:', uploadId);

    // Simula armazenamento (em produção usar S3, Supabase Storage, etc)
    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso',
      uploadId: uploadId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[UPLOAD] ERRO não tratado:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload: ' + error.message
    });
  }
}
