/**
 * Product model
 *
 * Represents a product in the test flow.
 * Used for:
 * - defining search inputs
 * - storing parsed product data from search results
 * - passing selected product data between steps
 */
export interface Product {
  /**
   * Logical product name (used in test config).
   * Example: "Snickers"
   */
  name: string;

  /**
   * Search query used in Amazon search.
   * Can differ from name.
   */
  searchTerm: string;

  /**
   * Parsed product price from search results or product page.
   */
  price?: number;

  /**
   * URL of the selected product.
   * Used for navigation/debugging.
   */
  productUrl?: string;

  /**
   * Optional improvement:
   * Real product title from UI (more precise than name)
   */
  // actualTitle?: string;
}