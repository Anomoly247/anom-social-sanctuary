export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// OAuth state management
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";

export const encodeOAuthState = (data: { redirectUri: string; nonce: string }): string => {
  return btoa(JSON.stringify(data));
};

export const decodeOAuthState = (encoded: string): { redirectUri: string; nonce: string } => {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    throw new Error("Invalid OAuth state");
  }
};

export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!oauthPortalUrl || !appId) {
    console.warn("OAuth environment variables not configured");
    return "/";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
