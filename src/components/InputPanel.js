/**
 * InputPanel — the sidebar search form.
 * Handles topic input, subtopic chip input, media type filters, and depth toggle.
 * Emits a 'search' custom event with { topic, subtopics, mediaFilters, depth }.
 */

import { loadSettings, saveSettings } from '../utils/storage.js';

const MEDIA_FILTERS = [
  { id: 'academic', label: 'Academic Articles', icon: '📄' },
  { id: 'documentary', label: 'Documentary / Video', icon: '🎥' },
  { id: 'podcast', label: 'Podcasts', icon: '🎙️' },
  { id: 'archival', label: 'Archival / Primary', icon: '📌' },
];

export class InputPanel {
  constructor(container, { onSearch }) {
    this.container = container;
    this.onSearch = onSearch;

    // State
    const saved = loadSettings();
    this.topic = saved?.topic || '';
    this.subtopics = saved?.subtopics || [];
    this.activeFilters = saved?.activeFilters || MEDIA_FILTERS.map((f) => f.id);
    this.depth = saved?.depth || 'quick';

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <h2>New Research Query</h2>

      <div class="input-group">
        <label for="topic-input">Primary Topic</label>
        <input
          type="text"
          id="topic-input"
          placeholder="e.g. Bread riots in 18th-century France"
          value="${escapeHtml(this.topic)}"
          autocomplete="off"
        />
      </div>

      <div class="input-group">
        <label>Subtopics <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">(press Enter or comma to add)</span></label>
        <div class="chip-input-wrapper" id="chip-wrapper">
          ${this.subtopics.map((s) => this.renderChip(s)).join('')}
          <input
            type="text"
            class="chip-input"
            id="subtopic-input"
            placeholder="${this.subtopics.length === 0 ? 'e.g. gender roles, food scarcity…' : ''}"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="input-group">
        <label>Source Types</label>
        <div class="filter-grid">
          ${MEDIA_FILTERS.map((f) => this.renderFilter(f)).join('')}
        </div>
      </div>

      <div class="input-group">
        <label>Search Depth</label>
        <div class="depth-toggle">
          <button class="depth-option ${this.depth === 'quick' ? 'active' : ''}" data-depth="quick">
            Quick Overview
          </button>
          <button class="depth-option ${this.depth === 'deep' ? 'active' : ''}" data-depth="deep">
            Deep Dive
          </button>
        </div>
      </div>

      <button class="btn-primary" id="search-btn">
        Curate Sources
      </button>

      <div class="status-message" id="status-msg"></div>
    `;
  }

  renderChip(text) {
    return `
      <span class="chip" data-value="${escapeHtml(text)}">
        ${escapeHtml(text)}
        <button class="chip-remove" aria-label="Remove ${escapeHtml(text)}">×</button>
      </span>
    `;
  }

  renderFilter(filter) {
    const isActive = this.activeFilters.includes(filter.id);
    return `
      <label class="filter-toggle ${isActive ? 'active' : ''}" data-filter="${filter.id}">
        <input type="checkbox" ${isActive ? 'checked' : ''} />
        <span class="toggle-box">${isActive ? '✓' : ''}</span>
        <span class="filter-label">${filter.icon} ${filter.label}</span>
      </label>
    `;
  }

  bindEvents() {
    const topicInput = this.container.querySelector('#topic-input');
    const subtopicInput = this.container.querySelector('#subtopic-input');
    const chipWrapper = this.container.querySelector('#chip-wrapper');
    const searchBtn = this.container.querySelector('#search-btn');

    // Topic input
    topicInput.addEventListener('input', () => {
      this.topic = topicInput.value;
      this.persistSettings();
    });

    // Chip / subtopic input
    subtopicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        this.addSubtopic(subtopicInput.value);
        subtopicInput.value = '';
      } else if (e.key === 'Backspace' && subtopicInput.value === '' && this.subtopics.length > 0) {
        this.removeSubtopic(this.subtopics[this.subtopics.length - 1]);
      }
    });

    subtopicInput.addEventListener('blur', () => {
      if (subtopicInput.value.trim()) {
        this.addSubtopic(subtopicInput.value);
        subtopicInput.value = '';
      }
    });

    // Click on wrapper focuses the text input
    chipWrapper.addEventListener('click', (e) => {
      if (!e.target.closest('.chip-remove')) {
        subtopicInput.focus();
      }
    });

    // Remove chip
    chipWrapper.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.chip-remove');
      if (removeBtn) {
        const chip = removeBtn.closest('.chip');
        if (chip) this.removeSubtopic(chip.dataset.value);
      }
    });

    // Media filters
    this.container.addEventListener('click', (e) => {
      const toggle = e.target.closest('.filter-toggle');
      if (toggle && toggle.dataset.filter) {
        e.preventDefault();
        this.toggleFilter(toggle.dataset.filter);
      }
    });

    // Depth toggle
    this.container.addEventListener('click', (e) => {
      const depthBtn = e.target.closest('.depth-option');
      if (depthBtn && depthBtn.dataset.depth) {
        this.setDepth(depthBtn.dataset.depth);
      }
    });

    // Search button
    searchBtn.addEventListener('click', () => this.handleSearch());

    // Enter in topic fires search
    topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
  }

  addSubtopic(value) {
    const clean = value.replace(/,/g, '').trim();
    if (!clean || this.subtopics.includes(clean)) return;
    this.subtopics.push(clean);
    this.refreshChips();
    this.persistSettings();
  }

  removeSubtopic(value) {
    this.subtopics = this.subtopics.filter((s) => s !== value);
    this.refreshChips();
    this.persistSettings();
  }

  refreshChips() {
    const chipWrapper = this.container.querySelector('#chip-wrapper');
    const subtopicInput = this.container.querySelector('#subtopic-input');
    if (!chipWrapper || !subtopicInput) return;

    // Remove old chips, keep the input
    chipWrapper.querySelectorAll('.chip').forEach((c) => c.remove());
    const chips = this.subtopics.map((s) => {
      const el = document.createElement('span');
      el.className = 'chip';
      el.dataset.value = s;
      el.innerHTML = `${escapeHtml(s)}<button class="chip-remove" aria-label="Remove ${escapeHtml(s)}">×</button>`;
      return el;
    });
    chips.forEach((c) => chipWrapper.insertBefore(c, subtopicInput));
    subtopicInput.placeholder = this.subtopics.length === 0 ? 'e.g. gender roles, food scarcity…' : '';
  }

  toggleFilter(filterId) {
    if (this.activeFilters.includes(filterId)) {
      if (this.activeFilters.length === 1) return; // keep at least one
      this.activeFilters = this.activeFilters.filter((f) => f !== filterId);
    } else {
      this.activeFilters.push(filterId);
    }

    // Update UI
    this.container.querySelectorAll('.filter-toggle').forEach((toggle) => {
      const id = toggle.dataset.filter;
      const active = this.activeFilters.includes(id);
      const filter = MEDIA_FILTERS.find((f) => f.id === id);
      toggle.className = `filter-toggle ${active ? 'active' : ''}`;
      toggle.querySelector('.toggle-box').textContent = active ? '✓' : '';
      toggle.querySelector('input[type=checkbox]').checked = active;
    });

    this.persistSettings();
  }

  setDepth(depth) {
    this.depth = depth;
    this.container.querySelectorAll('.depth-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.depth === depth);
    });
    this.persistSettings();
  }

  persistSettings() {
    saveSettings({
      topic: this.topic,
      subtopics: this.subtopics,
      activeFilters: this.activeFilters,
      depth: this.depth,
    });
  }

  setSearching(isSearching) {
    const btn = this.container.querySelector('#search-btn');
    if (!btn) return;
    btn.disabled = isSearching;
    btn.textContent = isSearching ? 'Searching…' : 'Curate Sources';
  }

  showStatus(message, isError = false) {
    const el = this.container.querySelector('#status-msg');
    if (!el) return;
    el.textContent = message;
    el.className = `status-message visible${isError ? ' error' : ''}`;
  }

  hideStatus() {
    const el = this.container.querySelector('#status-msg');
    if (el) el.className = 'status-message';
  }

  handleSearch() {
    const topic = this.topic.trim();
    if (!topic) {
      this.showStatus('Please enter a research topic before searching.', true);
      return;
    }
    const mediaFilters = MEDIA_FILTERS
      .filter((f) => this.activeFilters.includes(f.id))
      .map((f) => f.label);

    this.onSearch({ topic, subtopics: this.subtopics, mediaFilters, depth: this.depth });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
