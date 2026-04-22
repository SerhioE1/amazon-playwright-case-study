/**
 * PriceParser
 *
 * Utility service responsible for extracting numeric price values
 * from raw UI strings (e.g. "$1.43", "Subtotal (2 items): $8.67").
 *
 * Design goals:
 * - tolerate noisy UI text
 * - support multiple numbers in one string
 * - always extract the most relevant (usually last) price value
 */
export class PriceParser {
  /**
   * Extracts a numeric price from a raw string.
   *
   * Strategy:
   * 1. Normalize separators (handle commas)
   * 2. Extract ALL numeric values
   * 3. Return the LAST valid price (most reliable for Amazon UI)
   */
  static parseCombinedPrice(rawText?: string | null): number | null {
    if (!rawText) {
      return null;
    }

    // Normalize thousands separators safely:
    // 1,234.56 -> 1234.56
    const normalized = rawText.replace(/(\d),(?=\d{3})/g, '$1');

    // Extract all possible price-like values
    const matches = normalized.match(/\d+(?:\.\d{1,2})?/g);

    if (!matches || matches.length === 0) {
      return null;
    }

    // Take the LAST value (important for strings like "Subtotal (2 items): $8.67")
    const lastValue = matches[matches.length - 1];

    const price = Number(lastValue);

    return Number.isNaN(price) ? null : price;
  }
}