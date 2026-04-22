import assert from 'node:assert';
import { Given, Then, When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/custom-world';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { ProductSelectionService } from '../src/services/ProductSelectionService';
import { ProductPage } from '../src/pages/ProductPage';
import { CartPage } from '../src/pages/CartPage';

/**
 * Step definitions for Amazon cheapest-product flow.
 *
 * This file acts as orchestration layer only.
 * It intentionally delegates all low-level UI interaction to page objects and services.
 */

/**
 * Opens the application and prepares the initial page state.
 */
Given('the test framework is initialized', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await homePage.openHomePage();
});

/**
 * Searches for a product using the header search bar.
 *
 * Note:
 * We intentionally reopen the home page before each new search
 * because Amazon may leave the user on intermediate overlays or confirmation states
 * after adding a product to the cart.
 */
When('the user searches for {string}', async function (this: CustomWorld, productName: string) {
  this.currentSearchTerm = productName;

  const homePage = new HomePage(this.page);
  await homePage.openHomePage();
  await homePage.header.searchBar.searchFor(productName);
});

/**
 * Applies filter/sort logic, parses result cards,
 * selects the cheapest valid product, stores it in scenario state,
 * and opens its PDP.
 */
When(
  'the user opens the cheapest available product from the search results',
  async function (this: CustomWorld) {
    const searchResultsPage = new SearchResultsPage(this.page);

    await searchResultsPage.waitForResults();
    await searchResultsPage.applyBrandFilter(this.currentSearchTerm);
    await searchResultsPage.sortByPriceLowToHigh();

    const parsedProducts = await searchResultsPage.getFirstValidProducts(10);
    console.log(`Parsed first valid products for ${this.currentSearchTerm}:`, parsedProducts);

    const cheapestProduct = ProductSelectionService.getCheapestProduct(parsedProducts);
    console.log(`Selected cheapest product for ${this.currentSearchTerm}:`, cheapestProduct);

    this.selectedProducts.push(cheapestProduct);

    await searchResultsPage.openProduct(cheapestProduct);
  }
);

/**
 * Adds the currently opened product to cart and waits for add-to-cart confirmation.
 */
When('the user adds the product to the cart', async function (this: CustomWorld) {
  const productPage = new ProductPage(this.page);

  await productPage.addToCart();

  console.log(
    'Add to cart action was performed for product:',
    this.selectedProducts[this.selectedProducts.length - 1]
  );
});

/**
 * Opens the cart from the home page.
 *
 * Similar to search flow, we intentionally reopen the home page first
 * to avoid staying on Amazon intermediate add-to-cart states or overlays.
 */
When('the user opens the cart', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);

  await homePage.openHomePage();
  await homePage.header.openCart();
});

/**
 * Verifies:
 * 1. the cart contains only the products selected during the test
 * 2. the combined subtotal matches the sum of selected product prices
 */
Then(
  'the cart subtotal should match the sum of the selected product prices',
  async function (this: CustomWorld) {
    const cartPage = new CartPage(this.page);

    const expectedNames = this.selectedProducts.map((product) => product.name);
    await cartPage.verifyCartContainsOnlyExpectedItems(expectedNames);

    const actualSubtotal = await cartPage.getCombinedSubtotal();

    const expectedSubtotal = this.selectedProducts.reduce(
      (sum, product) => sum + product.price!,
      0
    );

    console.log('Selected products:', this.selectedProducts);
    console.log('Expected product names:', expectedNames);
    console.log('Expected subtotal:', expectedSubtotal);
    console.log('Actual combined subtotal:', actualSubtotal);

    assert.strictEqual(
      Number(actualSubtotal.toFixed(2)),
      Number(expectedSubtotal.toFixed(2)),
      'Combined cart subtotal does not match the sum of selected product prices.'
    );
  }
);