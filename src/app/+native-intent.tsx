/**
 * Deep links that are handled by the app itself (not screens).
 *
 * The Razorpay checkout page returns to `integratedspiritualapp://payment-callback?...`.
 * expo-web-browser consumes that URL to finish the payment, so the router must not
 * also try to navigate to it (there is no such screen → "Unmatched route").
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string | null {
  try {
    if (path.includes('payment-callback')) return initial ? '/' : null;
    return path;
  } catch {
    return initial ? '/' : null;
  }
}
