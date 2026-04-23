import { Page } from 'playwright';
import { BasePage } from './BasePage';
import { AmazonHeader } from '../components/AmazonHeader';
import { CookieBanner } from '../components/CookieBanner';
import { env } from '../utils/env';

/**
 * HomePage
 * Represents the Amazon home page.
 */
export class HomePage extends BasePage {

  readonly amazonHeader: AmazonHeader;
  private readonly cookieBanner: CookieBanner;

  constructor(page: Page) {
    super(page);

    this.amazonHeader = new AmazonHeader(page);
    this.cookieBanner = new CookieBanner(page);
  }

  async openHomePage(): Promise<void> {
    await this.open(env.baseUrl);
    await this.cookieBanner.acceptIfPresent();
    await this.amazonHeader.searchBar.waitUntilReady();
  }
}