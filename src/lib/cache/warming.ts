/**
 * Cache Warming
 *
 * Pre-populate cache with popular corridors to improve hit rate.
 * Run on server startup or via scheduled cron.
 */

import { cache } from './index';
import { CACHE_KEYS, generateCacheKey, HOT_CORRIDORS } from './keys';
import { logger } from '@/lib/logger';

/**
 * Warm quote cache for popular corridors
 */
export async function warmQuoteCache(): Promise<void> {
  logger.info('cache_warming.quote.start');

  const results = await Promise.allSettled(
    HOT_CORRIDORS.map(async ({ currency, amount }) => {
      try {
        // Mock quote fetch - replace with actual API call
        const quote = {
          destinationAmount: (parseFloat(amount) * 1500).toString(),
          rate: 1500,
          currency,
          bridgeFee: '0.5',
          payoutFee: '2.0',
          estimatedTime: 300,
        };

        const key = generateCacheKey(CACHE_KEYS.QUOTE, amount, currency, 'USDC');
        await cache.set(key, quote, CACHE_KEYS.QUOTE);
        logger.info('cache_warming.quote.warmed', { currency, amount });
      } catch (error) {
        logger.error('cache_warming.quote.failed', { currency, amount }, error);
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  logger.info('cache_warming.quote.completed', { succeeded, total: HOT_CORRIDORS.length });
}

/**
 * Warm currencies cache
 */
export async function warmCurrenciesCache(): Promise<void> {
  logger.info('cache_warming.currencies.start');

  try {
    // Mock currency list - replace with actual API call
    const currencies = [
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
    ];

    const key = generateCacheKey(CACHE_KEYS.CURRENCIES);
    await cache.set(key, currencies, CACHE_KEYS.CURRENCIES);
    logger.info('cache_warming.currencies.warmed');
  } catch (error) {
    logger.error('cache_warming.currencies.failed', {}, error);
  }
}

/**
 * Warm all enabled caches
 */
export async function warmAllCaches(): Promise<void> {
  logger.info('cache_warming.all.start');
  const start = Date.now();

  await Promise.allSettled([warmQuoteCache(), warmCurrenciesCache()]);

  const duration = Date.now() - start;
  logger.info('cache_warming.all.completed', { durationMs: duration });
}
