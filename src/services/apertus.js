/**
 * Apertus — the AI brain of Research Curator.
 * Uses the HuggingFace inference router to run Llama 3.1 8B Instruct
 * for two tasks:
 *   1. Generating targeted search queries from a research topic.
 *   2. Evaluating and annotating individual search results.
 */

const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.1-8B-Instruct';

function getApiKey() {
  const key = import.meta.env.VITE_APERTUS_API_KEY;
  if (!key) {
    throw new Error(
      'VITE_APERTUS_API_KEY is not set. Add it to your .env file.'
    );
  }
  return key;
}

async function callLlama(messages, temperature = 0.4, maxTokens = 512) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Apertus API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Apertus returned an empty response.');
  }
  return content;
}

/**
 * Extract the first JSON value (array or object) from a string that may
 * contain prose before/after the JSON block.
 */
function extractJson(text) {
  // Try a JSON code fence first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return JSON.parse(fenced[1].trim());
  }
  // Fall back: find the first [ or { and parse from there
  const arrayStart = text.indexOf('[');
  const objectStart = text.indexOf('{');
  let start = -1;
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    start = arrayStart;
  } else if (objectStart !== -1) {
    start = objectStart;
  }
  if (start === -1) throw new Error('No JSON found in model response');
  return JSON.parse(text.slice(start));
}

/**
 * Generate 3–5 targeted Google search queries for a given research topic.
 *
 * @param {Object} params
 * @param {string} params.topic - The primary research topic
 * @param {string[]} params.subtopics - Optional subtopics to factor in
 * @param {string[]} params.mediaFilters - Active media type filters
 * @param {'quick'|'deep'} params.depth - Search depth
 * @returns {Promise<string[]>} Array of search query strings
 */
export async function generateSearchQueries({ topic, subtopics = [], mediaFilters = [], depth = 'quick' }) {
  const depthNote =
    depth === 'deep'
      ? 'The user wants a Deep Dive: prefer specific, academic, or archival queries. Include site: operators and scholarly terminology where appropriate.'
      : 'The user wants a Quick Overview: prefer broader, accessible queries that surface varied source types quickly.';

  const subtopicNote =
    subtopics.length > 0
      ? `The user is also interested in these subtopics: ${subtopics.join(', ')}.`
      : '';

  const mediaNote =
    mediaFilters.length > 0
      ? `Prioritize sources of these types: ${mediaFilters.join(', ')}.`
      : '';

  const systemPrompt = `You are a research librarian assistant specializing in helping playwrights and dramatists find high-quality research sources. Your task is to generate precise, varied Google search queries that will surface the most useful research material.

Return ONLY a JSON array of 3 to 5 search query strings. No explanation, no prose — just the JSON array.`;

  const userPrompt = `Research topic: "${topic}"
${subtopicNote}
${mediaNote}
${depthNote}

Generate 3–5 specific Google search queries that would surface the most useful research sources for a playwright working on this topic. Vary the query strategies (e.g., academic search, documentary search, archival search, firsthand accounts). Return only a JSON array of strings.`;

  const raw = await callLlama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    0.5,
    256
  );

  let queries;
  try {
    queries = extractJson(raw);
  } catch {
    // Fallback: split lines that look like quoted strings
    queries = raw
      .split('\n')
      .map((l) => l.replace(/^[\d.\-\*\s"]+|["]+$/g, '').trim())
      .filter((l) => l.length > 5)
      .slice(0, 5);
  }

  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error('Apertus did not return valid search queries.');
  }
  return queries.slice(0, 5);
}

/**
 * Evaluate a single search result and return annotation data.
 *
 * @param {Object} result - Raw Serper result { title, link, snippet }
 * @param {string} topic - The original research topic
 * @returns {Promise<Object>} { sourceType, reliabilityTier, reliabilityNote, relevanceNote }
 */
export async function evaluateResult(result, topic) {
  const systemPrompt = `You are a research librarian assistant helping a playwright evaluate source credibility and relevance. You are precise, scholarly, and concise.

Return ONLY a JSON object with exactly these keys:
- sourceType: one of "Article", "Video", "Podcast", "Archive"
- reliabilityTier: one of "peer-reviewed", "scholarly", "documentary", "podcast", "primary", "caution"
- reliabilityNote: one sentence explaining the reliability assessment
- relevanceNote: 1–2 sentences on why this source is relevant to the playwright's topic

No prose outside the JSON.`;

  const userPrompt = `Research topic: "${topic}"

Search result to evaluate:
Title: ${result.title}
URL: ${result.link}
Snippet: ${result.snippet || '(no snippet available)'}

Evaluate this source and return the JSON object.`;

  const raw = await callLlama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    0.2,
    256
  );

  let evaluation;
  try {
    evaluation = extractJson(raw);
  } catch {
    // Return a cautious fallback rather than failing the whole batch
    evaluation = {
      sourceType: 'Article',
      reliabilityTier: 'caution',
      reliabilityNote: 'Could not assess reliability automatically.',
      relevanceNote: result.snippet || 'See source for details.',
    };
  }

  // Validate keys — fill in defaults for any missing
  return {
    sourceType: evaluation.sourceType || 'Article',
    reliabilityTier: evaluation.reliabilityTier || 'caution',
    reliabilityNote: evaluation.reliabilityNote || '',
    relevanceNote: evaluation.relevanceNote || '',
  };
}
