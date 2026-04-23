import dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import { Browser, BrowserContext } from 'playwright';
import { env } from '../utils/env';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';

/**
 * AuthSessionService
 */
export class AuthSessionService {

  static storageStateExists(): boolean {
    return fs.existsSync(env.storageStatePath);
  }

  static async createContext(browser: Browser): Promise<BrowserContext> {
    if (this.storageStateExists()) {
      return browser.newContext({ storageState: env.storageStatePath });
    }

    return browser.newContext();
  }

  static async ensureLoggedIn(browser: Browser): Promise<void> {
    const context = await this.createContext(browser);
    const page = await context.newPage();

    try {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);

      console.log('Opening home page to validate current session...');
      await homePage.openHomePage();

      const alreadyLoggedIn = await authPage.isLoggedIn();

      if (alreadyLoggedIn) {
        console.log('Stored session is valid. User is already logged in.');
        await context.storageState({ path: env.storageStatePath });
        return;
      }

      if (!env.amazonEmail || !env.amazonPassword) {
        throw new Error('AMAZON_EMAIL or AMAZON_PASSWORD is missing in .env');
      }

      console.log('Stored session is missing or expired. Logging in again...');

      await authPage.openSignIn();
      await authPage.login(env.amazonEmail, env.amazonPassword);

      // Re-open home page to validate final authenticated state in the header.
      await homePage.openHomePage();

      const isLoggedInNow = await authPage.isLoggedIn();
      const greetingText = await authPage.getGreetingText();

      if (!isLoggedInNow) {
        throw new Error(`Login failed. Greeting text after login: "${greetingText}"`);
      }

      await context.storageState({ path: env.storageStatePath });
      console.log(`Login successful. Storage state saved to ${env.storageStatePath}`);
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Returns whether the saved storage state still represents a valid authenticated session.
   */
  static async isStoredSessionValid(browser: Browser): Promise<boolean> {
    if (!this.storageStateExists()) {
      return false;
    }

    const context = await browser.newContext({ storageState: env.storageStatePath });
    const page = await context.newPage();

    try {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);

      await homePage.openHomePage();
      return await authPage.isLoggedIn();
    } catch (error) {
      console.log('Stored session validation failed:', error);
      return false;
    } finally {
      await page.close();
      await context.close();
    }
  }
}