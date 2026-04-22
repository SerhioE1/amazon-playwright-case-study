import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

/**
 * SignInPage
 *
 * Legacy / auxiliary page object used to validate whether Amazon redirected
 * the user to a sign-in page.
 *
 * Note:
 * This page object was originally used in the unauthenticated checkout flow.
 * In the current authenticated-session-based flow, it may no longer be part
 * of the main scenario, but it is kept for possible future reuse.
 */
export class SignInPage extends BasePage {
  /**
   * Email input field.
   * Amazon may render either #ap_email_login or #ap_email.
   */
  private readonly emailInput: Locator;

  /**
   * Continue button after email input.
   * Uses a more stable locator strategy than input#continue alone.
   */
  private readonly continueButton: Locator;

  /**
   * Sign-in page heading used as an additional detection signal.
   */
  private readonly signInHeader: Locator;

  constructor(page: Page) {
    super(page);

    // Support both known email input variants.
    this.emailInput = page.locator('#ap_email_login, #ap_email').first();

    // Support both known continue button variants.
    this.continueButton = page
      .locator('input[aria-labelledby="continue-announce"], input#continue')
      .first();

    // Prefer a specific "Sign in" heading instead of any generic h1.
    this.signInHeader = page.locator('h1:has-text("Sign in")').first();
  }

  /**
   * Returns whether the current page appears to be the Amazon sign-in page.
   *
   * This method is intentionally diagnostic and tolerant:
   * - if email field is visible, the sign-in page is likely open
   * - if continue button is visible, the sign-in page is likely open
   * - if the specific "Sign in" header is visible, the sign-in page is likely open
   */
  async isOpened(): Promise<boolean> {
    const emailVisible = await this.emailInput.isVisible().catch(() => false);
    const continueVisible = await this.continueButton.isVisible().catch(() => false);
    const headerVisible = await this.signInHeader.isVisible().catch(() => false);

    return emailVisible || continueVisible || headerVisible;
  }
}