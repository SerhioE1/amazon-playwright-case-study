import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';
import { Product } from '../models/Product';
import { PriceParser } from '../services/PriceParser';

/**
 * SearchResultsPage
 * Represents the Amazon search results page.
 */
export class SearchResultsPage extends BasePage {

  private readonly resultCards: Locator;
  private readonly sortSelect: Locator;
  private readonly sortDropdownTrigger: Locator;
  private readonly priceLowToHighOption: Locator;
  private static readonly RESULTS_TIMEOUT = 20000;
  private static readonly DROPDOWN_TIMEOUT = 10000;

  constructor(page: Page) {
    super(page);

    this.resultCards = page.locator('[data-component-type="s-search-result"]');
    this.sortSelect = page.locator('#s-result-sort-select');

    this.sortDropdownTrigger = page.locator(
      'span.a-dropdown-prompt:has-text("Featured"), ' +
        'span.a-dropdown-prompt:has-text("Price"), ' +
        '#s-result-sort-select'
    );//TODO: Change locator to more stable

    this.priceLowToHighOption = page.locator(
      '#s-result-sort-select_1, ' +
        'a[data-value*="price-asc-rank"], ' +
        'li.a-dropdown-item a:has-text("Price: Low to High")'
    );//TODO: Change locator to more stable
  }

  async waitForResults(): Promise<void> {
    await this.resultCards.first().waitFor({
      state: 'visible',
      timeout: SearchResultsPage.RESULTS_TIMEOUT
    });
  }

  async applyBrandFilter(brand: string): Promise<void> {
    await this.waitForResults();

    const filter = this.page.locator(
      `#brandsRefinements a:has-text("${brand}")`
    ).first();

    if (!(await filter.isVisible().catch(() => false))) {
      console.log(`Brand filter "${brand}" not found, skipping filter.`);
      return;
    }

    const currentUrl = this.page.url();

    await filter.scrollIntoViewIfNeeded().catch(() => {});
    await filter.click();

    await this.page.waitForLoadState('domcontentloaded');

    await this.page.waitForTimeout(2500);

    await this.page
      .waitForFunction((prev) => window.location.href !== prev, currentUrl)
      .catch(() => {});

    await this.waitForResults();
  }

  async sortByPriceLowToHigh(): Promise<void> {
    await this.waitForResults();

    // Preferred strategy: native select.
    if (await this.sortSelect.isVisible().catch(() => false)) {
      await this.sortSelect.selectOption({ value: 'price-asc-rank' });
      await this.page.waitForLoadState('domcontentloaded');

      // Temporary fallback wait for results refresh.
      await this.page.waitForTimeout(2500);

      await this.waitForResults();
      return;
    }

    await this.sortDropdownTrigger.first().waitFor({
      state: 'visible',
      timeout: SearchResultsPage.DROPDOWN_TIMEOUT
    });

    await this.sortDropdownTrigger.first().scrollIntoViewIfNeeded().catch(() => {});
    await this.sortDropdownTrigger.first().click();

    await this.priceLowToHighOption.first().waitFor({
      state: 'visible',
      timeout: SearchResultsPage.DROPDOWN_TIMEOUT
    });

    await this.priceLowToHighOption.first().click();

    await this.page.waitForLoadState('domcontentloaded');

    // Temporary fallback wait for results refresh.
    await this.page.waitForTimeout(2500);

    await this.waitForResults();
  }

  async getFirstValidProducts(limit = 10): Promise<Product[]> {
    await this.waitForResults();

    const rawProducts = await this.resultCards.evaluateAll((cards, maxCount) => {
      return cards.slice(0, maxCount).map((card, index) => {
        const titleLink = card.querySelector(
          'div[data-cy="title-recipe"] a.a-link-normal'
        ) as HTMLAnchorElement | null;

        const titleSpan = card.querySelector(
          'div[data-cy="title-recipe"] a.a-link-normal h2 span'
        ) as HTMLSpanElement | null;

        const secondaryOfferPrice = card.querySelector(
          'div[data-cy="secondary-offer-recipe"] span.a-color-base'
        ) as HTMLSpanElement | null;

        const offscreenPrice = card.querySelector(
          '.a-price .a-offscreen'
        ) as HTMLSpanElement | null;

        return {
          index: index + 1,
          name: titleSpan?.textContent?.trim() || '',
          relativeUrl: titleLink?.getAttribute('href') || null,
          secondaryOfferPrice: secondaryOfferPrice?.textContent?.trim() || null,
          fallbackOffscreenPrice: offscreenPrice?.textContent?.trim() || null
        };
      });
    }, limit);

    const products: Product[] = [];

    for (const raw of rawProducts) {
      const price =
        PriceParser.parseCombinedPrice(raw.secondaryOfferPrice) ??
        PriceParser.parseCombinedPrice(raw.fallbackOffscreenPrice);

      console.log(`Card ${raw.index}:`, {
        name: raw.name,
        relativeUrl: raw.relativeUrl,
        secondaryOfferPrice: raw.secondaryOfferPrice,
        fallbackOffscreenPrice: raw.fallbackOffscreenPrice,
        price
      });

      if (!raw.name || !raw.relativeUrl || price === null) {
        continue;
      }

      products.push({
        // Current product title as rendered in the search result card.
        name: raw.name,
        searchTerm: raw.name,

        price,
        productUrl: this.toAbsoluteUrl(raw.relativeUrl)
      });
    }

    if (!products.length) {
      throw new Error(
        'No valid product cards with visible price were parsed from the first search results.'
      );
    }

    return products;
  }

  /**
   * Opens the PDP for the selected product.
   */
  async openProduct(product: Product): Promise<void> {
    if (!product.productUrl) {
      throw new Error(`Product URL is missing for: ${product.name}`);
    }

    await this.page.goto(product.productUrl, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Converts relative Amazon URLs into absolute URLs.
   */
  private toAbsoluteUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }

    return new URL(relativeUrl, this.page.url()).toString();
  }
}