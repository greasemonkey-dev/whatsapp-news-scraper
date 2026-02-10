/**
 * Message Scraper Module
 * Orchestrates the scraping workflow - fetches messages, parses, updates state, exports to CSV
 */

const { parseMessage } = require('./parser');
const { exportToCSV } = require('./exporter');
const StateManager = require('./stateManager');
const logger = require('./logger');
const config = require('./config');

/**
 * Scrape messages from a WhatsApp chat
 * Handles both full history (first run) and incremental updates
 * @param {Object} chat - WhatsApp chat object
 * @param {boolean} isFirstRun - Whether this is the first run
 * @returns {Promise<Array>} Array of parsed message objects
 */
async function scrapeMessages(chat, isFirstRun) {
  const stateManager = new StateManager();
  const state = await stateManager.loadState();

  let messages = [];
  let fetchedMessages = [];

  try {
    // Determine fetch strategy
    if (isFirstRun || state.lastProcessedTimestamp === 0) {
      logger.info('First run detected - fetching all message history');
      fetchedMessages = await chat.fetchMessages({ limit: Infinity });
      logger.info(`Fetched ${fetchedMessages.length} messages from full history`);
    } else {
      logger.info('Incremental run - fetching recent messages');
      fetchedMessages = await chat.fetchMessages({ limit: 100 });

      // Filter messages by timestamp
      const beforeFilter = fetchedMessages.length;
      fetchedMessages = fetchedMessages.filter(
        msg => msg.timestamp > state.lastProcessedTimestamp
      );
      logger.info(`Fetched ${beforeFilter} recent messages, ${fetchedMessages.length} are new`);
    }

    // Parse each message
    const parsedMessages = [];
    let skippedCount = 0;
    let errorCount = 0;

    for (const msg of fetchedMessages) {
      try {
        // Skip messages without body text
        if (!msg.body || typeof msg.body !== 'string' || !msg.body.trim()) {
          skippedCount++;
          continue;
        }

        // Parse message
        const hasMedia = msg.hasMedia || false;
        const parsed = parseMessage(msg.body, msg.timestamp, hasMedia);

        // Add sender information
        parsed.sender = msg.author || msg.from || '';

        parsedMessages.push(parsed);
      } catch (error) {
        errorCount++;
        logger.warn(`Failed to parse message (ID: ${msg.id}): ${error.message}`);
        // Continue processing other messages
        continue;
      }
    }

    logger.info(
      `Parsed ${parsedMessages.length} messages (skipped: ${skippedCount}, errors: ${errorCount})`
    );

    // Update state with latest timestamp
    if (parsedMessages.length > 0) {
      // Find the latest timestamp from fetched messages
      const latestTimestamp = Math.max(
        ...fetchedMessages.map(msg => msg.timestamp)
      );

      const newTotalCount = state.totalMessagesProcessed + parsedMessages.length;

      await stateManager.updateState({
        chatId: chat.id._serialized,
        chatName: chat.name,
        lastProcessedTimestamp: latestTimestamp,
        totalMessagesProcessed: newTotalCount
      });

      logger.success(
        `Updated state: latest timestamp=${latestTimestamp}, total processed=${newTotalCount}`
      );
    }

    return parsedMessages;
  } catch (error) {
    logger.error(`Error during message scraping: ${error.message}`);
    throw error;
  }
}

/**
 * Main scrape function - orchestrates the full workflow
 * Fetches messages, parses them, exports to CSV, and returns summary
 * @param {Object} chat - WhatsApp chat object
 * @returns {Promise<Object>} Results summary
 */
async function scrape(chat) {
  try {
    logger.info('Starting scrape workflow');

    // Initialize state manager
    const stateManager = new StateManager();
    const state = await stateManager.loadState();

    // Determine if this is the first run
    const isFirstRun = state.lastProcessedTimestamp === 0;

    // Scrape messages
    const messages = await scrapeMessages(chat, isFirstRun);

    // Handle case with no new messages
    if (messages.length === 0) {
      logger.info('No new messages to process');
      return {
        success: true,
        messagesProcessed: 0,
        isFirstRun,
        outputFile: config.paths.output,
        message: 'No new messages found'
      };
    }

    // Export to CSV
    logger.info(`Exporting ${messages.length} messages to CSV`);
    await exportToCSV(messages, config.paths.output, { append: !isFirstRun });
    logger.success(`Successfully exported to ${config.paths.output}`);

    // Return summary
    return {
      success: true,
      messagesProcessed: messages.length,
      isFirstRun,
      outputFile: config.paths.output,
      message: `Successfully processed ${messages.length} messages`
    };
  } catch (error) {
    logger.error(`Scrape workflow failed: ${error.message}`);
    return {
      success: false,
      messagesProcessed: 0,
      error: error.message,
      message: 'Scrape workflow failed'
    };
  }
}

module.exports = {
  scrapeMessages,
  scrape
};
