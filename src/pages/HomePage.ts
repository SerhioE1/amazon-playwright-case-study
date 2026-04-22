import { Page } from 'playwright';
import { BasePage } from './BasePage';
import { Header } from '../components/Header';
import { CookieBanner } from '../components/CookieBanner';
import { env } from '../utils/env';

/**
 * HomePage
 *
 * Represents the Amazon home page.
 * This page object is responsible for:
 * - opening the base Amazon URL
 * - handling cookie banner if present
 * - exposing reusable page-level components such as Header
 */
export class HomePage extends BasePage {
  /**
   * Header component used across the Amazon site.
   * Kept public because test flow and other page objects may interact with it.
   */
  readonly header: Header;

  /**
   * Cookie banner component.
   * Kept private because cookie handling is an internal HomePage concern.
   */
  private readonly cookieBanner: CookieBanner;

  constructor(page: Page) {
    super(page);

    // Shared page header.
    this.header = new Header(page);

    // Cookie consent handler.
    this.cookieBanner = new CookieBanner(page);
  }

  /**
   * Opens the Amazon home page and prepares it for interaction.
   *
   * Flow:
   * 1. Navigate to the base URL
   * 2. Accept cookies if banner appears
   * 3. Wait until the header search bar is ready
   */
  async openHomePage(): Promise<void> {
    // Open base Amazon URL.
    await this.open(env.baseUrl);

    // Accept cookie banner if shown.
    await this.cookieBanner.acceptIfPresent();

    // Wait until the page is actually ready for search interaction.
    await this.header.searchBar.waitUntilReady();
  }
}