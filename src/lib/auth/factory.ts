import { AuthService } from './service';

/**
 * Factory function to create a pre-configured AuthService instance.
 * Enables dependency injection and easier testing.
 *
 * Usage:
 *   const auth = createAuthService();
 */
function createAuthService() {
  return AuthService;
}
