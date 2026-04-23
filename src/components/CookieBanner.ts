import { Page, Locator } from 'playwright';

/**
 * CookieBanner component
 * Responsible for handling cookie consent popups on Amazon.
 */
export class CookieBanner {
  private readonly page: Page;
  private readonly acceptButton: Locator;

  private static readonly BANNER_TIMEOUT = 15000;

  constructor(page: Page) {
    this.page = page;

    this.acceptButton = this.page.locator(
      'input[name="accept"], button:has-text("Accept"), input[aria-label*="Accept"]' //TODO: change to more stable locator
    );
  }

  async acceptIfPresent(): Promise<void> {
    try {
      await this.acceptButton.first().waitFor({
        state: 'visible',
        timeout: CookieBanner.BANNER_TIMEOUT
      });

      await this.acceptButton.first().click();

      console.log('Cookie banner accepted');
    } catch {
      // If not found or not visible within timeout → ignore
      console.log('Cookie banner not present');
    }
  }
}