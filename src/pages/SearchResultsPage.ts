import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';
import { Product } from '../models/Product';
import { PriceParser } from '../services/PriceParser';

/**
 * SearchResultsPage
 *
 * Represents the Amazon search results page.
 * This page object is responsible for:
 * - waiting for search results to appear
 * - applying brand filters
 * - sorting results by price
 * - parsing product cards from the result grid
 * - opening a selected product page
 *
 * Important:
 * This class parses candidate products, but does not decide which one is the
 * final cheapest product to use. That selection logic belongs outside this class.
 */
export class SearchResultsPage extends BasePage {
  /**
   * Search result cards rendered by Amazon.
   */
  private readonly resultCards: Locator;

  /**
   * Legacy Snickers-specific locator kept only as a reminder of earlier implementation.
   * No longer used because brand filtering is now generic.
   */
  // private readonly snickersBrandFilter: Locator;

  /**
   * Native sort select used by Amazon search results.
   * This is the preferred sort interaction strategy.
   */
  private readonly sortSelect: Locator;

  /**
   * Fallback sort dropdown trigger used only when native select is not usable.
   */
  private readonly sortDropdownTrigger: Locator;

  /**
   * Fallback option for "Price: Low to High" sorting when dropdown flow is needed.
   */
  private readonly priceLowToHighOption: Locator;

  /**
   * Local timeout for search result page waits.
   */
  private static readonly RESULTS_TIMEOUT = 20000;

  constructor(page: Page) {
    super(page);

    // Main Amazon search result cards.
    this.resultCards = page.locator('[data-component-type="s-search-result"]');

    // Legacy Snickers-only filter locator kept for reference.
    // this.snickersBrandFilter = page.locator(
    //   '#brandsRefinements a[aria-label*="Apply Snickers filter"], #brandsRefinements a:has-text("Snickers")'
    // );

    // Preferred native sort select.
    this.sortSelect = page.locator('#s-result-sort-select');

    // Fallback dropdown trigger for sorting.
    this.sortDropdownTrigger = page.locator(
      'span.a-dropdown-prompt:has-text("Featured"), ' +
        'span.a-dropdown-prompt:has-text("Price"), ' +
        '#s-result-sort-select'
    );

    // Fallback low-to-high option locator.
    this.priceLowToHighOption = page.locator(
      '#s-result-sort-select_1, ' +
        'a[data-value*="price-asc-rank"], ' +
        'li.a-dropdown-item a:has-text("Price: Low to High")'
    );
  }

  /**
   * Waits until at least the first search result card becomes visible.
   */
  async waitForResults(): Promise<void> {
    await this.resultCards.first().waitFor({
      state: 'visible',
      timeout: SearchResultsPage.RESULTS_TIMEOUT
    });
  }

  /**
   * Applies a brand filter if such a filter is available in the left refinement panel.
   *
   * Note:
   * The "brand" argument should match the actual text displayed in Amazon's brand filter,
   * not just any search term variant.
   */
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

    // Temporary fallback wait.
    // Should ideally be replaced by a stronger DOM-refresh synchronization strategy.
    await this.page.waitForTimeout(2500);

    await this.page
      .waitForFunction((prev) => window.location.href !== prev, currentUrl)
      .catch(() => {});

    await this.waitForResults();
  }

  /**
   * Sorts results by "Price: Low to High".
   *
   * Preferred strategy:
   * - use native select when available
   *
   * Fallback strategy:
   * - use dropdown trigger + explicit option click
   */
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

    // Fallback strategy: dropdown click flow.
    await this.sortDropdownTrigger.first().waitFor({
      state: 'visible',
      timeout: 15000
    });

    await this.sortDropdownTrigger.first().scrollIntoViewIfNeeded().catch(() => {});
    await this.sortDropdownTrigger.first().click();

    await this.priceLowToHighOption.first().waitFor({
      state: 'visible',
      timeout: 15000
    });

    await this.priceLowToHighOption.first().click();

    await this.page.waitForLoadState('domcontentloaded');

    // Temporary fallback wait for results refresh.
    await this.page.waitForTimeout(2500);

    await this.waitForResults();
  }

  /**
   * Parses up to the first N result cards and returns only valid product entries.
   *
   * Important:
   * This method parses the first "limit" cards from the current results list,
   * then filters out invalid cards (missing title, URL or visible price).
   */
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

        // Note:
        // searchTerm here is currently reused as a placeholder field,
        // but semantically this is not the original search query.
        // This can be improved later by separating "search input" and "parsed result title".
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