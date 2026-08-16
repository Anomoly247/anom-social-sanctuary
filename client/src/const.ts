export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Starts the server-managed Google OAuth flow. Navigation to this path must
 * bypass the SPA router so the browser sends a full HTTP request to the backend.
 */
export const GOOGLE_AUTH_PATH = "/api/auth/google";

export const getLoginUrl = () => GOOGLE_AUTH_PATH;
