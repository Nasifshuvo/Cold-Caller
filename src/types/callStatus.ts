/**
 * Enum representing all possible call statuses in the system
 */
export enum CallStatus {
  INITIATED = 'initiated',    // When the call is sent to API to attempt a call
  QUEUED = 'queued',          // When we got a response for that call and call ID
  IN_PROGRESS = 'in-progress', // Call attempt on user's phone
  ENDED = 'ended',            // The call ended
  COMPLETED = 'completed',    // When we get the final end-call-report from VAPI
  FAILED = 'failed',          // When call attempt failed
  CANCELED = 'canceled',      // When call was canceled before completion
}

/**
 * Array of call statuses considered "active" (call is still in progress)
 */
export const ACTIVE_CALL_STATUSES = [
  CallStatus.INITIATED,
  CallStatus.QUEUED,
  CallStatus.IN_PROGRESS
];

/**
 * Array of call statuses considered "completed" (call has finished)
 */
export const COMPLETED_CALL_STATUSES = [
  CallStatus.ENDED,
  CallStatus.COMPLETED
];

/**
 * Array of call statuses considered "unsuccessful" (call didn't go through)
 */
export const UNSUCCESSFUL_CALL_STATUSES = [
  CallStatus.FAILED,
  CallStatus.CANCELED
]; 