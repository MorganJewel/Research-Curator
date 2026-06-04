const STORAGE_KEY = 'research_curator_packet';
const SETTINGS_KEY = 'research_curator_settings';

/**
 * Load the research packet (array of result cards) from localStorage.
 * Returns an empty array if nothing is stored or data is corrupt.
 */
export function loadPacket() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save the research packet to localStorage.
 * @param {Array} packet - Array of result card objects
 */
export function savePacket(packet) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packet));
  } catch (e) {
    console.warn('Research Curator: Could not save to localStorage', e);
  }
}

/**
 * Add a single result card to the packet and persist.
 * Returns the updated packet.
 * @param {Object} card - A result card object
 */
export function addCardToPacket(card) {
  const packet = loadPacket();
  // Avoid exact duplicates by URL
  if (packet.some((c) => c.url === card.url)) {
    return packet;
  }
  const updated = [card, ...packet];
  savePacket(updated);
  return updated;
}

/**
 * Remove a result card by its id and persist.
 * Returns the updated packet.
 * @param {string} id - The card's unique id
 */
export function removeCardFromPacket(id) {
  const packet = loadPacket();
  const updated = packet.filter((c) => c.id !== id);
  savePacket(updated);
  return updated;
}

/**
 * Clear all stored results.
 */
export function clearPacket() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Load persisted UI settings (topic, subtopics, filters, depth).
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save UI settings.
 * @param {Object} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Silently fail — settings persistence is non-critical
  }
}
