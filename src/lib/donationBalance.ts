/** Calculates the amount still to collect against the assigned donation. */
export function recoverableAmount(assignedAmount: number, collectedAmount: number): number {
  return Math.max(0, assignedAmount - collectedAmount);
}