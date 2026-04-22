import { Page, Locator } from 'playwright';

/**
 * CookieBanner component
 *
 * Responsible for handling cookie consent popups on Amazon.
 * This component is designed to be safe:
 * - it does not fail if the banner is not present
 * - it attempts to detect and accept cookies only if needed
 */
export class CookieBanner {
  private readonly page: Page;

  /**
   * Locator for the "Accept cookies" button.
   * Using a more stable selector strategy instead of only name="accept".
   */
  private readonly acceptButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Better locator strategy:
    // - role=button
    // - text contains "Accept"
    // fallback to input[name="accept"]
    this.acceptButton = this.page.locator(
      'input[name="accept"], button:has-text("Accept"), input[aria-label*="Accept"]'
    );
  }

  /**
   * Accepts cookie banner if it appears.
   *
   * This method:
   * - waits briefly for the banner to appear (non-blocking)
   * - clicks accept only if visible
   * - does not throw if banner is absent
   */
  async acceptIfPresent(): Promise<void> {
    try {
      // Soft wait: give the banner a chance to appear (max 3s)
      await this.acceptButton.first().waitFor({
        state: 'visible',
        timeout: 3000
      });

      await this.acceptButton.first().click();

      console.log('Cookie banner accepted');
    } catch (e) {
      // If not found or not visible within timeout → ignore
      console.log('Cookie banner not present');
    }
  }
}