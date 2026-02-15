import crypto from 'crypto';

/**
 * Generate a cryptographically secure random reset token
 * @returns A 64-character hexadecimal string (256 bits of entropy)
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a reset token for secure storage
 * Prevents token theft if database is compromised
 * @param token Plain text token
 * @returns SHA-256 hash of the token
 */
export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate expiry timestamp for reset token
 * @returns Date object 1 hour in the future
 */
export const getResetTokenExpiry = (): Date => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
};
