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
 * Finds a chat by name with partial matching
 * @param {Client} client - WhatsApp client instance
 * @param {string} chatName - Name of chat to find
 * @returns {Promise<Object|null>} Chat object or null if not found
 */
async function findChat(client, chatName) {
    logger.info(`Searching for chat: "${chatName}"...`);

    try {
        const chats = await client.getChats();
        logger.info(`Found ${chats.length} total chats`);

        // Find chat by partial name match (case-insensitive)
        const chat = chats.find(c =>
            c.name && c.name.toLowerCase().includes(chatName.toLowerCase())
        );

        if (chat) {
            logger.success(`Found chat: "${chat.name}"`);
            return chat;
        } else {
            logger.error(`Chat "${chatName}" not found`);
            logger.info('Available chats (first 10):');

            // List first 10 available chats
            const chatList = chats.slice(0, 10);
            chatList.forEach((c, index) => {
                const chatInfo = c.name || c.id._serialized;
                logger.info(`  ${index + 1}. ${chatInfo}`);
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
