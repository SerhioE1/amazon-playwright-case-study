import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';
import { BuyingOptionsPage } from './BuyingOptionsPage';

/**
 * ProductPage
 *
 * Represents the Amazon product details page (PDP).
 * This page object is responsible for:
 * - adding a product to cart through the primary add-to-cart flow
 * - falling back to alternative Add to Cart buttons
 * - falling back to the "See All Buying Options" flow when direct purchase is unavailable
 * - waiting for confirmation that the item was added
 *
 * Goal of this class:
 * hide PDP-specific branching logic from the step definitions.
 */
export class ProductPage extends BasePage {
  /**
   * Primary Amazon add-to-cart buttons observed on product pages.
   * Includes both grocery-specific and standard cart buttons.
   */
  private readonly addToCartButton: Locator;

  /**
   * Fallback Add to Cart button locator for alternative PDP layouts.
   * Broader than the primary locator and should be treated as fallback only.
   */
  private readonly addToCartButtonFallback: Locator;

  /**
   * "See All Buying Options" entry point used when the direct Add to Cart
   * button is not available on the PDP.
   */
  private readonly seeAllBuyingOptionsButton: Locator;

  /**
   * Local timeout for product page waits.
   */
  private static readonly PRODUCT_TIMEOUT = 10000;

  constructor(page: Page) {
    super(page);

    // Main Amazon add-to-cart buttons.
    this.addToCartButton = page.locator(
      '#add-to-cart-button-grocery, #add-to-cart-button'
    ).first();

    // Fallback add-to-cart selectors for alternative markup variants.
    this.addToCartButtonFallback = page.locator(
      'input[type="submit"][value="Add to Cart"], button:has-text("Add to Cart")'
    ).first();

    // Buying options fallback entry point.
    this.seeAllBuyingOptionsButton = page.locator(
      '#buybox-see-all-buying-choices a, a[title="See All Buying Options"]'
    ).first();
  }

  /**
   * Attempts to add the product to the cart using the best available flow:
   * 1. Primary Add to Cart button
   * 2. Fallback Add to Cart button
   * 3. See All Buying Options → first available offer
   */
  async addToCart(): Promise<void> {
    // Lightweight page readiness wait.
    // This is acceptable as an initial guard, but button-specific visibility
    // checks below remain the real decision points.
    await this.page.waitForLoadState('domcontentloaded');

    // Try primary add-to-cart button first.
    if (await this.isSafelyVisible(this.addToCartButton)) {
      await this.addToCartButton.click();
      return;
    }

    // Try fallback add-to-cart button if primary button is unavailable.
    if (await this.isSafelyVisible(this.addToCartButtonFallback)) {
      await this.addToCartButtonFallback.click();
      return;
    }

    // Fall back to "See All Buying Options" flow.
    if (await this.isSafelyVisible(this.seeAllBuyingOptionsButton)) {
      await this.seeAllBuyingOptionsButton.scrollIntoViewIfNeeded().catch(() => {});
      await this.seeAllBuyingOptionsButton.click();

      await this.page.waitForLoadState('domcontentloaded');

      const buyingOptionsPage = new BuyingOptionsPage(this.page);
      await buyingOptionsPage.addFirstAvailableOfferToCart();
      return;
    }

    throw new Error(
      'Neither Add to Cart button nor See All Buying Options button was found on product page.'
    );
  }

  /**
   * Waits until Amazon shows some confirmation that the item was added to cart.
   *
   * Throws an error if no known confirmation appears within timeout.
   */
  async waitForAddToCartConfirmation(): Promise<void> {
    const confirmationSelectors = [
      'text=Added to Cart',
      '#attach-added-to-cart-message',
      '#attachDisplayAddBaseAlert',
      '#huc-v2-order-row-confirm-text',
      '#sw-atc-details-single-container',
      '#NATC_SMART_WAGON_CONF_MSG_SUCCESS'
    ];

    // Fast path: if any confirmation is already visible, return immediately.
    for (const selector of confirmationSelectors) {
      const locator = this.page.locator(selector).first();

      if (await locator.isVisible().catch(() => false)) {
        return;
      }
    }

    // Wait for any one of the known confirmation anchors.
    const results = await Promise.allSettled(
      confirmationSelectors.map((selector) =>
        this.page.locator(selector).first().waitFor({
          state: 'visible',
          timeout: ProductPage.PRODUCT_TIMEOUT
        })
      )
    );

    const hasVisibleConfirmation = results.some(
      (result) => result.status === 'fulfilled'
    );

    if (!hasVisibleConfirmation) {
      throw new Error(
        'No Add to Cart confirmation appeared after attempting to add the product.'
      );
    }
  }

  /**
   * Safe visibility helper used to reduce repeated try/catch blocks.
   */
  private async isSafelyVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible().catch(() => false);
  }
}