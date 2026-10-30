// lib/auth/config.ts — sign-in settings shared by the browser and the server.

/** How long a sign-in lasts before the person has to enter a new email code. Stytch's max is 10080 (7 days). */
export const SESSION_MINUTES = 1440;

/** Cookies the Stytch SDK writes on our own domain (SDK defaults). */
export const SESSION_COOKIE = "stytch_session"; // long-lived: "is someone signed in?"
export const JWT_COOKIE = "stytch_session_jwt"; // 5-minute pass sent to the ADXC API

/** Only allow redirects back into this app after sign-in. */
export function safeNext(next: string | null | undefined) {
    return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}
