export const RELIABILITY_TIERS = {
  'peer-reviewed': {
    label: 'Peer-Reviewed',
    cssClass: 'badge--peer-reviewed',
    description: 'Published in a peer-reviewed academic journal or conference.',
  },
  scholarly: {
    label: 'Scholarly',
    cssClass: 'badge--scholarly',
    description: 'Published by a reputable institution, press, or established outlet.',
  },
  documentary: {
    label: 'Documentary',
    cssClass: 'badge--documentary',
    description: 'A verified documentary or video from a credible broadcaster or filmmaker.',
  },
  podcast: {
    label: 'Podcast',
    cssClass: 'badge--podcast',
    description: 'A podcast from a recognized host or institution.',
  },
  primary: {
    label: 'Primary Source',
    cssClass: 'badge--primary',
    description: 'A primary source or archival document.',
  },
  caution: {
    label: 'Unverified',
    cssClass: 'badge--caution',
    description: 'Source credibility is unclear. Verify independently before use.',
  },
};

export const SOURCE_TYPE_LABELS = {
  Article: 'Article',
  Video:   'Video',
  Podcast: 'Podcast',
  Archive: 'Archive',
};

export function getBadge(tier) {
  return RELIABILITY_TIERS[tier] || RELIABILITY_TIERS['caution'];
}

export function getSourceIcon(sourceType) {
  return SOURCE_TYPE_LABELS[sourceType] || 'Article';
}
