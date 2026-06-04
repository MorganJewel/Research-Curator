/**
 * Cloudflare Worker — Research Curator API Proxy
 *
 * Proxies both Serper (search) and HuggingFace (Apertus AI) requests
 * so API keys never appear in the client-side bundle.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Go to https://dash.cloudflare.com and open "Workers & Pages".
 * 2. Paste the contents of this file into your existing Worker (replace all).
 * 3. In your Worker's Settings → Variables, add two Environment Variables:
 *       SERPER_API_KEY     =  <your Serper API key from serper.dev>
 *       HUGGINGFACE_API_KEY =  <your HuggingFace token>
 * 4. Deploy the Worker.
 * 5. In GitHub Actions secrets, set:
 *       VITE_SERPER_PROXY_URL = https://your-worker.workers.dev
 *    (Remove VITE_APERTUS_API_KEY — it is no longer needed)
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes:
 *   POST /serper  — body: { q, num? }  → proxies to google.serper.dev
 *   POST /apertus — body: HuggingFace chat completions payload → proxies to router.huggingface.co
 */

const SERPER_API_URL = 'https://google.serper.dev/search';
const APERTUS_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const ALLOWED_ORIGIN = '*';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    if (path === '/serper') {
      return handleSerper(body, env);
    } else if (path === '/apertus') {
      return handleApertus(body, env);
    } else {
      return json({ error: 'Unknown route. Use /serper or /apertus.' }, 404);
    }
  },
};

async function handleSerper(body, env) {
  if (!body.q) return json({ error: 'Missing required field: q' }, 400);

  const response = await fetch(SERPER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': env.SERPER_API_KEY,
    },
    body: JSON.stringify({ q: body.q, num: body.num || 10, gl: 'us', hl: 'en' }),
  });

  const data = await response.json();
  return json(data, response.status);
}

async function handleApertus(body, env) {
  const response = await fetch(APERTUS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return json(data, response.status);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
