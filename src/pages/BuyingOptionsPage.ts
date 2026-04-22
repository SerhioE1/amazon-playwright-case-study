import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

/**
 * BuyingOptionsPage
 *
 * This page object handles the fallback Amazon flow where a product
 * cannot be added directly from the product page and the user must go to
 * "See All Buying Options".
 *
 * Responsibility of this module:
 * - wait until the buying options UI is available
 * - find the first visible/clickable "Add to Cart" button
 * - add the first available offer to the cart
 *
 * Important:
 * This module should stay focused only on buying-options behavior.
 * Product selection logic must remain outside this class.
 */
export class BuyingOptionsPage extends BasePage {
  /**
   * Timeout used only inside this module.
   * Buying options can be slower than normal page interactions.
   */
  private static readonly BUYING_OPTIONS_TIMEOUT = 15000;

  /**
   * Main buying options container.
   *
   * We intentionally do NOT use "body" here as a fallback because that would
   * make the check too generic and could mask real failures.
   */
  private readonly buyingOptionsContainer: Locator;

  /**
   * Preferred locator for Add to Cart buttons inside buying options offers.
   *
   * We intentionally target any element with data-action="aod-atc-action"
   * instead of hardcoding "div" because Amazon may render this as different tags.
   */
  private readonly addToCartButtons: Locator;

  /**
   * Fallback locator for generic Add to Cart buttons if the preferred AOD locator
   * is not enough in a specific DOM variant.
   */
  private readonly fallbackAddToCartButtons: Locator;

  constructor(page: Page) {
    super(page);

    // Main buying options containers observed in Amazon AOD / offers flows.
    this.buyingOptionsContainer = page.locator(
      '#aod-container, #all-offers-display, #aod-offer-list'
    ).first();

    // Preferred "Add to Cart" buttons from the actual offers list.
    this.addToCartButtons = page.locator(
      '[data-action="aod-atc-action"] input[name="submit.addToCart"]'
    );

    // Generic fallback if the AOD-specific structure changes.
    this.fallbackAddToCartButtons = page.locator(
      'input[name="submit.addToCart"], ' +
        'input[aria-label*="Add to Cart"], ' +
        'input[value="Add to Cart"], ' +
        'button:has-text("Add to Cart")'
    );
  }

  /**
   * Adds the first visible available offer to the cart.
   *
   * Strategy:
   * 1. Wait for buying options container
   * 2. Try AOD-specific buttons first
   * 3. If not found, try generic fallback buttons
   * 4. Click the first visible one
   */
  async addFirstAvailableOfferToCart(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    await this.buyingOptionsContainer.waitFor({
      state: 'visible',
      timeout: BuyingOptionsPage.BUYING_OPTIONS_TIMEOUT
    });

    // Try to wait for at least one known Add to Cart button to appear.
    // Amazon often renders the buying-options container before the offer actions.
    const addToCartAppeared = await Promise.any([
      this.addToCartButtons.first().waitFor({
        state: 'visible',
        timeout: 5000
      }),
      this.fallbackAddToCartButtons.first().waitFor({
        state: 'visible',
        timeout: 5000
      })
    ])
      .then(() => true)
      .catch(() => false);

    // Temporary fallback wait.
    // Keep this because Amazon buying options UI can finish rendering
    // after the container is visible but before buttons become interactable.
    if (!addToCartAppeared) {
      await this.page.waitForTimeout(3000);
    }

    const primaryCount = await this.addToCartButtons.count().catch(() => 0);

    for (let i = 0; i < primaryCount; i++) {
      const button = this.addToCartButtons.nth(i);

      if (await button.isVisible().catch(() => false)) {
        await button.scrollIntoViewIfNeeded().catch(() => {});
        await button.click();
        return;
      }
    }

    const fallbackCount = await this.fallbackAddToCartButtons.count().catch(() => 0);

    for (let i = 0; i < fallbackCount; i++) {
      const button = this.fallbackAddToCartButtons.nth(i);

      if (await button.isVisible().catch(() => false)) {
        await button.scrollIntoViewIfNeeded().catch(() => {});
        await button.click();
        return;
      }
    }

    throw new Error(
      `No visible Add to Cart button was found in buying options. ` +
        `Primary matches: ${primaryCount}. Fallback matches: ${fallbackCount}.`
    );
  }
}