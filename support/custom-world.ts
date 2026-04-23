import dotenv from 'dotenv';
dotenv.config();

import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { Product } from '../src/models/Product';
import { AuthSessionService } from '../src/services/auth-session';
import { env } from '../src/utils/env';

/**
 * CustomWorld
 * Cucumber world object used to store:
 */
export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  selectedProducts: Product[] = [];
  currentSearchTerm: string = '';

  constructor(options: IWorldOptions) {
    super(options);
  }

  async launchBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: !env.headed,
      slowMo: env.headed ? 300 : 0
    });

    this.context = await AuthSessionService.createContext(this.browser);
    this.page = await this.context.newPage();
  }

  async closeBrowser(): Promise<void> {
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(CustomWorld);