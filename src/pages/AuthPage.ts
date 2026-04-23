import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {

  private static readonly AUTH_TIMEOUT = 15000;
  private readonly signInNavButton: Locator;
  private readonly emailInput: Locator;
  private readonly continueButton: Locator;
  private readonly passwordInput: Locator;
  private readonly signInSubmitButton: Locator;
  private readonly accountGreeting: Locator;

  constructor(page: Page) {
    super(page);

    this.signInNavButton = page.locator(
      '#nav-link-accountList a[data-nav-role="signin"], #nav-link-accountList a'
    ).first(); //TODO: make more stable

    this.emailInput = page.locator('#ap_email_login, #ap_email').first();

    this.continueButton = page
      .locator('input[aria-labelledby="continue-announce"], input#continue')
      .first();

    this.passwordInput = page.locator('#ap_password').first();
    this.signInSubmitButton = page.locator('#signInSubmit').first();

    this.accountGreeting = page.locator('#nav-link-accountList-nav-line-1').first();
  }

  async openSignIn(): Promise<void> {
    await this.signInNavButton.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });

    await this.signInNavButton.click();

    await this.emailInput.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
  }

  async login(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new Error('Email and password must be provided for login.');
    }

    await this.emailInput.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.emailInput.fill(email);

    await this.continueButton.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.continueButton.click();

    await this.passwordInput.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.passwordInput.fill(password);

    await this.signInSubmitButton.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
    await this.signInSubmitButton.click();

    await this.accountGreeting.waitFor({
      state: 'visible',
      timeout: AuthPage.AUTH_TIMEOUT
    });
  }

  async isLoggedIn(): Promise<boolean> {
    const greeting = await this.getGreetingText();

    return /hello/i.test(greeting) && !/sign in/i.test(greeting);
  }

  async getGreetingText(): Promise<string> {
    return ((await this.accountGreeting.textContent().catch(() => '')) || '').trim();
  }
}