# Integração Blackcat PIX Payment Gateway

Projeto de pagamento PIX integrado com Blackcat Gateway, executado em Netlify/Vercel como serverless functions.

## 🚀 Quick Start - Vercel

### 1. Deploy no Vercel

```bash
# Clone o repositório
git clone https://github.com/thiagoziko771-boop/FUNCIONABLACKK.git
cd FUNCIONABLACKK

# Deploy com Vercel CLI
vercel
```

Ou use o botão abaixo para deploy direto:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thiagoziko771-boop/FUNCIONABLACKK)

### 2. Configurar Variáveis de Ambiente

No Vercel → Project Settings → Environment Variables, adicione:

| Variável | Valor |
|----------|-------|
| `BLACKCAT_API_KEY` | Sua chave API da Blackcat |
| `BLACKCAT_PUBLIC_KEY` | Sua chave pública da Blackcat |

### 3. Redeploy

Após configurar as variáveis:
- Vá para Deployments
- Clique em "Redeploy" no deployment mais recente

---

## 📂 Estrutura do Projeto

```
├── functions/
│   ├── pix-blackcat.js              ← Gera PIX
│   ├── check-payment-blackcat.js    ← Verifica status
│   ├── webhook-blackcat.js          ← Recebe webhooks
│   └── credentials.js               ← Credenciais
├── .env.example                      ← Template de variáveis
├── netlify.toml                      ← Configuração Netlify
└── vercel.json                       ← Configuração Vercel
```

---

## 🔌 Endpoints

### Gerar PIX
```bash
POST /api/pix-blackcat
Content-Type: application/json

{
  "nome": "Cliente",
  "email": "cliente@example.com",
  "phone": "11999999999",
  "cpf": "12345678901",
  "amount": 67.20
}
```

**Resposta:**
```json
{
  "success": true,
  "transaction_id": "TXN-...",
  "pixCode": "00020126580...",
  "amount": 67.20
}
```

### Verificar Pagamento
```bash
GET /api/check-payment-blackcat?id=TRANSACTION_ID
```

### Webhook
```bash
POST /api/webhook-blackcat
```

---

## 🔐 Configuração Local

1. Copie `.env.example` para `.env`
2. Preencha suas credenciais Blackcat
3. Instale dependências: `npm install`
4. Para desenvolvimento local com Netlify Functions:
   ```bash
   npm run dev
   ```

---

## 📊 Valor Padrão

- **Valor de Pagamento**: R$ 67,20
- **Nome da Loja**: SHOPIFY LOJA 02
- **Expiração PIX**: 1 dia

---

## 🛠️ Tecnologias

- Node.js (Serverless Functions)
- Blackcat Payment Gateway
- Supabase (Banco de dados)
- UTMify (Analytics)

---

## ⚠️ Notas de Segurança

- `.env` está no `.gitignore` - nunca será commitado
- Credenciais são seguras em variáveis de ambiente
- Use apenas credenciais de produção confiáveis

---

**Status:** ✅ Pronto para Vercel/Netlify
