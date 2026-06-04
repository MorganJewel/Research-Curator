/**
 * Cloudflare Worker — Serper API CORS Proxy
 *
 * DEPLOYMENT INSTRUCTIONS:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Go to https://dash.cloudflare.com and open "Workers & Pages".
 * 2. Create a new Worker and paste the contents of this file.
 * 3. In your Worker's Settings → Variables, add an Environment Variable:
 *       SERPER_API_KEY  =  <your Serper API key from serper.dev>
 * 4. Deploy the Worker. Copy its URL (e.g. https://serper-proxy.your-handle.workers.dev).
 * 5. In your project's .env file (or GitHub Actions secrets), set:
 *       VITE_SERPER_PROXY_URL=https://serper-proxy.your-handle.workers.dev
 * ─────────────────────────────────────────────────────────────────────────────
 * The Worker accepts POST requests with a JSON body `{ q: "search query" }`
 * and proxies them to the Serper API, injecting the API key server-side so
 * the key is never exposed in the browser.
 */

const SERPER_API_URL = 'https://google.serper.dev/search';
const ALLOWED_ORIGIN = '*'; // Restrict to your GitHub Pages domain in production

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(ALLOWED_ORIGIN) },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(ALLOWED_ORIGIN) },
      });
    }

    if (!body.q) {
      return new Response(JSON.stringify({ error: 'Missing required field: q' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(ALLOWED_ORIGIN) },
      });
    }

    const serperPayload = {
      q: body.q,
      num: body.num || 10,
      gl: body.gl || 'us',
      hl: body.hl || 'en',
    };

    const serperResponse = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': env.SERPER_API_KEY,
      },
      body: JSON.stringify(serperPayload),
    });

    const data = await serperResponse.json();

    return new Response(JSON.stringify(data), {
      status: serperResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(ALLOWED_ORIGIN),
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
