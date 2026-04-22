import { Locator, Page } from 'playwright';

/**
 * SearchBar component
 *
 * Responsible for interactions with the Amazon search input
 * and search submit action located in the page header.
 *
 * This component is intentionally isolated so search logic
 * can be reused across different pages where the header exists.
 */
export class SearchBar {
  /**
   * Playwright page instance used for navigation and wait handling.
   */
  private readonly page: Page;

  /**
   * Locator for the main Amazon search input field.
   * #twotabsearchtextbox is a stable and specific locator.
   */
  private readonly searchInput: Locator;

  /**
   * Locator for the Amazon search submit button.
   * #nav-search-submit-button is the standard header search button.
   */
  private readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('#twotabsearchtextbox');
    this.searchButton = page.locator('#nav-search-submit-button');
  }

  /**
   * Waits until the search bar is ready for interaction.
   */
  async waitUntilReady(): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /**
   * Executes a search using the provided search term.
   */
  async searchFor(searchTerm: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.fill(searchTerm);
    await this.searchButton.click();
    await this.page.waitForURL(/\/s\?/);
  }
}