const fs = require('fs').promises;
const path = require('path');

class StateManager {
  constructor(statePath = path.join(__dirname, '../data/scraper-state.json')) {
    this.statePath = statePath;
    this.defaultState = {
      chatId: null,
      chatName: null,
      lastProcessedTimestamp: null,
      lastRunDate: null,
      totalMessagesProcessed: 0
    };
  }

  async loadState() {
    try {
      const fileContent = await fs.readFile(this.statePath, 'utf8');
      const state = JSON.parse(fileContent);
      return state;
    } catch (error) {
      // File doesn't exist or is corrupted, return default state
      return { ...this.defaultState };
    }
  }

  async saveState(state) {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.statePath);
      await fs.mkdir(dir, { recursive: true });

      // Write state to file with pretty formatting
      await fs.writeFile(this.statePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to save state: ${error.message}`);
    }
  }

  async updateState(updates) {
    try {
      // Load existing state (or get default state)
      const currentState = await this.loadState();

      // Merge updates with current state
      const newState = {
        ...currentState,
        ...updates
      };

      // Save merged state
      await this.saveState(newState);
    } catch (error) {
      throw new Error(`Failed to update state: ${error.message}`);
    }
  }
}

module.exports = StateManager;
