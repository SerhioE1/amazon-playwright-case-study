import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

/**
 * SignInPage
 */
export class SignInPage extends BasePage {

  private readonly emailInput: Locator;
  private readonly continueButton: Locator;
  private readonly signInHeader: Locator;

  constructor(page: Page) {
    super(page);

    // Support both known email input variants.
    this.emailInput = page.locator('#ap_email_login, #ap_email').first();

    // Support both known continue button variants.
    this.continueButton = page
      .locator('input[aria-labelledby="continue-announce"], input#continue')
      .first();

    this.signInHeader = page.locator('h1:has-text("Sign in")').first();
  }

  async isOpened(): Promise<boolean> {
    const emailVisible = await this.emailInput.isVisible().catch(() => false);
    const continueVisible = await this.continueButton.isVisible().catch(() => false);
    const headerVisible = await this.signInHeader.isVisible().catch(() => false);

    return emailVisible || continueVisible || headerVisible;
  }
}