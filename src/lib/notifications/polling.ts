/** How often the notification centre checks for new events. */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

/**
 * Calls `onPoll` every `intervalMs`. Returns a function that stops the timer. Keeping the timer
 * here, rather than in a component, means the UI never makes or schedules its own requests.
 */
export function startNotificationPolling(
  onPoll: () => void,
  intervalMs: number = NOTIFICATION_POLL_INTERVAL_MS,
): () => void {
  const id = setInterval(onPoll, intervalMs);
  return () => clearInterval(id);
}
