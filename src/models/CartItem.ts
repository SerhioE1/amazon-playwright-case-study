/**
 * CartItem model
 *
 * Represents a single product entry in the Amazon cart.
 * This is a domain-level structure used for:
 * - parsing cart UI
 * - calculating expected totals
 * - validating cart state
 */
export interface CartItem {
  /**
   * Display name of the product as shown in the cart.
   * Note: may be truncated or slightly different from the search result title.
   */
  name: string;

  /**
   * Price of a single item (unit price).
   * Stored as number for correct calculations.
   */
  price: number;

  /**
   * Quantity of the item in the cart.
   */
  quantity: number;

  /**
   * Optional future extension:
   * Unique product identifier (ASIN).
   * Useful for more stable comparisons than name.
   */
  // asin?: string;
}