import dotenv from 'dotenv';
dotenv.config();

/**
 * env
 * Centralized configuration object for environment variables.
 */
export const env = {
  /**
   * Base URL of the application under test
   */
  get baseUrl(): string {
    return process.env.BASE_URL || 'https://www.amazon.com';
  },

  /**
   * Run browser in headed mode
   */
  get headed(): boolean {
    return String(process.env.HEADED).toLowerCase() === 'true';
  },

  /**
   * Amazon login email
   * Required for authentication scenarios
   */
  get amazonEmail(): string {
    const value = process.env.AMAZON_EMAIL;

    if (!value) {
      throw new Error('AMAZON_EMAIL is not set in environment variables');
    }

    return value;
  },

  /**
   * Amazon login password
   * Required for authentication scenarios
   */
  get amazonPassword(): string {
    const value = process.env.AMAZON_PASSWORD;

    if (!value) {
      throw new Error('AMAZON_PASSWORD is not set in environment variables');
    }

    return value;
  },

  /**
   * Path to Playwright storage state file
   */
  get storageStatePath(): string {
    return process.env.STORAGE_STATE_PATH || 'storageState.json';
  }
};