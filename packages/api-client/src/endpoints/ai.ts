import type {
  NextQuestionApiRequest,
  NextQuestionApiResponse,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

/**
 * Evaluates patient state, reported symptoms, prior answers, and optional regional outbreak signals
 * to determine the next highest-yield clinical question.
 * The system never independently diagnoses the patient; requiresDoctorReview is always true.
 */
export function getNextClinicalQuestion(body: NextQuestionApiRequest): Promise<NextQuestionApiResponse> {
  return apiFetch<NextQuestionApiResponse>('/ai/next-question', {
    method: 'POST',
    body,
  });
}
