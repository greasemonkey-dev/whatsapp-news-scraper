require('dotenv').config();

const config = {
    whatsapp: {
        chatName: process.env.CHAT_NAME || 'צ\'אט הכתבים N12',
        chatId: process.env.CHAT_ID || '120363401113878063@g.us',
        headless: process.env.HEADLESS === 'true',
        dataPath: './data/.wwebjs_auth'
    },
    scraping: {
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.RETRY_DELAY) || 30000,
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: './logs'
    },
    paths: {
        state: './data/state.json',
        output: './data/output/news_chat_data.csv'
    },
    googleSheets: {
        enabled: !!process.env.GOOGLE_SHEET_ID,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json'
    }
};

module.exports = config;
