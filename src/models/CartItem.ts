/**
 * CartItem model
 * Represents a single product entry in the Amazon cart.
 */
export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}