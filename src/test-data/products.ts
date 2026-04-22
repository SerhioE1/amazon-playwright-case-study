import { Product } from '../models/Product';

/**
 * targetProducts
 *
 * Defines the set of products used in the test scenario.
 *
 * Each product includes:
 * - searchTerm: what user enters in search
 * - name: expected keyword for validation in cart
 *
 * Note:
 * name and searchTerm may differ in real scenarios.
 */
export const targetProducts: Product[] = [
  {
    name: 'Snickers',
    searchTerm: 'Snickers'
  },
  {
    name: 'Skittles',
    searchTerm: 'Skittles'
  },
  {
    name: 'Twix',
    searchTerm: 'Twix'
  },
  {
    name: 'Kit Kat',
    searchTerm: 'Kit Kat'
  }
];