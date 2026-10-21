const { getSupabase } = require("./lib/supabase");
const credentials = require("./credentials");

// Configuração Blackcat
const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY || "sk_live_xxxxx";

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

exports.handler = async (event) => {
  console.log("[CHECK-PAYMENT-BLACKCAT] ===== FUNÇÃO INICIADA =====");
  console.log("[CHECK-PAYMENT-BLACKCAT] Query:", event.queryStringParameters);

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

  const transactionId = event.queryStringParameters?.id || event.queryStringParameters?.transaction_id;

  if (!transactionId) {
    console.error("[CHECK-PAYMENT-BLACKCAT] Transaction ID não fornecido");
    return jsonResponse(400, {
      success: false,
      error: "Transaction ID é obrigatório",
    });
  }

  console.log("[CHECK-PAYMENT-BLACKCAT] Buscando transação:", transactionId);

  try {
    // Primeiro, buscar no Supabase para cache rápido
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (!error && data) {
      console.log("[CHECK-PAYMENT-BLACKCAT] ✓ Encontrado no Supabase:", data.status);
      return jsonResponse(200, {
        success: true,
        status: data.status,
        transaction_id: transactionId,
        amount: data.amount,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        paid_at: data.paid_at,
        created_at: data.created_at,
        gateway: data.gateway,
        source: "cache",
      });
    }

    // Se não encontrar em cache, buscar na Blackcat
    console.log("[CHECK-PAYMENT-BLACKCAT] Consultando Blackcat...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Endpoint para consultar transação
    const resp = await fetch(`${BLACKCAT_BASE}/sales/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BLACKCAT_API_KEY,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await resp.text();

    if (!resp.ok) {
      console.error("[Blackcat] Erro HTTP:", resp.status);
      return jsonResponse(resp.status, {
        success: false,
        error: "Transação não encontrada na gateway",
        status: "not_found",
      });
    }

    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[Blackcat] Parse error");
      return jsonResponse(500, {
        success: false,
        error: "Resposta inválida da gateway",
      });
    }

    // Parse conforme documentação Blackcat
    const transaction = parsed.data || parsed;
    const status = transaction.status ? transaction.status.toLowerCase() : "unknown";
    const mappedStatus = status === "paid" ? "paid" : status === "pending" ? "pending" : status;

    console.log("[CHECK-PAYMENT-BLACKCAT] Status retornado:", mappedStatus);

    // Salvar/atualizar no Supabase
    try {
      await supabase
        .from("transactions")
        .update({
          status: mappedStatus,
          paid_at: mappedStatus === "paid" ? transaction.createdAt : null,
        })
        .eq("transaction_id", transactionId)
        .is("gateway", null);
    } catch (updateErr) {
      console.error("[Supabase] Erro ao atualizar (continuando):", updateErr.message);
    }

    return jsonResponse(200, {
      success: true,
      status: mappedStatus,
      transaction_id: transactionId,
      amount: transaction.amount ? transaction.amount / 100 : null,
      payment_method: transaction.paymentMethod || "pix",
      paid_at: transaction.createdAt,
      created_at: transaction.createdAt,
      gateway: "blackcat",
      source: "live",
    });

  } catch (err) {
    console.error("[CHECK-PAYMENT-BLACKCAT] Erro:", err.message);
    return jsonResponse(502, {
      success: false,
      error: "Falha ao conectar com gateway: " + String(err),
    });
  }
};
