/**
 * Serper search service.
 *
 * In production, requests are routed through the Cloudflare Worker proxy
 * (worker/serper-proxy.js) to avoid CORS issues and hide the API key.
 * Set VITE_SERPER_PROXY_URL in your .env to your deployed Worker URL.
 *
 * In local development without a proxy, the service falls back to calling
 * the Serper API directly using VITE_SERPER_API_KEY. Note: this will fail
 * in the browser due to CORS unless you use a browser extension or run
 * a local proxy. The Vite dev server does not proxy external APIs by default.
 */

const SERPER_DIRECT_URL = 'https://google.serper.dev/search';

function getProxyUrl() {
  return import.meta.env.VITE_SERPER_PROXY_URL || null;
}

function getDirectApiKey() {
  return import.meta.env.VITE_SERPER_API_KEY || null;
}

/**
 * Perform a Google search via Serper.
 *
 * @param {string} query - The search query string
 * @param {number} [numResults=10] - Number of results to request
 * @returns {Promise<Array>} Array of result objects: { title, link, snippet, displayLink }
 */
export async function search(query, numResults = 10) {
  const proxyUrl = getProxyUrl();

  let response;

  if (proxyUrl) {
    // Use the Cloudflare Worker proxy (production path)
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: numResults }),
    });
  } else {
    // Direct call (local dev fallback — may hit CORS in browser)
    const apiKey = getDirectApiKey();
    if (!apiKey) {
      throw new Error(
        'Neither VITE_SERPER_PROXY_URL nor VITE_SERPER_API_KEY is set. ' +
          'Set one in your .env file.'
      );
    }
    response = await fetch(SERPER_DIRECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ q: query, num: numResults }),
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Serper API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Normalize organic results
  const organic = data.organic || [];
  return organic.map((item) => ({
    title: item.title || '(No title)',
    link: item.link || '#',
    snippet: item.snippet || '',
    displayLink: item.displayLink || item.link || '',
  }));
}

/**
 * Run multiple queries in parallel, deduplicating by URL.
 *
 * @param {string[]} queries
 * @param {number} [numPerQuery=8]
 * @returns {Promise<Array>} Deduplicated array of result objects
 */
export async function searchMultiple(queries, numPerQuery = 8) {
  const results = await Promise.allSettled(
    queries.map((q) => search(q, numPerQuery))
  );

  const seen = new Set();
  const combined = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const item of result.value) {
        if (!seen.has(item.link)) {
          seen.add(item.link);
          combined.push(item);
        }
      }
    }
    // Silently skip failed individual queries — partial results are better than nothing
  }

  return combined;
}
