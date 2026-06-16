const fs = require('fs');
const path = require('path');

const SETTINGS_FILE_PATH = path.join(__dirname, '../config/settings.json');

const getSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      // Default settings
      return { pricingEngineEnabled: true };
    }
    const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[SettingsService] Error reading settings:', error);
    return { pricingEngineEnabled: true };
  }
};

const updateSettings = (newSettings) => {
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updatedSettings, null, 2), 'utf8');
    return updatedSettings;
  } catch (error) {
    console.error('[SettingsService] Error updating settings:', error);
    throw error;
  }
};

module.exports = {
  getSettings,
  updateSettings
};
