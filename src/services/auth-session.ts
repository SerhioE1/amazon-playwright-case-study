import dotenv from 'dotenv';
// Legacy safeguard: dotenv is loaded here to ensure environment variables
// are available even if service is invoked outside the main test bootstrap.
// In a cleaner final setup, env loading should ideally be centralized.
// dotenv.config();
dotenv.config();

import fs from 'node:fs';
import { Browser, BrowserContext } from 'playwright';
import { env } from '../utils/env';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';

/**
 * AuthSessionService
 *
 * Service responsible for:
 * - checking whether a stored Playwright session exists
 * - creating browser contexts with saved storage state
 * - validating whether the stored session is still authenticated
 * - performing login and persisting a fresh storage state when required
 *
 * This is a service/orchestration layer.
 * It intentionally does not contain UI locator logic directly.
 */
export class AuthSessionService {
  /**
   * Returns whether the configured storage state file exists.
   */
  static storageStateExists(): boolean {
    return fs.existsSync(env.storageStatePath);
  }

  /**
   * Creates a browser context using stored session state if available.
   *
   * Note:
   * Method name is intentionally kept, but semantically it creates
   * a session-aware context, not just a plain context.
   */
  static async createContext(browser: Browser): Promise<BrowserContext> {
    if (this.storageStateExists()) {
      return browser.newContext({ storageState: env.storageStatePath });
    }

    return browser.newContext();
  }

  /**
   * Ensures that a valid logged-in session exists.
   *
   * Flow:
   * 1. Create context (with stored session if available)
   * 2. Open home page
   * 3. Check if already logged in
   * 4. If not logged in, perform UI login
   * 5. Save fresh storage state
   */
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