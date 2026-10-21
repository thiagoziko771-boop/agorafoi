export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { cpf } = req.query;

    if (!cpf || cpf.length !== 11 || isNaN(cpf)) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido',
        DADOS: null
      });
    }

    // Simulação de consulta - retorna dados fake para teste
    // Em produção, conectar com sistema real de consulta de CNH
    const mockData = {
      success: true,
      DADOS: {
        cpf: cpf,
        nome: 'Titular da CNH',
        uf: 'SP',
        categoria: 'AB',
        vencimento: '2027-12-31'
      }
    };

    return res.status(200).json(mockData);

  } catch (error) {
    console.error('Erro na consulta:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar CPF: ' + error.message,
      DADOS: null
    });
  }
}
