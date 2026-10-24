/**
 * Utility functions for pricing across Drugza store.
 * Applies ceiling rounding (Math.ceil) to eliminate decimal fractions.
 */

export function ceilPrice(price: number | undefined | null): number {
  if (price == null || isNaN(price)) return 0;
  return Math.ceil(price);
}

export function formatPrice(price: number | undefined | null): string {
  return ceilPrice(price).toLocaleString();
}
