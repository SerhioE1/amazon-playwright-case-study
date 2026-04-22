import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

/**
 * AuthPage
 *
 * This page object encapsulates Amazon sign-in flow:
 * - opening the sign-in page from the header
 * - entering email
 * - moving to password step
 * - entering password
 * - submitting login
 * - validating that the user is logged in
 *
 * It is used both for initial authentication and for validating stored session state.
 */
export class AuthPage extends BasePage {
  /**
   * Local timeout for authentication-specific waits.
   * Kept inside the module so auth behavior is easier to maintain.
   */
  private static readonly AUTH_TIMEOUT = 15000;

  /**
   * Sign-in button in the Amazon header.
   * Primary locator uses the account list area.
   */
  private readonly signInNavButton: Locator;

  /**
   * Email input.
   * Amazon can render either #ap_email_login or #ap_email depending on flow.
   */
  private readonly emailInput: Locator;

  /**
   * Continue button after entering email.
   * We target the actual clickable input instead of wrapper containers.
   */
  private readonly continueButton: Locator;

  /**
   * Password input shown on the next sign-in step.
   */
  private readonly passwordInput: Locator;

  /**
   * Final sign-in submit button.
   */
  private readonly signInSubmitButton: Locator;

  /**
   * Greeting text in the Amazon header used to validate login state.
   */
  private readonly accountGreeting: Locator;

  constructor(page: Page) {
    super(page);

    // Header sign-in entry point.
    this.signInNavButton = page.locator(
      '#nav-link-accountList a[data-nav-role="signin"], #nav-link-accountList a'
    ).first();

    // Email input can differ depending on sign-in variant.
    this.emailInput = page.locator('#ap_email_login, #ap_email').first();

    // Continue button: target the real input/button element, not surrounding wrappers.
    this.continueButton = page
      .locator('input[aria-labelledby="continue-announce"], input#continue')
      .first();

    // Password step fields.
    this.passwordInput = page.locator('#ap_password').first();
    this.signInSubmitButton = page.locator('#signInSubmit').first();

    // Header greeting displayed after successful login.
    this.accountGreeting = page.locator('#nav-link-accountList-nav-line-1').first();
  }

  /**
   * Opens the sign-in flow from the Amazon header.
   */
  async openSignIn(): Promise<void> {
    // Wait until sign-in trigger is visible and clickable.
    await this.signInNavButton.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });

    await this.signInNavButton.click();

    // Wait until the email field is shown instead of relying only on page load.
    await this.emailInput.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
  }

  /**
   * Performs login with provided credentials.
   *
   * @param email - Amazon account email
   * @param password - Amazon account password
   */
  async login(email: string, password: string): Promise<void> {
    // Fail early if credentials were not provided.
    if (!email || !password) {
      throw new Error('Email and password must be provided for login.');
    }

    // Wait for and fill email input.
    await this.emailInput.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.emailInput.fill(email);

    // Continue to password step.
    await this.continueButton.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.continueButton.click();

    // Wait specifically for password field instead of generic page load only.
    await this.passwordInput.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.passwordInput.fill(password);

    // Submit login credentials.
    await this.signInSubmitButton.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.signInSubmitButton.click();

    // Wait for header greeting to become available after login attempt.
    await this.accountGreeting.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
  }

  /**
   * Returns whether the current user session appears authenticated.
   *
   * This check uses the header greeting text.
   */
  async isLoggedIn(): Promise<boolean> {
    const greeting = await this.getGreetingText();

    return /hello/i.test(greeting) && !/sign in/i.test(greeting);
  }

  /**
   * Reads the header greeting text.
   * Useful for login validation and debugging failed auth attempts.
   */
  async getGreetingText(): Promise<string> {
    // We do not hard-fail here because the caller may use this for diagnostics.
    return ((await this.accountGreeting.textContent().catch(() => '')) || '').trim();
  }
}