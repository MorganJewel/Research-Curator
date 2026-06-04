/**
 * Research Curator — main entry point.
 *
 * Orchestrates:
 *  1. InputPanel (sidebar form)
 *  2. ResearchPacket (living result list)
 *  3. ExportButton (PDF export)
 *  4. Search pipeline: generateSearchQueries → searchMultiple → evaluateResult
 */

import './style.css';
import { InputPanel } from './components/InputPanel.js';
import { ResearchPacket } from './components/ResearchPacket.js';
import { ExportButton } from './components/ExportButton.js';
import { generateSearchQueries, evaluateResult } from './services/apertus.js';
import { searchMultiple } from './services/serper.js';
import { loadPacket, addCardToPacket } from './utils/storage.js';

// ── DOM scaffold ──────────────────────────────────────────────────────────────

const appEl = document.getElementById('app');

appEl.innerHTML = `
  <header class="app-header">
    <h1>Research Curator</h1>
    <span class="tagline">A dramaturg's research companion</span>
    <div style="flex:1"></div>
    <div id="export-btn-mount"></div>
  </header>

  <main class="app-main">
    <aside class="sidebar" id="sidebar"></aside>
    <section class="main-content" id="main-content"></section>
  </main>
`;

// ── State ─────────────────────────────────────────────────────────────────────

let packet = loadPacket();

// ── Component: Research Packet ────────────────────────────────────────────────

const packetComponent = new ResearchPacket(
  document.getElementById('main-content'),
  {
    onPacketChange: (updated) => {
      packet = updated;
      exportButtonComponent.setDisabled(packet.length === 0);
    },
  }
);

packetComponent.setPacket(packet);

// ── Component: Export Button ──────────────────────────────────────────────────

const exportButtonComponent = new ExportButton(
  document.getElementById('export-btn-mount'),
  { getPacket: () => packet }
);
exportButtonComponent.setDisabled(packet.length === 0);

// ── Component: Input Panel ────────────────────────────────────────────────────

const inputPanel = new InputPanel(document.getElementById('sidebar'), {
  onSearch: handleSearch,
});

// ── Search Pipeline ───────────────────────────────────────────────────────────

async function handleSearch({ topic, subtopics, mediaFilters, depth }) {
  inputPanel.setSearching(true);
  inputPanel.hideStatus();
  packetComponent.showProgress('Generating search queries…');

  try {
    // Step 1: Generate search queries with Apertus
    let queries;
    try {
      queries = await generateSearchQueries({ topic, subtopics, mediaFilters, depth });
    } catch (err) {
      console.error('Query generation error:', err);
      inputPanel.showStatus(`Could not generate queries: ${err.message}`, true);
      packetComponent.hideProgress();
      return;
    }

    // Show queries in progress panel
    packetComponent.setProgressQueries(queries);
    packetComponent.updateProgressTitle('Searching the web…');

    // Step 2: Run all queries via Serper (in parallel)
    let rawResults;
    try {
      rawResults = await searchMultiple(queries, 8);
    } catch (err) {
      console.error('Search error:', err);
      inputPanel.showStatus(`Search failed: ${err.message}`, true);
      packetComponent.hideProgress();
      return;
    }

    if (rawResults.length === 0) {
      inputPanel.showStatus('No results found for those queries. Try a different topic.', false);
      packetComponent.hideProgress();
      return;
    }

    // Mark queries as done
    queries.forEach((_, i) => packetComponent.setQueryStatus(i, 'done'));

    // Step 3: Evaluate each result with Apertus (in parallel, up to 12 results)
    packetComponent.updateProgressTitle(`Evaluating ${Math.min(rawResults.length, 12)} sources…`);
    const toEvaluate = rawResults.slice(0, 12);

    const evaluations = await Promise.allSettled(
      toEvaluate.map((result) => evaluateResult(result, topic))
    );

    // Build cards from successful evaluations
    const newCards = [];
    evaluations.forEach((outcome, i) => {
      const raw = toEvaluate[i];
      let evaluation;
      if (outcome.status === 'fulfilled') {
        evaluation = outcome.value;
      } else {
        evaluation = {
          sourceType: 'Article',
          reliabilityTier: 'caution',
          reliabilityNote: 'Reliability could not be assessed automatically.',
          relevanceNote: raw.snippet || '',
        };
      }

      // Find which query surfaced this result
      const query = findQueryForResult(raw, queries);

      const card = {
        id: generateId(),
        title: raw.title,
        url: raw.link,
        displayLink: raw.displayLink,
        sourceType: evaluation.sourceType,
        reliabilityTier: evaluation.reliabilityTier,
        reliabilityNote: evaluation.reliabilityNote,
        relevanceNote: evaluation.relevanceNote,
        query,
        addedAt: Date.now(),
      };

      // Persist to localStorage (deduplicates by URL)
      const updated = addCardToPacket(card);
      if (updated.some((c) => c.id === card.id)) {
        newCards.push(card);
      }
    });

    // Reload full packet from storage (ensures deduplication is reflected)
    packet = loadPacket();
    packetComponent.setPacket(packet);
    exportButtonComponent.setDisabled(packet.length === 0);

    packetComponent.hideProgress();

    const addedCount = newCards.length;
    if (addedCount > 0) {
      inputPanel.showStatus(`Added ${addedCount} new source${addedCount === 1 ? '' : 's'} to your packet.`);
    } else {
      inputPanel.showStatus('All results were already in your packet. Try a different topic or subtopics.');
    }
  } catch (err) {
    console.error('Unexpected search error:', err);
    inputPanel.showStatus(`An unexpected error occurred: ${err.message}`, true);
    packetComponent.hideProgress();
  } finally {
    inputPanel.setSearching(false);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Naive heuristic: find which query is most likely to have surfaced a result
 * by checking if the result URL or title contains keywords from each query.
 * Falls back to the first query.
 */
function findQueryForResult(result, queries) {
  if (!queries || queries.length === 0) return '';
  const target = `${result.title} ${result.link} ${result.snippet}`.toLowerCase();
  let best = queries[0];
  let bestScore = 0;

  for (const q of queries) {
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const score = words.reduce((acc, w) => acc + (target.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
