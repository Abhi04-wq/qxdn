/**
 * Dynamic Admin Route Configuration from Environment Variables
 * - VITE_ADMIN_PATH (default: '/admin')
 * - VITE_ADMIN_LOGIN_PATH (default: '${VITE_ADMIN_PATH}/login')
 */

const rawPrefix = import.meta.env?.VITE_ADMIN_PATH || '/admin';
export const ADMIN_BASE = (rawPrefix.startsWith('/') ? rawPrefix : `/${rawPrefix}`).replace(/\/$/, '') || '/admin';

const rawLogin = import.meta.env?.VITE_ADMIN_LOGIN_PATH || import.meta.env?.VITE_ADMIN_LOGIN_ROUTE || `${ADMIN_BASE}/login`;
export const ADMIN_LOGIN_PATH = rawLogin.startsWith('/') ? rawLogin : `/${rawLogin}`;

export const ADMIN_ROUTES = {
  BASE: ADMIN_BASE,
  LOGIN: ADMIN_LOGIN_PATH,
  DASHBOARD: `${ADMIN_BASE}/dashboard`,
  WITHDRAWALS: `${ADMIN_BASE}/withdrawals`,
  MEMBER_DETAIL: (userId = ':userId') => `${ADMIN_BASE}/member/${userId}`,
};

export default ADMIN_ROUTES;
