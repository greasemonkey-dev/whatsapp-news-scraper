/**
 * Main Entry Point - WhatsApp News Chat Scraper
 * Orchestrates the complete scraping workflow with error handling and cleanup
 */

const { createClient, connectWithRetry, findChat } = require('./src/client');
const { scrape } = require('./src/scraper');
const logger = require('./src/logger');
const config = require('./src/config');

/**
 * Main function - Entry point for the scraper
 * Initializes client, finds chat, scrapes messages, and handles cleanup
 * @returns {Promise<void>}
 */
async function main() {
    let client = null;

    try {
        // Display startup banner
        console.log('\n========================================');
        console.log('  WhatsApp News Chat Scraper');
        console.log('========================================\n');
        logger.info('Starting scraper application');
        logger.info(`Target chat: "${config.whatsapp.chatName}"`);
        if (config.whatsapp.chatId) {
            logger.info(`Chat ID: ${config.whatsapp.chatId}`);
        }
        logger.info(`Headless mode: ${config.whatsapp.headless}`);
        logger.info(`Output file: ${config.paths.output}`);
        logger.info(`Max retries: ${config.scraping.maxRetries}`);
        console.log('');

        // Step 1: Create WhatsApp client
        client = createClient();

        // Step 2: Connect with retry logic
        await connectWithRetry(client);

        // Step 3: Find target chat
        const chat = await findChat(client, config.whatsapp.chatName, config.whatsapp.chatId);

        // Step 4: Verify chat was found
        if (!chat) {
            throw new Error(
                `Chat "${config.whatsapp.chatName}" not found. Please check the chat name in your .env file.`
            );
        }

        // Step 5: Scrape messages
        logger.info('Starting message scraping workflow');
        const results = await scrape(chat);

        // Step 6: Display results
        console.log('\n========================================');
        console.log('  Scraping Results');
        console.log('========================================\n');

        if (results.success) {
            logger.success(results.message);
            logger.info(`Messages processed: ${results.messagesProcessed}`);
            logger.info(`First run: ${results.isFirstRun ? 'Yes' : 'No'}`);
            logger.info(`Output file: ${results.outputFile}`);
        } else {
            logger.error(`Scraping failed: ${results.message}`);
            if (results.error) {
                logger.error(`Error details: ${results.error}`);
            }
            process.exit(1);
        }

        console.log('\n========================================\n');
        logger.success('Application completed successfully');

    } catch (error) {
        // Handle errors with detailed logging
        console.log('\n========================================');
        console.log('  Error Occurred');
        console.log('========================================\n');
        logger.error(`Application failed: ${error.message}`);

        // Log stack trace for debugging
        if (error.stack) {
            logger.error('Stack trace:');
            error.stack.split('\n').forEach(line => {
                logger.error(line);
            });
        }

        console.log('\n========================================\n');
        process.exit(1);

    } finally {
        // Cleanup: Destroy client and close connections
        if (client) {
            try {
                logger.info('Cleaning up: Destroying WhatsApp client');
                await client.destroy();
                logger.success('Client destroyed successfully');
            } catch (cleanupError) {
                logger.warn(`Warning during cleanup: ${cleanupError.message}`);
            }
        }

        logger.info('Done');
    }
}

// Execute main function if this file is run directly
if (require.main === module) {
    main().catch(error => {
        // Fallback error handler for unexpected errors
        console.error('Unexpected error in main:', error);
        process.exit(1);
    });
}

// Export main function for testing
module.exports = { main };
