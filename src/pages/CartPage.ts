import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';
import { PriceParser } from '../services/PriceParser';

/**
 * CartPage
 *
 * Encapsulates Amazon cart interactions and validations:
 * - reading subtotal values from regular and Fresh cart areas
 * - collecting cart item names
 * - validating that the cart contains only expected items
 * - cleaning up cart state after tests
 * - verifying that the cart is empty after cleanup
 *
 * This page object intentionally contains more logic than a very thin page model,
 * because Amazon cart behavior is split across multiple cart sections and requires
 * validation of both content and totals.
 */
export class CartPage extends BasePage {
  /**
   * Subtotal containers for regular cart and Fresh cart.
   * We target the subtotal amount containers directly to avoid duplicate nested price spans.
   */
  private readonly subtotalAmountContainers: Locator;

  /**
   * Regular Amazon cart item title locators.
   *
   * Note:
   * This currently uses two text sources because Amazon may render the cart title
   * in slightly different nested elements. Duplicates are normalized later.
   */
  private readonly regularCartItemTitles: Locator;

  /**
   * Fresh collapsed cart items are currently read from image alt text.
   * This is acceptable for the current UI structure, though not ideal.
   */
  private readonly freshCollapsedItemImages: Locator;

  /**
   * Link to expand/open Fresh cart details.
   */
  private readonly freshCartLink: Locator;

  /**
   * Delete buttons for regular cart items.
   */
  private readonly regularDeleteButtons: Locator;

  /**
   * Delete buttons for Fresh/local market cart items.
   *
   * Current locator is broad and may need tightening if Amazon changes markup.
   */
  private readonly freshDeleteButtons: Locator;

  /**
   * Potential fallback locator for empty cart messages.
   * Currently unused, but kept as a possible future stronger validation anchor.
   */
  // private readonly emptyCartMessage: Locator;

  /**
   * Local timeout used in cart-specific waits.
   */
  private static readonly CART_TIMEOUT = 10000;

  constructor(page: Page) {
    super(page);

    // Subtotal blocks for standard cart and Fresh cart.
    this.subtotalAmountContainers = page.locator(
      '#sc-buy-box #sc-subtotal-amount-buybox, ' +
        '#sc-fresh-buy-box #sc-subtotal-amount-buybox'
    );

    // Product titles in the standard cart.
    this.regularCartItemTitles = page.locator(
      'ul[data-name="Active Items"] a.sc-product-title .a-truncate-full, ' +
        'ul[data-name="Active Items"] a.sc-product-title h3'
    );

    // Fresh collapsed items are displayed as thumbnail images with meaningful alt text.
    this.freshCollapsedItemImages = page.locator(
      'div[data-name="collapsed_item_list"] img.sc-product-image'
    );

    // Entry point to the Fresh/local market cart details.
    this.freshCartLink = page.locator(
      'a[href*="/cart/localmarket"], a.sc-collapsed-item-thumbnails'
    ).first();

    // Delete buttons in the regular cart.
    this.regularDeleteButtons = page.locator('input[data-action="delete-active"]');

    // Delete buttons in Fresh cart.
    this.freshDeleteButtons = page.locator('input[data-action="delete"]');

    // Kept as fallback idea for stronger empty-cart validation in future.
    // this.emptyCartMessage = page.locator(
    //   'text=Your Amazon Cart is empty, text=Your Fresh Cart is empty, text=Your cart is empty'
    // );
  }

  /**
   * Reads all visible subtotal values from cart subtotal blocks.
   */
  async getAllVisibleSubtotals(): Promise<number[]> {
    const subtotalTexts = await this.subtotalAmountContainers.evaluateAll((elements) =>
      elements
        .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '))
        .filter((text) => !!text)
    );

    const parsedSubtotals = subtotalTexts
      .map((text) => PriceParser.parseCombinedPrice(text))
      .filter((value): value is number => value !== null);

    console.log('Visible subtotal texts:', subtotalTexts);
    console.log('Parsed visible subtotals:', parsedSubtotals);

    if (!parsedSubtotals.length) {
      throw new Error('No visible subtotal amounts were found in the cart.');
    }

    return parsedSubtotals;
  }

  /**
   * Returns the sum of all detected visible subtotals.
   * Used for combined subtotal validation when regular + Fresh cart coexist.
   */
  async getCombinedSubtotal(): Promise<number> {
    const subtotals = await this.getAllVisibleSubtotals();
    return subtotals.reduce((sum, value) => sum + value, 0);
  }

  /**
   * Returns normalized item names from the regular Amazon cart.
   */
  async getRegularCartItemNames(): Promise<string[]> {
    const names = await this.regularCartItemTitles.evaluateAll((elements) =>
      elements
        .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '))
        .filter((text) => !!text)
    );

    return this.uniqueNormalized(names);
  }

