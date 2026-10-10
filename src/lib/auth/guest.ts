// Guest accounts are created by the create-guest edge function with this address pattern.
export const GUEST_EMAIL_DOMAIN = "@demo.local";

// Whether an account is a demo guest. Decided by the account itself and never by
// something remembered in the browser, because a stale flag there once caused
// a real user's applications to be deleted on logout.
export const isGuestEmail = (email: string | null | undefined): boolean =>
  typeof email === "string" && email.trim().toLowerCase().endsWith(GUEST_EMAIL_DOMAIN);
