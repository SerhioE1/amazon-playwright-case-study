import assert from 'node:assert';
import { Given, Then, When } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
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

Given('the test framework is initialized', async function (this: CustomWorld) {
  this.selectedProducts = [];

  const homePage = new HomePage(this.page);
  await homePage.openHomePage();
});

When(
  'the user adds the cheapest products to the cart:',
  async function (this: CustomWorld, dataTable: DataTable) {
    const productNames = dataTable.raw().flat().filter(Boolean);

    for (const productName of productNames) {
      this.currentSearchTerm = productName;

      const homePage = new HomePage(this.page);
      await homePage.openHomePage();
      await homePage.amazonHeader.searchBar.searchFor(productName);

      const searchResultsPage = new SearchResultsPage(this.page);

      await searchResultsPage.waitForResults();
      await searchResultsPage.applyBrandFilter(productName);
      await searchResultsPage.sortByPriceLowToHigh();

      const parsedProducts = await searchResultsPage.getFirstValidProducts(10);
      console.log(`Parsed first valid products for ${productName}:`, parsedProducts);

      const cheapestProduct = ProductSelectionService.getCheapestProduct(parsedProducts);
      console.log(`Selected cheapest product for ${productName}:`, cheapestProduct);

      this.selectedProducts.push(cheapestProduct);

      await searchResultsPage.openProduct(cheapestProduct);

      const productPage = new ProductPage(this.page);
      await productPage.addToCart();

      console.log('Add to cart action was performed for product:', cheapestProduct);
    }
  }
);

When('the user opens the cart', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);

  await homePage.openHomePage();
  await homePage.amazonHeader.openCart();
});

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