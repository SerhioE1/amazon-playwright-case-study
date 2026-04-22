import dotenv from 'dotenv';
// Legacy safeguard: dotenv is loaded here so CustomWorld can still work
// even if invoked outside the main bootstrap path.
// In a cleaner final setup, env loading should ideally be centralized.
dotenv.config();

import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { Product } from '../src/models/Product';
import { AuthSessionService } from '../src/services/auth-session';
import { env } from '../src/utils/env';

/**
 * CustomWorld
 *
 * Cucumber world object used to store:
 * - Playwright browser objects for the current scenario
 * - scenario-specific state such as selected products and current search term
 *
 * A new world instance is created for each scenario.
 */
export class CustomWorld extends World {
  /**
   * Playwright browser instance for the current scenario.
   */
  browser!: Browser;

  /**
   * Playwright browser context for the current scenario.
   */
  context!: BrowserContext;

  /**
   * Playwright page used by the current scenario.
   */
  page!: Page;

  /**
   * Products selected during the scenario flow.
   * Used later for cart validation and subtotal comparison.
   */
  selectedProducts: Product[] = [];

  /**
   * Current search term used on the search results page.
   * Helps apply correct filtering/sorting flow for the active product.
   */
  currentSearchTerm: string = '';

  constructor(options: IWorldOptions) {
    super(options);
  }

  /**
   * Launches browser and creates scenario page/context.
   *
   * Notes:
   * - headed mode is controlled via env config
   * - slowMo is enabled only in headed mode for local visual debugging
   * - browser context creation is delegated to AuthSessionService
   *   so stored session state can be reused
   */
  async launchBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: !env.headed,
      slowMo: env.headed ? 300 : 0
    });

    this.context = await AuthSessionService.createContext(this.browser);
    this.page = await this.context.newPage();
  }

  /**
   * Closes page, context and browser for the current scenario.
   *
   * Optional chaining is kept intentionally as a defensive safeguard
   * in case launch failed partially and some objects were never initialized.
   */
  async closeBrowser(): Promise<void> {
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(CustomWorld);