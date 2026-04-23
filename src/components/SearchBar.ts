import { Locator, Page } from 'playwright';

/**
 * SearchBar component
 */
export class SearchBar {

  private readonly page: Page;

  private readonly searchInput: Locator;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('#twotabsearchtextbox');
    this.searchButton = page.locator('#nav-search-submit-button');
  }

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