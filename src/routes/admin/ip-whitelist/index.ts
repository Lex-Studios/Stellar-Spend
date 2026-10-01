/**
 * Admin IP-whitelist route.
 * Delegates to the shared router with the admin capability set.
 */
import { buildIpWhitelistRouter } from '../../_shared/ip-whitelist.router';
import { requireAdminAuth } from '../../../middleware/auth';

export const adminIpWhitelistRouter = buildIpWhitelistRouter({
  role: 'admin',
  auth: requireAdminAuth,
});
