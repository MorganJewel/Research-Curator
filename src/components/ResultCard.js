/**
 * ResultCard — renders a single research source card.
 * Includes title link, source type badge, reliability badge with
 * emoji + note, relevance note, and a delete button.
 */

import { getBadge, getSourceIcon } from '../utils/badges.js';

/**
 * Build the HTML string for a result card.
 *
 * @param {Object} card
 * @param {string} card.id
 * @param {string} card.title
 * @param {string} card.url
 * @param {string} card.displayLink
 * @param {string} card.sourceType     - "Article" | "Video" | "Podcast" | "Archive"
 * @param {string} card.reliabilityTier
 * @param {string} card.reliabilityNote
 * @param {string} card.relevanceNote
 * @param {string} [card.query]        - The search query that surfaced this card
 */
export function renderResultCard(card) {
  const badge = getBadge(card.reliabilityTier);
  const sourceIcon = getSourceIcon(card.sourceType);
  const displayUrl = card.displayLink || card.url;

  return `
    <div class="result-card" data-id="${escapeAttr(card.id)}">
      <div class="result-card__header">
        <div class="result-card__title">
          <a href="${escapeAttr(card.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(card.title)}
          </a>
        </div>
        <div class="result-card__delete">
          <button class="btn-danger" data-action="delete" data-id="${escapeAttr(card.id)}" title="Remove from packet">
            ✕
          </button>
        </div>
      </div>

      <div class="result-card__url">${escapeHtml(displayUrl)}</div>

      <div class="result-card__badges">
        <span class="badge badge--source">${sourceIcon} ${escapeHtml(card.sourceType)}</span>
        <span class="badge ${badge.cssClass}" title="${escapeAttr(badge.description)}">
          ${badge.emoji} ${escapeHtml(badge.label)}
        </span>
      </div>

      ${card.reliabilityNote ? `
        <div class="result-card__reliability-note">
          ${escapeHtml(card.reliabilityNote)}
        </div>
      ` : ''}

      ${card.relevanceNote ? `
        <div class="result-card__relevance-note">
          ${escapeHtml(card.relevanceNote)}
        </div>
      ` : ''}

      ${card.query ? `
        <div class="result-card__query-label" title="From query: ${escapeAttr(card.query)}">
          via: ${escapeHtml(truncate(card.query, 40))}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Mount click handlers on a result card element.
 * @param {HTMLElement} el - the .result-card element
 * @param {Function} onDelete - called with the card id
 */
export function bindResultCardEvents(el, onDelete) {
  el.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      onDelete(deleteBtn.dataset.id);
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
