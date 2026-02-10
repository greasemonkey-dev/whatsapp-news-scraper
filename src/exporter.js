/**
 * CSV Exporter Module
 * Exports parsed WhatsApp messages to CSV format with UTF-8 encoding for Hebrew text
 */

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

/**
 * Export messages to CSV file
 * @param {Array} messages - Array of parsed message objects
 * @param {string} filePath - Path to the output CSV file
 * @param {Object} options - Export options
 * @param {boolean} options.append - If true, append to existing file without duplicate headers
 * @returns {Promise<void>}
 */
async function exportToCSV(messages, filePath, options = {}) {
  const { append = false } = options;

  // Check if file exists for append mode
  const fileExists = fs.existsSync(filePath);
  const shouldAppend = append && fileExists;

  // Define CSV headers
  const headers = [
    { id: 'date', title: 'Date' },
    { id: 'time', title: 'Time' },
    { id: 'sender', title: 'Sender' },
    { id: 'reporter', title: 'Reporter' },
    { id: 'content', title: 'Message' },
    { id: 'hasMedia', title: 'Has_Media' },
    { id: 'links', title: 'Links' }
  ];

  // Create CSV writer configuration
  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    append: shouldAppend,
    encoding: 'utf8'
  });

  // Transform messages to match CSV structure
  const records = messages.map(msg => ({
    date: msg.date || '',
    time: msg.time || '',
    sender: msg.sender || '',
    reporter: msg.reporter || '',
    content: msg.content || '',
    hasMedia: msg.hasMedia || false,
    links: Array.isArray(msg.links) ? msg.links.join(', ') : ''
  }));

  // Write records to CSV
  await csvWriter.writeRecords(records);
}

module.exports = {
  exportToCSV
};
