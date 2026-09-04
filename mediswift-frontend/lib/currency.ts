/**
 * Currency Formatter Utility for Mediswift Pro
 * Standardized for Indian Rupee (INR - ₹)
 */

export function formatINR(
  amount: number | string | null | undefined,
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showSymbol ? '₹ 0.00' : '0.00';
  }

  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numericValue);

    return showSymbol ? `₹ ${formatted}` : formatted;
  } catch {
    return showSymbol ? `₹ ${numericValue.toFixed(2)}` : numericValue.toFixed(2);
  }
}

/**
 * Compact formatter for badges and small UI widgets (e.g. ₹ 1.2K)
 */
export function formatINRCompact(amount: number | string): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return '₹ 0';

  if (val >= 10000000) {
    return `₹ ${(val / 10000000).toFixed(1)} Cr`;
  }
  if (val >= 100000) {
    return `₹ ${(val / 100000).toFixed(1)} Lakh`;
  }
  if (val >= 1000) {
    return `₹ ${(val / 1000).toFixed(1)}K`;
  }
  return `₹ ${val.toFixed(0)}`;
}

export default formatINR;
