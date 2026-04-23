import { Locator, Page } from 'playwright';
import { SearchBar } from './SearchBar';

/**
 * Header component
 * Represents the reusable Amazon page header.
 */
export class AmazonHeader {

  private readonly page: Page;
  readonly searchBar: SearchBar;
  private readonly cartButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchBar = new SearchBar(page);
    this.cartButton = page.locator('#nav-cart');
  }

  async openCart(): Promise<void> {
    await this.cartButton.waitFor({ state: 'visible' });

    await this.cartButton.click();

    // Wait for actual cart navigation instead of relying only on DOM load.
    await this.page.waitForURL(/\/gp\/cart\/view\.html|\/cart/);
  }
}