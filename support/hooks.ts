import dotenv from 'dotenv';
dotenv.config();

import { After, Before, BeforeAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import { CustomWorld } from './custom-world';
import { AuthSessionService } from '../src/services/auth-session';
import { CartPage } from '../src/pages/CartPage';
import { HomePage } from '../src/pages/HomePage';
import { env } from '../src/utils/env';

/**
 * Global Cucumber timeout for steps and hooks.
 * Chosen as a safe upper bound for Amazon UI flows.
 */
const DEFAULT_CUCUMBER_TIMEOUT = 60 * 1000;

setDefaultTimeout(DEFAULT_CUCUMBER_TIMEOUT);

/**
 * Temporary debug logs kept from env/bootstrap troubleshooting.
 */
// console.log('AMAZON_EMAIL loaded:', !!process.env.AMAZON_EMAIL);
// console.log('AMAZON_PASSWORD loaded:', !!process.env.AMAZON_PASSWORD);
// console.log('STORAGE_STATE_PATH:', process.env.STORAGE_STATE_PATH);

BeforeAll(async function () {
  const browser = await chromium.launch({
    headless: !env.headed
  });

  try {
    const isValid = await AuthSessionService.isStoredSessionValid(browser);

    if (!isValid) {
      await AuthSessionService.ensureLoggedIn(browser);
    } else {
      console.log('Existing stored session is still valid.');
    }
  } finally {
    await browser.close();
  }
});

/**
 * Before each scenario:
 * - reset scenario-level world state
 * - create browser/page/context
 */
Before(async function (this: CustomWorld) {
  this.selectedProducts = [];
  this.currentSearchTerm = '';

  await this.launchBrowser();
});

/**
 * After each scenario:
 * - capture screenshot on failure
 * - try to clean cart state
 * - close browser/context/page
 */
After(async function (this: CustomWorld, scenario) {
  try {
    // Capture screenshot only if scenario failed and page exists.
    if (scenario.result?.status === Status.FAILED && this.page) {
      const screenshot = await this.page.screenshot({
        path: `reports/failed-${Date.now()}.png`,
        fullPage: true
      });

      await this.attach(screenshot, 'image/png');
    }
  } catch (error) {
    console.log('Failed to capture screenshot (non-blocking):', error);
  }

  try {
    // Run cart cleanup only if page exists.
    if (this.page) {
      const homePage = new HomePage(this.page);

      await homePage.openHomePage();
      await homePage.amazonHeader.openCart();

      const cartPage = new CartPage(this.page);
      await cartPage.clearCart();
      await cartPage.verifyCartIsEmpty();

      console.log('Cart cleaned after test.');
    }
  } catch (error) {
    console.log('Cart cleanup failed (non-blocking):', error);
  }

  await this.closeBrowser();
});