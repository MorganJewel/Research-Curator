/**
 * ResearchPacket — the "living packet" of curated research cards.
 * Renders cards grouped by the search query that surfaced them,
 * handles deletion, start over, and shows search progress.
 */

import { renderResultCard } from './ResultCard.js';
import { removeCardFromPacket, clearPacket } from '../utils/storage.js';

export class ResearchPacket {
  constructor(container, { onPacketChange }) {
    this.container = container;
    this.onPacketChange = onPacketChange;
    this.packet = [];
    this.render();
  }

  setPacket(packet) {
    this.packet = packet;
    this.renderCards();
  }

  addCards(newCards) {
    this.packet = [...newCards, ...this.packet.filter(
      (c) => !newCards.some((n) => n.id === c.id)
    )];
    this.renderCards();
  }

  render() {
    this.container.innerHTML = `
      <div class="packet-section">
        <div class="packet-header">
          <div>
            <h2 style="display:inline">Research Packet</h2>
            <span class="packet-count" id="packet-count"></span>
          </div>
          <div class="packet-actions" id="packet-actions"></div>
        </div>

        <div class="search-progress" id="search-progress">
          <div class="search-progress__title" id="progress-title">Generating search queries…</div>
          <ul class="search-progress__queries" id="progress-queries"></ul>
        </div>

        <div id="cards-container"></div>
      </div>
    `;

    this.renderCards();
  }

  renderCards() {
    const container = this.container.querySelector('#cards-container');
    const countEl = this.container.querySelector('#packet-count');
    const actionsEl = this.container.querySelector('#packet-actions');

    if (!container) return;

    const n = this.packet.length;
    if (countEl) {
      countEl.textContent = n > 0 ? `— ${n} source${n === 1 ? '' : 's'}` : '';
    }

    if (actionsEl) {
      actionsEl.innerHTML = n > 0 ? `
        <button class="btn-secondary" id="start-over-btn" title="Clear everything and start fresh">
          Start Over
        </button>
      ` : '';

      const startOverBtn = actionsEl.querySelector('#start-over-btn');
      if (startOverBtn) {
        startOverBtn.addEventListener('click', () => this.handleStartOver());
      }
    }

    if (n === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">Research Curator</div>
          <div class="empty-state__title">Your research packet is empty</div>
          <div class="empty-state__subtitle">
            Enter a topic in the panel on the left and click
            <em>Curate Sources</em> to begin building your research packet.
          </div>
        </div>
      `;
      return;
    }

    // Group cards by thematic section
    const groups = new Map();
    for (const card of this.packet) {
      const key = card.thematicSection || 'General Research';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(card);
    }

    let html = '';
    for (const [section, cards] of groups) {
      html += `
        <div class="result-section">
          <div class="result-section__header">
            <span class="result-section__title">${escapeHtml(section)}</span>
            <span class="result-section__count">${cards.length} source${cards.length === 1 ? '' : 's'}</span>
          </div>
          <div class="result-section__cards">
            ${cards.map(renderResultCard).join('')}
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    // Bind delete handlers
    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => this.handleDelete(btn.dataset.id));
    });
  }

  handleDelete(id) {
    const updated = removeCardFromPacket(id);
    this.packet = updated;
    this.renderCards();
    this.onPacketChange(updated);
  }

  handleStartOver() {
    if (!confirm('Clear your entire research packet and start fresh?')) return;
    clearPacket();
    this.packet = [];
    this.renderCards();
    this.onPacketChange([]);
  }

  /* ── Progress Indicator ── */

  showProgress(title = 'Generating search queries…') {
    const el = this.container.querySelector('#search-progress');
    const titleEl = this.container.querySelector('#progress-title');
    const queriesEl = this.container.querySelector('#progress-queries');
    if (el) el.classList.add('visible');
    if (titleEl) titleEl.textContent = title;
    if (queriesEl) queriesEl.innerHTML = '';
  }

  updateProgressTitle(title) {
    const titleEl = this.container.querySelector('#progress-title');
    if (titleEl) titleEl.textContent = title;
  }

  setProgressQueries(queries) {
    const queriesEl = this.container.querySelector('#progress-queries');
    if (!queriesEl) return;
    queriesEl.innerHTML = queries
      .map((q, i) => `
        <li class="search-progress__query" data-query-index="${i}">
          <span class="query-dot"></span>
          <span>${escapeHtml(q)}</span>
        </li>
      `)
      .join('');
  }

  setQueryStatus(index, status) {
    const el = this.container.querySelector(`[data-query-index="${index}"]`);
    if (el) el.className = `search-progress__query ${status}`;
  }

  hideProgress() {
    const el = this.container.querySelector('#search-progress');
    if (el) el.classList.remove('visible');
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
