// lib/adxc/realm-name.ts
//
// A realm's name becomes part of its connector address, so it's limited to lowercase
// letters, digits and hyphens. Shared by the form (live help) and the server action.

export const REALM_NAME_MAX = 120;
export const REALM_NAME_PATTERN = /^[a-z0-9-]+$/;
export const REALM_NAME_HINT =
    "Lowercase letters, digits and hyphens, because the name becomes part of its connector address.";

/** Friendly typing help: "Northwind Foods" → "northwind-foods". Other characters are left for validation to flag. */
export const normalizeRealmName = (raw: string) => raw.toLowerCase().replace(/\s+/g, "-");

/** Null when valid, otherwise a message to show. */
export function realmNameError(name: string): string | null {
    if (!name) return "Give the realm a name.";
    if (name.length > REALM_NAME_MAX) return `Keep the name under ${REALM_NAME_MAX} characters.`;
    if (!REALM_NAME_PATTERN.test(name)) return "Use only lowercase letters, digits and hyphens.";
    return null;
}
