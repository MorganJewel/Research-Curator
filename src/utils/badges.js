/**
 * Reliability tier badge definitions.
 * Each tier has an emoji, label, CSS class, and a short description shown in the UI.
 */

export const RELIABILITY_TIERS = {
  'peer-reviewed': {
    emoji: '✅',
    label: 'Peer-reviewed',
    cssClass: 'badge--peer-reviewed',
    description: 'Published in a peer-reviewed academic journal or conference.',
  },
  scholarly: {
    emoji: '📚',
    label: 'Scholarly / Reputable',
    cssClass: 'badge--scholarly',
    description: 'Published by a reputable institution, press, or established outlet.',
  },
  documentary: {
    emoji: '🎥',
    label: 'Verified Documentary',
    cssClass: 'badge--documentary',
    description: 'A verified documentary or video from a credible broadcaster or filmmaker.',
  },
  podcast: {
    emoji: '🎙️',
    label: 'Reputable Podcast',
    cssClass: 'badge--podcast',
    description: 'A podcast from a recognized host or institution.',
  },
  primary: {
    emoji: '📌',
    label: 'Primary / Archival',
    cssClass: 'badge--primary',
    description: 'A primary source or archival document.',
  },
  caution: {
    emoji: '⚠️',
    label: 'Use with caution',
    cssClass: 'badge--caution',
    description: 'Source credibility is unclear. Verify independently before use.',
  },
};

export const SOURCE_TYPE_ICONS = {
  Article: '📄',
  Video: '🎬',
  Podcast: '🎧',
  Archive: '🗄️',
};

/**
 * Returns the badge config for a given reliability tier string.
 * Falls back to 'caution' if tier is unrecognized.
 */
export function getBadge(tier) {
  return RELIABILITY_TIERS[tier] || RELIABILITY_TIERS['caution'];
}

/**
 * Returns the icon for a given source type string.
 */
export function getSourceIcon(sourceType) {
  return SOURCE_TYPE_ICONS[sourceType] || '📄';
}
