/**
 * @file Settings.js
 * @description Settings Registry & LocalStorage Persistence Manager.
 * @module config/Settings
 */

/**
 * Game Settings LocalStorage Manager
 */
export class SettingsManager {
  static STORAGE_KEY = "warfront_settings";

  constructor() {
    this.settings = {
      playerName: "Player",
      theme: "dark",
      hudClock: true,
      masterVolume: 80
    };
    this.listeners = new Set();
    this.load();
  }

  /**
   * Load settings object from LocalStorage.
   */
  load() {
    try {
      const raw = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("Failed to load settings from localStorage:", e);
    }
  }

  /**
   * Save settings object to LocalStorage.
   */
  save() {
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (e) {
      console.warn("Failed to save settings to localStorage:", e);
    }
  }

  /**
   * Get setting value by key.
   * @param {string} key
   * @param {*} [fallback]
   * @returns {*}
   */
  get(key, fallback) {
    return this.settings[key] !== undefined ? this.settings[key] : fallback;
  }

  /**
   * Set setting key-value pair and persist.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  /**
   * Register change listener callback.
   * @param {function(object): void} callback
   */
  onChange(callback) {
    this.listeners.add(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.settings));
  }
}

export const globalSettings = new SettingsManager();