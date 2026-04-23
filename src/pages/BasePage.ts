import { Locator, Page } from 'playwright';

export class BasePage {
  protected readonly page: Page;
  protected static readonly DEFAULT_TIMEOUT = 2000;

  constructor(page: Page) {
    this.page = page;
  }
  
  async open(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click(locator: Locator): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: BasePage.DEFAULT_TIMEOUT
    });

    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: BasePage.DEFAULT_TIMEOUT
    });

    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({
      state: 'visible',
      timeout: BasePage.DEFAULT_TIMEOUT
    });

    return (await locator.textContent())?.trim() || '';
  }
}