const { getSupabase } = require("./lib/supabase");
const credentials = require("./credentials");

// Configuração Blackcat
const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY || "sk_live_xxxxx";
const UTMIFY_TOKEN = process.env.UTMIFY_TOKEN || credentials.UTMIFY_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cache UTMify
const utmifyCache = new Map();
const CACHE_TTL = 60000;

function getAuthHeader() {
  if (!BLACKCAT_API_KEY) {
    throw new Error("❌ BLACKCAT_API_KEY não configurada!");
  }
  return BLACKCAT_API_KEY;
}

async function sendUtmify(transactionId, status, customer, amountCents, createdAt, utms) {
  if (utmifyCache.has(transactionId)) {
    console.log("[UTMify] Skipping duplicate for:", transactionId);
    return;
  }

  utmifyCache.set(transactionId, true);
  setTimeout(() => utmifyCache.delete(transactionId), CACHE_TTL);

  try {
    const gatewayFeeCents = Math.round(amountCents * 0.02);
    const netCents = amountCents - gatewayFeeCents;
    const payload = {
      orderId: transactionId,
      platform: "Blackcat",
      paymentMethod: "pix",
      status,
      createdAt: createdAt || new Date().toISOString().replace("T"," ").slice(0,19),
      approvedDate: status === "paid" ? new Date().toISOString().replace("T"," ").slice(0,19) : null,
      customer: {
        name: customer.name || null,
        email: customer.email || null,
        phone: customer.phone || null,
        document: customer.cpf || null,
        country: "BR",
        ip: "177.0.0.1",
      },
      products: [{
        id: "loja-shopify-br-001",
        name: "SHOPIFY LOJA 03",
        quantity: 1,
        priceInCents: amountCents,
      }],
      trackingParameters: {
        utm_source: utms?.utm_source || null,
        utm_campaign: utms?.utm_campaign || null,
        utm_medium: utms?.utm_medium || null,
        utm_content: utms?.utm_content || null,
        utm_term: utms?.utm_term || null,
      },
      commission: {
        totalPriceInCents: amountCents,
        gatewayFeeInCents: gatewayFeeCents,
        userCommissionInCents: netCents,
        currency: "BRL",
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${UTMIFY_TOKEN}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    console.log("[UTMify] ✓ Enviado para:", transactionId);
  } catch (err) {
    console.error("[UTMify] Erro (não bloqueia):", err.message);
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function gerarCpfValido() {
  // Gera um CPF válido aleatório
  let cpf = '';
  
  // Gera os primeiros 9 dígitos aleatoriamente
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  let multiplicador = 10;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * multiplicador;
    multiplicador--;
  }
  let resto = soma % 11;
  let primeiroDigito = resto < 2 ? 0 : 11 - resto;
  
  // Calcula o segundo dígito verificador
  cpf += primeiroDigito;
  soma = 0;
  multiplicador = 11;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * multiplicador;
    multiplicador--;
  }
  resto = soma % 11;
  let segundoDigito = resto < 2 ? 0 : 11 - resto;
  
  cpf += segundoDigito;
  return cpf;
}

function fmtPhone(phone) {
  if (!phone) return "11999999999";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return digits;
  if (digits.length === 10) return digits;
  return digits;
}

exports.handler = async (event) => {
  console.log("[PIX-BLACKCAT] ===== FUNÇÃO INICIADA =====");
  console.log("[PIX-BLACKCAT] BLACKCAT_API_KEY exists:", !!BLACKCAT_API_KEY);
  console.log("[PIX-BLACKCAT] SUPABASE_URL exists:", !!SUPABASE_URL);
  console.log("[PIX-BLACKCAT] SUPABASE_KEY exists:", !!SUPABASE_KEY);
  
  if (!BLACKCAT_API_KEY) {
    console.error("❌ ERRO: BLACKCAT_API_KEY não configurada!");
    return jsonResponse(500, {
      success: false,
      error: "Credenciais da gateway não configuradas",
      debug: "BLACKCAT_API_KEY não encontrada"
    });
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: "",
    };
  }

  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch { body = {}; }

  const randId = Math.random().toString(36).slice(2,10);
  
  // Calcula o amount baseado na requisição
  // Padrão é R$ 67.20
  let amountReais = 67.20;
  const rawAmount = body.amount ?? body.valor ?? body.total;
  if (rawAmount) {
    const n = Number(rawAmount);
    if (n > 0) {
      amountReais = n; // Usar valor fornecido
    }
  }
  const amountCents = Math.round(amountReais * 100);

  const customerName = (body.nome || body.name || body.customer_name || `Cliente ${randId}`).toString().trim();
  const customerEmail = (body.email || body.customer_email || `cliente${randId}@gmail.com`).toString().trim();
  const customerPhone = fmtPhone(body.phone || body.customer_phone || "11999999999");
  const cpfRaw = (body.cpf || body.document || body.customer_cpf || "").toString().replace(/\D/g, "");
  const customerCpf = cpfRaw.length === 11 ? cpfRaw : gerarCpfValido();
  const utms = body.utm || {};
  const reference = `order_${randId}`;

  console.log("[PIX-BLACKCAT] Amount:", amountReais, "Cents:", amountCents);
  console.log("[PIX-BLACKCAT] Customer:", { name: customerName, email: customerEmail, cpf: customerCpf });

  // Payload conforme documentação da Blackcat
  const payload = {
    amount: amountCents, // em centavos
    currency: "BRL",
    paymentMethod: "pix",
    items: [
      {
        title: "SHOPIFY LOJA 02",
        unitPrice: amountCents,
        quantity: 1,
        tangible: false,
      }
    ],
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      document: {
        number: customerCpf,
        type: "cpf"
      }
    },
    pix: {
      expiresInDays: 1, // 1 dia de expiração
    },
    postbackUrl: "https://cnh-brasil-gov-br.netlify.app/webhook/blackcat",
    externalRef: reference,
    utm_source: utms?.utm_source || null,
    utm_medium: utms?.utm_medium || null,
    utm_campaign: utms?.utm_campaign || null,
    utm_content: utms?.utm_content || null,
    utm_term: utms?.utm_term || null,
  };

  let apiKey;
  try {
    apiKey = getAuthHeader();
  } catch (err) {
    console.error("❌ [PIX-BLACKCAT] Auth error:", err.message);
    return jsonResponse(500, {
      success: false,
      error: "Credenciais não configuradas",
      debug: err.message
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    // Endpoint conforme documentação da Blackcat
    const resp = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await resp.text();
    if (!resp.ok) {
      let errMsg = text;
      try { errMsg = JSON.parse(text)?.message || errMsg; } catch {}
      console.error("[Blackcat] Erro HTTP:", resp.status, errMsg);
      return jsonResponse(resp.status, {
        success: false,
        error: errMsg,
        debug: { status: resp.status, body: text.substring(0, 200) }
      });
    }

    let parsed = {};
    try { parsed = JSON.parse(text); } catch {
      console.error("[Blackcat] Parse error:", text.substring(0, 200));
      return jsonResponse(500, {
        success: false,
        error: "Resposta inválida da gateway",
        debug: text.substring(0, 200)
      });
    }

    // Parsing conforme resposta da Blackcat
    const transactionId = parsed.data?.transactionId || parsed.transactionId || null;
    const pixCode = parsed.data?.paymentData?.qrCode 
      || parsed.data?.paymentData?.copyPaste
      || parsed.paymentData?.qrCode 
      || null;

    if (!transactionId || !pixCode) {
      console.error("[Blackcat] Resposta incompleta:", { transactionId, pixCode });
      return jsonResponse(500, {
        success: false,
        error: "Gateway retornou resposta incompleta",
        debug: { transaction: transactionId, pix: !!pixCode, fullResponse: parsed }
      });
    }

    console.log("[PIX-BLACKCAT] ===== PIX GERADO COM SUCESSO =====");
    console.log("[PIX-BLACKCAT] Transaction ID:", transactionId);
    console.log("[PIX-BLACKCAT] PIX Code: ✓ Existe");

    // Salvar no Supabase (não bloqueia)
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supabase = getSupabase();
        await supabase.from("transactions").insert({
          transaction_id: transactionId,
          amount: amountReais,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_cpf: customerCpf,
          customer_phone: customerPhone,
          status: "pending",
          brcode: pixCode,
          gateway: "blackcat",
          utm_source: utms.utm_source || null,
          utm_campaign: utms.utm_campaign || null,
          utm_medium: utms.utm_medium || null,
        });
        console.log("[Supabase] ✓ Salvo:", transactionId);
      } catch (err) {
        console.error("[Supabase] Erro (continuando):", err.message);
      }
    }

    // Notificar UTMify (não bloqueia)
    await sendUtmify(
      transactionId, "waiting_payment",
      { name: customerName, email: customerEmail, phone: customerPhone, cpf: customerCpf },
      amountCents,
      new Date().toISOString().replace("T"," ").slice(0,19),
      utms
    ).catch(err => console.error("[SendUtmify] Erro:", err.message));

    return jsonResponse(200, {
      success: true,
      pixCode,
      pix_code: pixCode,
      brcode: pixCode,
      payload: pixCode,
      qr_code: pixCode,
      qr_code_image: null,
      transaction_id: transactionId,
      transactionId,
      deposit_id: transactionId,
      status: "pending",
      amount: amountReais,
      gateway: "bravopay",
    });

  } catch (err) {
    console.error("[PIX-BLACKCAT] Erro ao chamar gateway:", err.message);
    return jsonResponse(502, {
      success: false,
      error: "Falha ao conectar com gateway: " + String(err)
    });
  }
};
