import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';
import { BuyingOptionsPage } from './BuyingOptionsPage';

/**
 * ProductPage
 *
 * Represents the Amazon product details page (PDP).
 */
export class ProductPage extends BasePage {

  private readonly addToCartButton: Locator;
  private readonly addToCartButtonFallback: Locator;
  private readonly seeAllBuyingOptionsButton: Locator;
  private static readonly PRODUCT_TIMEOUT = 2000;

  constructor(page: Page) {
    super(page);

    // Main Amazon add-to-cart buttons.
    this.addToCartButton = page.locator(
      '#add-to-cart-button-grocery, #add-to-cart-button'
    ).first();

    // Fallback add-to-cart selectors for alternative markup variants.
    this.addToCartButtonFallback = page.locator(
      'input[type="submit"][value="Add to Cart"], button:has-text("Add to Cart")'
    ).first(); //TODO: Change locator to more stable

    // Buying options fallback entry point.
    this.seeAllBuyingOptionsButton = page.locator(
      '#buybox-see-all-buying-choices a, a[title="See All Buying Options"]'
    ).first(); //TODO: Change locator to more stable
  }

 
  async addToCart(): Promise<void> {
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


  async waitForAddToCartConfirmation(): Promise<void> {
    const confirmationSelectors = [
      'text=Added to Cart',
      '#attach-added-to-cart-message',
      '#attachDisplayAddBaseAlert',
      '#huc-v2-order-row-confirm-text',
      '#sw-atc-details-single-container',
      '#NATC_SMART_WAGON_CONF_MSG_SUCCESS'
    ];

    for (const selector of confirmationSelectors) {
      const locator = this.page.locator(selector).first();

      if (await locator.isVisible().catch(() => false)) {
        return;
      }
    }

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