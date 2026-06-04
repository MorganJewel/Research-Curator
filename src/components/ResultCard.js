import { getBadge, getSourceIcon } from '../utils/badges.js';

export function renderResultCard(card) {
  const badge = getBadge(card.reliabilityTier);
  const sourceLabel = getSourceIcon(card.sourceType);
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
          <button class="btn-danger" data-action="delete" data-id="${escapeAttr(card.id)}" title="Remove">
            Remove
          </button>
        </div>
      </div>

      <div class="result-card__url">${escapeHtml(displayUrl)}</div>

      <div class="result-card__badges">
        <span class="badge badge--source">${escapeHtml(sourceLabel)}</span>
        <span class="badge ${badge.cssClass}" title="${escapeAttr(badge.description)}">
          ${escapeHtml(badge.label)}
        </span>
      </div>

      ${card.reliabilityNote ? `
        <div class="result-card__reliability-note">${escapeHtml(card.reliabilityNote)}</div>
      ` : ''}

      ${card.relevanceNote ? `
        <div class="result-card__relevance-note">${escapeHtml(card.relevanceNote)}</div>
      ` : ''}
    </div>
  `;
}

export function bindResultCardEvents(el, onDelete) {
  el.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (deleteBtn) onDelete(deleteBtn.dataset.id);
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