  /**
   * Returns normalized item names from the collapsed Fresh cart area.
   * Uses image alt attributes as current source of truth.
   */
  async getFreshCollapsedItemNames(): Promise<string[]> {
    const names = await this.freshCollapsedItemImages.evaluateAll((elements) =>
      elements
        .map((el) => (el.getAttribute('alt') || '').trim().replace(/\s+/g, ' '))
        .filter((text) => !!text)
    );

    return this.uniqueNormalized(names);
  }

  /**
   * Returns all unique normalized item names across regular and Fresh cart areas.
   */
  async getAllCartItemNames(): Promise<string[]> {
    const regularNames = await this.getRegularCartItemNames();
    const freshNames = await this.getFreshCollapsedItemNames();

    const allNames = [...regularNames, ...freshNames];
    const uniqueNames = this.uniqueNormalized(allNames);

    console.log('Regular cart item names:', regularNames);
    console.log('Fresh collapsed item names:', freshNames);
    console.log('All cart item names:', uniqueNames);

    return uniqueNames;
  }

  /**
   * Verifies that the cart contains only expected items and that no expected item is missing.
   */
  async verifyCartContainsOnlyExpectedItems(expectedNames: string[]): Promise<void> {
    const actualNames = await this.getAllCartItemNames();

    const normalizedExpected = this.uniqueNormalized(expectedNames);

    const unexpectedItems = actualNames.filter(
      (actual) => !normalizedExpected.some((expected) => this.namesMatch(expected, actual))
    );

    const missingExpectedItems = normalizedExpected.filter(
      (expected) => !actualNames.some((actual) => this.namesMatch(expected, actual))
    );

    console.log('Expected cart item names:', normalizedExpected);
    console.log('Unexpected cart items:', unexpectedItems);
    console.log('Missing expected cart items:', missingExpectedItems);

    if (unexpectedItems.length > 0) {
      throw new Error(
        `Unexpected items were found in the cart: ${unexpectedItems.join(' | ')}`
      );
    }

    if (missingExpectedItems.length > 0) {
      throw new Error(
        `Expected items are missing from the cart: ${missingExpectedItems.join(' | ')}`
      );
    }
  }

  /**
   * Clears both regular and Fresh cart items.
   *
   * Note:
   * Current implementation still uses short timeout-based waits after delete actions.
   * These are temporary synchronization fallbacks and should ideally be replaced later
   * with DOM-state waits (e.g. button count decrease / item disappearance).
   */
  async clearCart(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    // Clear regular cart items.
    while ((await this.regularDeleteButtons.count()) > 0) {
      const btn = this.regularDeleteButtons.first();

      if (await btn.isVisible().catch(() => false)) {
        await btn.click();

        // Temporary fallback wait after delete.
        // Better future alternative: wait until the item row disappears or button count decreases.
        await this.page.waitForTimeout(1000);
      } else {
        break;
      }
    }

    // Clear Fresh/local market cart items if Fresh cart exists.
    if (await this.freshCartLink.isVisible().catch(() => false)) {
      await this.freshCartLink.click();
      await this.page.waitForLoadState('domcontentloaded');

      // Temporary fallback wait after entering Fresh cart.
      // Better future alternative: wait for Fresh item list anchor.
      await this.page.waitForTimeout(1000);

      while ((await this.freshDeleteButtons.count()) > 0) {
        const btn = this.freshDeleteButtons.first();

        if (await btn.isVisible().catch(() => false)) {
          await btn.click();

          // Temporary fallback wait after delete.
          await this.page.waitForTimeout(1000);
        } else {
          break;
        }
      }
    }
  }

  /**
   * Verifies that cart no longer contains any remaining regular or Fresh items.
   */
  async verifyCartIsEmpty(): Promise<void> {
    const regularNames = await this.getRegularCartItemNames();
    const freshNames = await this.getFreshCollapsedItemNames();

    const allItems = [...regularNames, ...freshNames];

    if (allItems.length > 0) {
      throw new Error(`Cart is not empty after cleanup. Remaining items: ${allItems.join(' | ')}`);
    }

    console.log('Cart is empty after cleanup.');
  }

  /**
   * Normalizes a product name for safer comparisons.
   */
  private normalizeName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Returns unique normalized names, removing duplicates and empty values.
   */
  private uniqueNormalized(names: string[]): string[] {
    return [...new Set(names.map((name) => this.normalizeName(name)).filter(Boolean))];
  }

  /**
   * Current relaxed matching strategy for expected vs actual product names.
   *
   * This is intentionally tolerant because Amazon titles may differ between:
   * - search result page
   * - product page
   * - cart
   *
   * Note:
   * This strategy may be too permissive in some edge cases and can be tightened later
   * if stable ASIN-based comparison is introduced.
   */
  private namesMatch(expected: string, actual: string): boolean {
    const normalizedExpected = this.normalizeName(expected);
    const normalizedActual = this.normalizeName(actual);

    return (
      normalizedActual.includes(normalizedExpected) ||
      normalizedExpected.includes(normalizedActual)
    );
  }
}