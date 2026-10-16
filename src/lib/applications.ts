/** Shared by the application form and the server: the audience sizes a person can pick. */
export const AUDIENCE_SIZES = ["lt1k", "1k-10k", "10k-50k", "50k-100k", "100k+"] as const;
export type AudienceSize = (typeof AUDIENCE_SIZES)[number];
