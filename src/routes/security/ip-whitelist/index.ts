/**
 * Security IP-whitelist route.
 * Delegates to the shared router with the security capability set
 * (read-only; no mutation).
 */
import { buildIpWhitelistRouter } from '../../_shared/ip-whitelist.router';
import { requireSecurityAuth } from '../../../middleware/auth';

export const securityIpWhitelistRouter = buildIpWhitelistRouter({
  role: 'security',
  auth: requireSecurityAuth,
});
