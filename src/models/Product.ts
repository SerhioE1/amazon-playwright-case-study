/**
 * Product model
 * Represents a product in the test flow.
 */
export interface Product {

  name: string;
  searchTerm: string;
  price?: number;
  productUrl?: string;
}