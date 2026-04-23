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

    // Compose the nested header search component.
    this.searchBar = new SearchBar(page);

    // Main header cart link.
    this.cartButton = page.locator('#nav-cart');
  }

  /**
   * Opens the cart page from the header.
   *
   * Wait strategy:
   * - wait for cart button visibility before clicking
   * - click cart button
   * - wait for cart URL instead of generic timeout
   */
  async openCart(): Promise<void> {
    // Ensure the cart icon/link is present and interactable.
    await this.cartButton.waitFor({ state: 'visible' });

    // Navigate to cart.
    await this.cartButton.click();

    // Wait for actual cart navigation instead of relying only on DOM load.
    await this.page.waitForURL(/\/gp\/cart\/view\.html|\/cart/);
  }
}