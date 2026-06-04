/**
 * ExportButton — generates a clean PDF of the research packet using html2pdf.js.
 * html2pdf.js is loaded via CDN script tag in index.html.
 */

import { getBadge, getSourceIcon } from '../utils/badges.js';

export class ExportButton {
  constructor(container, { getPacket }) {
    this.container = container;
    this.getPacket = getPacket;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <button class="export-btn" id="export-pdf-btn" title="Export research packet as PDF">
        <span>⬇</span> Export PDF
      </button>
    `;
  }

  bindEvents() {
    const btn = this.container.querySelector('#export-pdf-btn');
    btn.addEventListener('click', () => this.handleExport());
  }

  setDisabled(disabled) {
    const btn = this.container.querySelector('#export-pdf-btn');
    if (btn) btn.disabled = disabled;
  }

  async handleExport() {
    const packet = this.getPacket();
    if (packet.length === 0) {
      alert('Your research packet is empty. Add some sources before exporting.');
      return;
    }

    if (typeof window.html2pdf === 'undefined') {
      alert('PDF export is not available. Please check your internet connection and reload the page.');
      return;
    }

    const btn = this.container.querySelector('#export-pdf-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating PDF…';

    try {
      const element = this.buildPdfContent(packet);
      document.body.appendChild(element);

      const opt = {
        margin: [12, 12, 12, 12],
        filename: `research-packet-${formatDate()}.pdf`,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await window.html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>⬇</span> Export PDF';
    }
  }

  buildPdfContent(packet) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a;
      background: #fff;
      padding: 24px 32px;
      max-width: 720px;
      margin: 0 auto;
    `;

    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    wrapper.innerHTML = `
      <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 6px; letter-spacing: -0.02em;">
          Research Packet
        </h1>
        <p style="margin: 0; font-size: 12px; color: #555; font-style: italic;">
          Generated ${now} · ${packet.length} source${packet.length === 1 ? '' : 's'}
        </p>
      </div>

      ${packet.map((card, i) => this.buildPdfCard(card, i + 1)).join('')}

      <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #888; text-align: center; font-style: italic;">
        Compiled with Research Curator — a tool for playwrights and researchers
      </div>
    `;

    return wrapper;
  }

  buildPdfCard(card, index) {
    const badge = getBadge(card.reliabilityTier);
    const sourceIcon = getSourceIcon(card.sourceType);

    const badgeColors = {
      'peer-reviewed': '#1a5c36',
      scholarly: '#1a3a6b',
      documentary: '#4a1a6b',
      podcast: '#6b3a1a',
      primary: '#6b1a1a',
      caution: '#6b5a10',
    };
    const badgeColor = badgeColors[card.reliabilityTier] || badgeColors.caution;

    return `
      <div style="
        margin-bottom: 20px;
        padding: 14px 16px;
        border: 1px solid #ddd;
        border-left: 3px solid ${badgeColor};
        border-radius: 4px;
        page-break-inside: avoid;
      ">
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 11px; color: #888; flex-shrink: 0; margin-top: 2px;">${index}.</span>
          <div style="flex: 1;">
            <a href="${escapeAttr(card.url)}"
               style="font-size: 14px; font-weight: 600; color: #1a1a1a; text-decoration: none; line-height: 1.3; display: block;">
              ${escapeHtml(card.title)}
            </a>
            <div style="font-size: 10px; color: #888; margin-top: 3px;">${escapeHtml(card.displayLink || card.url)}</div>
          </div>
        </div>

        <div style="display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap;">
          <span style="
            font-size: 10px; font-weight: 600; padding: 2px 8px;
            background: #f0f0f0; color: #444; border-radius: 3px;
          ">${sourceIcon} ${escapeHtml(card.sourceType)}</span>
          <span style="
            font-size: 10px; font-weight: 600; padding: 2px 8px;
            background: ${badgeColor}22; color: ${badgeColor}; border-radius: 3px;
          ">${badge.emoji} ${escapeHtml(badge.label)}</span>
        </div>

        ${card.reliabilityNote ? `
          <div style="font-size: 11px; color: #555; margin-bottom: 5px;">
            ${escapeHtml(card.reliabilityNote)}
          </div>
        ` : ''}

        ${card.relevanceNote ? `
          <div style="font-size: 12px; color: #222; font-style: italic; border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px; line-height: 1.5;">
            ${escapeHtml(card.relevanceNote)}
          </div>
        ` : ''}
      </div>
    `;
  }
}

function formatDate() {
  return new Date().toISOString().split('T')[0];
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
