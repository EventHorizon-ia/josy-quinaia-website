"use strict";

/**
 * GET /api/reviews
 * Busca as avaliações reais do Google (Places API "New") e devolve só o necessário.
 * A chave nunca vai para o navegador: ela vem de variáveis de ambiente da Vercel.
 *
 * Variáveis de ambiente (Vercel > Settings > Environment Variables):
 *   GOOGLE_PLACES_API_KEY  chave com a "Places API (New)" habilitada
 *   GOOGLE_PLACE_ID        Place ID do perfil da Josy no Google
 */

const ENDPOINT = "https://places.googleapis.com/v1/places/";
const FIELD_MASK = "rating,userRatingCount,googleMapsUri,reviews";
const TIMEOUT_MS = 8000;
const GOOGLE_HOSTS = ["google.com", "google.com.br"];
const PHOTO_HOSTS = ["googleusercontent.com", "ggpht.com"];

const texto = (v) => (typeof v === "string" ? v.trim() : "");

// Aceita apenas URLs https de domínios esperados (evita links/imagens inesperados).
function urlSegura(valor, dominios) {
  try {
    const u = new URL(valor);
    if (u.protocol !== "https:") return null;
    const ok = dominios.some((d) => u.hostname === d || u.hostname.endsWith("." + d));
    return ok ? u.toString() : null;
  } catch {
    return null;
  }
}

function mapearAvaliacao(r) {
  if (!r || typeof r !== "object") return null;
  const autor = r.authorAttribution || {};
  const nota = Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)));
  // originalText = mensagem exatamente como a pessoa escreveu (sem tradução automática)
  const mensagem = texto(r.originalText && r.originalText.text) || texto(r.text && r.text.text);
  return {
    author: texto(autor.displayName) || "Usuário do Google",
    profileUrl: urlSegura(autor.uri, GOOGLE_HOSTS),
    photo: urlSegura(autor.photoUri, PHOTO_HOSTS),
    rating: nota,
    text: mensagem,
    when: texto(r.relativePublishTimeDescription),
  };
}

// Remove espaços, quebras de linha e aspas coladas por engano no painel da Vercel.
const limparEnv = (v) => String(v || "").trim().replace(/^["']+|["']+$/g, "").trim();

// Dicas (aparecem só nos logs da Vercel) para os erros mais comuns do Google.
const DICAS = {
  SERVICE_DISABLED: "Ative a 'Places API (New)' (não a 'Places API' antiga) no projeto do Google Cloud.",
  API_KEY_SERVICE_BLOCKED: "A chave está restrita a outras APIs. Inclua a 'Places API (New)' nas restrições de API da chave.",
  API_KEY_HTTP_REFERRER_BLOCKED: "A chave está restrita por site (HTTP referrer). Chamadas de servidor não têm referrer: restrinja apenas por API.",
  API_KEY_IP_ADDRESS_BLOCKED: "A chave está restrita por IP. A Vercel usa IPs dinâmicos: restrinja apenas por API.",
  API_KEY_INVALID: "Chave inválida. Copie-a de novo, sem espaços ou aspas, e faça um novo deploy.",
  BILLING_DISABLED: "Ative o faturamento no projeto do Google Cloud (a Places API exige).",
  NOT_FOUND: "Place ID não encontrado. Confira o ID (começa com 'ChIJ') no Place ID Finder.",
  RESOURCE_EXHAUSTED: "Cota excedida no Google Cloud.",
};

// Extrai só um código curto do erro do Google (ex.: SERVICE_DISABLED). Nunca devolve a chave.
async function motivoDoGoogle(resposta) {
  let corpo = null;
  try { corpo = await resposta.json(); } catch { /* corpo não-JSON */ }
  const e = (corpo && corpo.error) || {};
  const detalhe = Array.isArray(e.details) ? e.details.find((d) => d && d.reason) : null;
  const bruto = (detalhe && detalhe.reason) || e.status || "HTTP_" + resposta.status;
  const codigo = /^[A-Z0-9_]{3,60}$/.test(bruto) ? bruto : "HTTP_" + resposta.status;
  return { codigo, mensagem: texto(e.message).slice(0, 300) };
}

module.exports = async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = limparEnv(process.env.GOOGLE_PLACES_API_KEY);
  const placeId = limparEnv(process.env.GOOGLE_PLACE_ID).replace(/^places\//, "");

  const faltando = [];
  if (!apiKey) faltando.push("GOOGLE_PLACES_API_KEY");
  if (!placeId) faltando.push("GOOGLE_PLACE_ID");
  if (faltando.length) {
    console.error("[reviews] Variáveis de ambiente ausentes:", faltando.join(", "),
      "- cadastre na Vercel (Settings > Environment Variables) e faça um novo deploy.");
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "not_configured", missing: faltando });
  }
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) {
    console.error("[reviews] GOOGLE_PLACE_ID com formato inválido. Use o Place ID que começa com 'ChIJ' (não o CID 0x..:0x.. nem a URL).");
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "invalid_place_id" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${ENDPOINT}${encodeURIComponent(placeId)}?languageCode=pt-BR`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
      signal: controller.signal,
    });

    if (!resposta.ok) {
      const motivo = await motivoDoGoogle(resposta);
      console.error("[reviews] Google Places respondeu", resposta.status, motivo.codigo, "-", motivo.mensagem,
        "|", DICAS[motivo.codigo] || "Consulte a mensagem acima.");
      res.setHeader("Cache-Control", "no-store");
      return res.status(502).json({ error: "upstream_error", upstreamStatus: resposta.status, reason: motivo.codigo });
    }

    const dados = await resposta.json();
    const avaliacoes = (Array.isArray(dados.reviews) ? dados.reviews : [])
      .map(mapearAvaliacao)
      .filter(Boolean);

    // Cache curto no CDN da Vercel: reduz chamadas (custo) e mantém os dados atualizados.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json({
      rating: typeof dados.rating === "number" ? dados.rating : null,
      total: Number.isInteger(dados.userRatingCount) ? dados.userRatingCount : null,
      mapsUrl: urlSegura(dados.googleMapsUri, GOOGLE_HOSTS),
      reviews: avaliacoes,
    });
  } catch (erro) {
    const timeout = erro && erro.name === "AbortError";
    console.error("[reviews] Falha ao consultar o Google Places:", timeout ? "tempo esgotado" : (erro && erro.name));
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "upstream_error", reason: timeout ? "TIMEOUT" : "NETWORK_ERROR" });
  } finally {
    clearTimeout(timer);
  }
};
