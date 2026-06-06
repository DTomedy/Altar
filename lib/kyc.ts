import Decimal from 'decimal.js';

/**
 * Checks if a user is allowed to withdraw a certain amount based on their KYC level.
 * Level 0: Cannot withdraw (Needs KYC Level 2)
 * Level 1: Cannot withdraw (Needs KYC Level 2)
 * Level 2: Withdrawals up to ₦500,000.00
 * Level 3: Unlimited withdrawals (requires BVN bank link verification)
 */
export function canWithdraw(kycLevel: number, amount: Decimal | number): boolean {
  const numericAmount = typeof amount === 'number' ? amount : amount.toNumber();
  
  if (kycLevel < 2) {
    return false;
  }
  
  if (kycLevel < 3 && numericAmount > 500000) {
    return false;
  }
  
  return true;
}

/**
 * Gets a description of a user's KYC tier requirements.
 */
export function getKycLevelDescription(level: number): string {
  switch (level) {
    case 0:
      return 'Unverified (Email Verification & Phone Number required to reach Level 1)';
    case 1:
      return 'Basic Verified (Government-issued ID required for Level 2 - unlocks withdrawals up to ₦500,000)';
    case 2:
      return 'ID Verified (Bank account verification required for Level 3 - unlocks unlimited withdrawals)';
    case 3:
      return 'Fully Verified (Unlimited withdrawals enabled)';
    default:
      return 'Unknown';
  }
}
