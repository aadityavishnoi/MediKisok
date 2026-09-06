import { ApiClientError } from '@medikiosk/api-client';
import type { Dictionary } from '@medikiosk/ui';

/**
 * A 4xx response carries a specific, safe-to-show business message (e.g. "Card not
 * recognized"). Anything else - network failure, timeout, 5xx - is shown as a generic
 * "connection unavailable" message so we never leak a stack trace or raw fetch error to
 * a patient, and always give them a Retry path rather than resetting their progress.
 */
export function toUserMessage(err: unknown, dict: Dictionary): string {
  if (err instanceof ApiClientError && err.status < 500) return err.message;
  return dict.common.connectionUnavailable;
}
