/**
 * Google Sheets Exporter Module
 * Exports WhatsApp messages to Google Sheets
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Google Sheets Exporter Class
 */
class SheetsExporter {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
    this.sheetName = null; // Will be auto-detected
  }

  /**
   * Initialize Google Sheets API with service account
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Check if credentials file exists
      if (!fs.existsSync(this.credentialsPath)) {
        throw new Error(`Credentials file not found at: ${this.credentialsPath}`);
      }

      // Check if spreadsheet ID is configured
      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEET_ID not configured in .env file');
      }

      // Load service account credentials
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));

      // Create auth client
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Create sheets client
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });

      // Auto-detect first sheet name
      await this.detectSheetName();

      logger.success('Google Sheets API initialized successfully');
      logger.info(`Using sheet tab: "${this.sheetName}"`);
    } catch (error) {
      logger.error(`Failed to initialize Google Sheets API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Auto-detect the first sheet name in the spreadsheet
   * @returns {Promise<void>}
   */
  async detectSheetName() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      if (!response.data.sheets || response.data.sheets.length === 0) {
        throw new Error('No sheets found in spreadsheet');
      }

      // Use the first sheet
      this.sheetName = response.data.sheets[0].properties.title;
      logger.info(`Auto-detected sheet name: "${this.sheetName}"`);
    } catch (error) {
      logger.error(`Failed to detect sheet name: ${error.message}`);
      throw error;
    }
  }

  /**
   * Append messages to Google Sheet
   * @param {Array} messages - Array of message objects
   * @returns {Promise<void>}
   */
  async appendMessages(messages) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      if (messages.length === 0) {
        logger.info('No messages to append to Google Sheets');
        return;
      }

      // Convert messages to rows
      const rows = messages.map(msg => [
        msg.date,
        msg.time,
        msg.sender,
        msg.reporter,
        msg.content,
        msg.hasMedia,
        msg.links.join('; ')
      ]);

      // Append to sheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:G`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: rows
        }
      });

      logger.success(`Appended ${rows.length} messages to Google Sheets`);
      logger.info(`Updated range: ${response.data.updates.updatedRange}`);
    } catch (error) {
      logger.error(`Failed to append to Google Sheets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize sheet with headers if empty
   * @returns {Promise<void>}
   */
  async initializeSheet() {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      // Check if sheet has data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:G1`
      });

      // If first row is empty, add headers
      if (!response.data.values || response.data.values.length === 0) {
        logger.info('Sheet is empty, adding headers...');

        const headers = [
          ['Date', 'Time', 'Sender', 'Reporter', 'Message', 'Has_Media', 'Links']
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1:G1`,
          valueInputOption: 'RAW',
          resource: {
            values: headers
          }
        });

        logger.success('Headers added to Google Sheet');
      } else {
        logger.info('Sheet already has headers');
      }
    } catch (error) {
      logger.error(`Failed to initialize sheet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get spreadsheet info
   * @returns {Promise<Object>}
   */
  async getSpreadsheetInfo() {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      return {
        title: response.data.properties.title,
        url: response.data.spreadsheetUrl,
        sheets: response.data.sheets.map(s => s.properties.title)
      };
    } catch (error) {
      logger.error(`Failed to get spreadsheet info: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SheetsExporter;
