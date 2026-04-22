import { Locator, Page } from 'playwright';

/**
 * BasePage
 *
 * Shared base class for all page objects.
 * Provides small reusable wrappers around common Playwright actions:
 * - navigation
 * - generic page load waiting
 * - click
 * - fill
 * - text extraction
 * - visibility checks
 *
 * Note:
 * Page-specific waits should still be preferred whenever possible.
 * This class is meant to reduce repetition, not replace explicit page anchors.
 */
export class BasePage {
  /**
   * Shared Playwright page instance available to child page objects.
   */
  protected readonly page: Page;

  /**
   * Default timeout for generic element waits in base helpers.
   * Can be adjusted later from one place if needed.
   */
  protected static readonly DEFAULT_TIMEOUT = 10000;

  constructor(page: Page) {
    // Store page instance for all child pages.
    this.page = page;
  }

  /**
   * Opens the given URL.
   *
   * Uses domcontentloaded as a lightweight generic page navigation wait.
   * For critical flows, page-specific waits should still be added
   * in the relevant page objects.
   */
  async open(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Generic page load wait helper.
   *
   * Useful as a lightweight fallback, but should not replace
   * page-specific readiness checks where important UI anchors exist.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clicks a locator after waiting for it to become visible.
   */
  async click(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: BasePage.DEFAULT_TIMEOUT
    });

    await locator.click();
  }

  /**
   * Fills an input-like locator after waiting for it to become visible.
   */
  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: BasePage.DEFAULT_TIMEOUT
    });

    await locator.fill(value);
  }

  /**
   * Reads trimmed text from a locator after waiting for visibility.
   */
  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({
      state: 'visible',
      timeout: BasePage.DEFAULT_TIMEOUT
    });

    return (await locator.textContent())?.trim() || '';
  }

  /**
   * Returns whether a locator is currently visible.
   *
   * This is intentionally a thin wrapper to keep a consistent page API.
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }
}