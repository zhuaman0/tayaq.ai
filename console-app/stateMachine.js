/**
 * Stateful Workflow for English Lessons.
 * Three stages: Created → InProgress → Completed
 */

export const STAGES = ['Created', 'InProgress', 'Completed'];

// Allowlist: only these transitions are permitted
export const TRANSITIONS = {
  Created: 'InProgress',
  InProgress: 'Completed',
  // Completed has no outgoing transition (final stage)
};

/**
 * Validates a stage transition.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {true} if valid
 * @throws {Error} if invalid
 */
export function validateTransition(currentStatus, targetStatus) {
  if (currentStatus === 'Completed') {
    throw new Error('Lesson is in final stage (Completed) and cannot be modified.');
  }

  if (!STAGES.includes(targetStatus)) {
    throw new Error(`Unknown stage: "${targetStatus}". Valid stages: ${STAGES.join(', ')}`);
  }

  if (TRANSITIONS[currentStatus] !== targetStatus) {
    const nextValid = TRANSITIONS[currentStatus] || 'none';
    throw new Error(
      `Illegal transition from "${currentStatus}" to "${targetStatus}". Next valid stage is "${nextValid}".`
    );
  }

  return true;
}
