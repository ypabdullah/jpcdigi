
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number to Indonesian Rupiah format
 * @param amount - The number to format
 * @returns A string with the formatted amount
 */
export function formatRupiah(amount: number | string): string {
  // Convert string to number if necessary
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
  
  // Format with Intl.NumberFormat
  const formatted = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
  
  // Replace 'IDR' with 'Rp' if it appears at the beginning
  return formatted.replace(/^IDR\s*/, 'Rp');
}

