/**
 * Message Parser Module
 * Parses WhatsApp messages to extract reporter names, content, links, and media indicators
 */

/**
 * Format Unix timestamp to DD/MM/YYYY
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format Unix timestamp to HH:MM
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse WhatsApp message text to extract structured data
 * @param {string} messageText - Raw message text
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {boolean} hasMedia - Optional flag indicating if message has media attachments
 * @returns {Object} Parsed message object
 */
function parseMessage(messageText, timestamp, hasMedia = false) {
  if (!messageText || typeof messageText !== 'string') {
    return {
      reporter: '',
      content: '',
      date: formatDate(timestamp),
      time: formatTime(timestamp),
      links: [],
      hasMedia
    };
  }

  // Split message into lines
  const lines = messageText.trim().split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return {
      reporter: '',
      content: '',
      date: formatDate(timestamp),
      time: formatTime(timestamp),
      links: [],
      hasMedia
    };
  }

  // First line is the reporter name (Hebrew text)
  const reporter = lines[0].trim();

  // Filter out the source tag line (usually contains "צ'אט" or similar patterns)
  const sourceTagPattern = /צ'אט|chat|קבוצת/i;
  const contentLines = lines.slice(1).filter(line => !sourceTagPattern.test(line));

  // Join remaining lines as content
  const content = contentLines.join('\n').trim();

  // Extract links using regex
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const links = content.match(linkRegex) || [];

  return {
    reporter,
    content,
    date: formatDate(timestamp),
    time: formatTime(timestamp),
    links,
    hasMedia
  };
}

module.exports = {
  parseMessage,
  formatDate,
  formatTime
};
