import { Locator, Page } from 'playwright';
import { SearchBar } from './SearchBar';

/**
 * Header component
 *
 * Represents the reusable Amazon page header.
 * This component owns:
 * - search bar interactions
 * - cart navigation
 *
 * It is used across multiple pages, which makes it a good candidate
 * for a shared UI component instead of duplicating header logic
 * inside each page object.
 */
export class Header {
  /**
   * Playwright page instance used by this component.
   * Kept private because consumers of Header should interact
   * with exposed methods instead of raw page internals.
   */
  private readonly page: Page;

  /**
   * SearchBar component nested inside the header.
   * Kept public because external pages/tests may need to
   * trigger product searches through the header.
   */
  readonly searchBar: SearchBar;

  /**
   * Locator for the cart link in the Amazon header.
   * #nav-cart is a stable and sufficiently specific locator here.
   */
  private readonly cartButton: Locator;

  constructor(page: Page) {
    // Store the page instance for navigation and state waiting.
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