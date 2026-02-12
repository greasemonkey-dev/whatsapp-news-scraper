const { Client, LocalAuth } = require('whatsapp-web.js');
const config = require('./config');
const logger = require('./logger');

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates and configures WhatsApp client
 * @returns {Client} Configured WhatsApp client
 */
function createClient() {
    logger.info('Creating WhatsApp client...');

    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: config.whatsapp.dataPath
        }),
        puppeteer: {
            headless: config.whatsapp.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // QR code event - display for authentication
    client.on('qr', (qr) => {
        logger.info('QR Code received. Please scan with WhatsApp:');
        console.log('\n');
        // Display large QR code in terminal
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: false });
        console.log('\n');
    });

    // Authentication success event
    client.on('authenticated', () => {
        logger.success('WhatsApp authentication successful!');
    });

    // Client ready event
    client.on('ready', () => {
        logger.success('WhatsApp client is ready!');
    });

    // Authentication failure event
    client.on('auth_failure', (msg) => {
        logger.error(`Authentication failure: ${msg}`);
    });

    // Disconnected event
    client.on('disconnected', (reason) => {
        logger.warn(`WhatsApp client disconnected: ${reason}`);
    });

    return client;
}

/**
 * Connects WhatsApp client with retry logic
 * @param {Client} client - WhatsApp client instance
 * @returns {Promise<void>}
 * @throws {Error} If all connection attempts fail
 */
async function connectWithRetry(client) {
    const maxRetries = config.scraping.maxRetries;
    const retryDelay = config.scraping.retryDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.info(`Connection attempt ${attempt}/${maxRetries}...`);

            // Wait for the 'ready' event
            await new Promise((resolve, reject) => {
                client.once('ready', () => resolve());
                client.once('auth_failure', (msg) => reject(new Error(`Auth failed: ${msg}`)));
                client.initialize().catch(reject);
            });

            logger.success('Connection successful!');
            return;
        } catch (error) {
            logger.error(`Connection attempt ${attempt} failed: ${error.message}`);

            if (attempt < maxRetries) {
                logger.info(`Waiting ${retryDelay / 1000} seconds before retry...`);
                await sleep(retryDelay);
            } else {
                throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
            }
        }
    }
}

/**
 * Finds a chat by ID or name with partial matching
 * @param {Client} client - WhatsApp client instance
 * @param {string} chatName - Name of chat to find
 * @param {string} chatId - Optional chat ID for exact match
 * @returns {Promise<Object|null>} Chat object or null if not found
 */
async function findChat(client, chatName, chatId = '') {
    try {
        const chats = await client.getChats();
        logger.info(`Found ${chats.length} total chats`);

        // Try to find by chat ID first (if provided) - more reliable
        if (chatId) {
            logger.info(`Searching for chat by ID: "${chatId}"...`);
            const chatById = chats.find(c => c.id._serialized === chatId);

            if (chatById) {
                logger.success(`Found chat by ID: "${chatById.name}" (${chatById.id._serialized})`);
                return chatById;
            } else {
                logger.warn(`Chat ID "${chatId}" not found, falling back to name search...`);
            }
        }

        // Fall back to name search
        logger.info(`Searching for chat by name: "${chatName}"...`);
        const chat = chats.find(c =>
            c.name && c.name.toLowerCase().includes(chatName.toLowerCase())
        );

        if (chat) {
            logger.success(`Found chat: "${chat.name}" (${chat.id._serialized})`);
            return chat;
        } else {
            logger.error(`Chat "${chatName}" not found`);
            logger.info('Available chats (first 10):');

            // List first 10 available chats with their IDs
            const chatList = chats.slice(0, 10);
            chatList.forEach((c, index) => {
                const chatInfo = c.name || 'Unknown';
                const chatId = c.id._serialized;
                logger.info(`  ${index + 1}. ${chatInfo} (ID: ${chatId})`);
            });

            return null;
        }
    } catch (error) {
        logger.error(`Error finding chat: ${error.message}`);
        throw error;
    }
}

module.exports = {
    sleep,
    createClient,
    connectWithRetry,
    findChat
};
