import { describe, it, expect, vi, afterEach } from 'vitest';
import { withRetry } from '../base';

describe('withRetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result without retrying when the first call succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, delayMs: 10, backoffMultiplier: 2 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until the function succeeds', async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('finally');

    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100, backoffMultiplier: 2 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('finally');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('makes maxRetries + 1 attempts and throws the last error when all fail', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('always down'));

    const promise = withRetry(fn, { maxRetries: 2, delayMs: 10, backoffMultiplier: 1 });
    const assertion = expect(promise).rejects.toThrow('always down');
    await vi.runAllTimersAsync();

    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry when maxRetries is 0', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'));
    await expect(
      withRetry(fn, { maxRetries: 0, delayMs: 10, backoffMultiplier: 2 }),
    ).rejects.toThrow('nope');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('waits with exponential backoff between attempts', async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const fn = vi.fn().mockRejectedValue(new Error('x'));

    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100, backoffMultiplier: 2 });
    const assertion = expect(promise).rejects.toThrow('x');
    await vi.runAllTimersAsync();
    await assertion;

    const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
    expect(delays).toEqual([100, 200, 400]);
    setTimeoutSpy.mockRestore();
  });

  it('wraps non-Error rejections in an Error', async () => {
    const fn = vi.fn().mockRejectedValue('plain string failure');
    const error = await withRetry(fn, { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('plain string failure');
  });
});
