const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Logger utility for console and file output
 * Provides colored console output and daily log files
 */
class Logger {
    constructor() {
        this.logDir = config.logging.dir;
        this.ensureLogDir();

        // ANSI color codes
        this.colors = {
            cyan: '\x1b[36m',
            yellow: '\x1b[33m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            reset: '\x1b[0m'
        };
    }

    /**
     * Ensures log directory exists
     */
    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Gets daily log file path
     * @returns {string} Path to today's log file
     */
    getLogFilePath() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const filename = `scraper_${year}-${month}-${day}.log`;
        return path.join(this.logDir, filename);
    }

    /**
     * Formats log message with timestamp
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @returns {string} Formatted message
     */
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    /**
     * Writes log to console and file
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {string} color - ANSI color code
     */
    write(level, message, color) {
        const formattedMessage = this.formatMessage(level, message);

        // Console output with color
        console.log(`${color}${formattedMessage}${this.colors.reset}`);

        // File output without color codes
        const logFilePath = this.getLogFilePath();
        fs.appendFileSync(logFilePath, formattedMessage + '\n', 'utf8');
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     */
    info(message) {
        this.write('info', message, this.colors.cyan);
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     */
    warn(message) {
        this.write('warn', message, this.colors.yellow);
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     */
    error(message) {
        this.write('error', message, this.colors.red);
    }

    /**
     * Log success message
     * @param {string} message - Message to log
     */
    success(message) {
        this.write('success', message, this.colors.green);
    }
}

// Export singleton instance
module.exports = new Logger();
