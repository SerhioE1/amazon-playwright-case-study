import { Product } from '../models/Product';

/**
 * ProductSelectionService
 *
 * Responsible for selecting products based on business rules.
 * Currently supports:
 * - selecting the cheapest valid product from a parsed list
 *
 * A valid product must have:
 * - numeric price
 * - product URL
 * - name
 */
export class ProductSelectionService {
  static getCheapestProduct(products: Product[]): Product {
    if (!products.length) {
      throw new Error('No parsed products were found.');
    }

    const validProducts = products.filter(
      (product) =>
        typeof product.price === 'number' &&
        !Number.isNaN(product.price) &&
        !!product.productUrl &&
        !!product.name
    );

    if (!validProducts.length) {
      console.log('Raw products:', products);
      throw new Error('No valid products with price and URL were found.');
    }

    console.log(
      'Valid products for selection:',
      validProducts.map((p) => ({
        name: p.name,
        price: p.price
      }))
    );

    const cheapest = validProducts.reduce((cheapest, current) =>
      current.price! < cheapest.price! ? current : cheapest
    );

    console.log('Selected cheapest product:', {
      name: cheapest.name,
      price: cheapest.price
    });

    return cheapest;
  }
}