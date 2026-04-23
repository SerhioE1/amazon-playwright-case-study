import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

/**
 * BuyingOptionsPage
 *
 * This page object handles the fallback Amazon flow where a product
 * cannot be added directly from the product page and the user must go to
 * "See All Buying Options".
 *
 */
export class BuyingOptionsPage extends BasePage {

  private static readonly BUYING_OPTIONS_TIMEOUT = 2000;
  private static readonly TIMEOUT = 2000;
  private readonly buyingOptionsContainer: Locator;
  private readonly addToCartButtons: Locator;
  private readonly fallbackAddToCartButtons: Locator;

  constructor(page: Page) {
    super(page);

    this.buyingOptionsContainer = page.locator(
      '#aod-container, #all-offers-display, #aod-offer-list'
    ).first();

    this.addToCartButtons = page.locator(
      '[data-action="aod-atc-action"] input[name="submit.addToCart"]'
    );

    this.fallbackAddToCartButtons = page.locator(
      'input[name="submit.addToCart"], ' +
        'input[aria-label*="Add to Cart"], ' +
        'input[value="Add to Cart"], ' +
        'button:has-text("Add to Cart")'
    ); //TODO: use more stable locator
  }

  async addFirstAvailableOfferToCart(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    await this.buyingOptionsContainer.waitFor({
      state: 'visible',
      timeout: BuyingOptionsPage.BUYING_OPTIONS_TIMEOUT
    });

    const addToCartAppeared = await Promise.any([
      this.addToCartButtons.first().waitFor({
        state: 'visible',
        timeout: BuyingOptionsPage.TIMEOUT
      }),
      this.fallbackAddToCartButtons.first().waitFor({
        state: 'visible',
        timeout: BuyingOptionsPage.TIMEOUT
      })
    ])
      .then(() => true)
      .catch(() => false);

    if (!addToCartAppeared) {
      await this.page.waitForTimeout(BuyingOptionsPage.TIMEOUT);
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