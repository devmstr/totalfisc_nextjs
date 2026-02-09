// src/lib/auth/password-policy.ts

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true,
  preventPasswordReuse: 3,
  expirationDays: null,
} as const;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong' | 'very_strong';
}

export function validatePassword(
  password: string,
  userInfo?: { email?: string; name?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`);
  } else {
    score += Math.min(2, Math.floor(password.length / 4));
  }
  
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Le mot de passe ne peut pas dépasser ${PASSWORD_POLICY.maxLength} caractères`);
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir une lettre majuscule');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir une lettre minuscule');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir un chiffre');
  } else if (/\d/.test(password)) {
    score += 1;
  }
  
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir un caractère spécial');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
  }
  
  // Prevent user info in password
  if (PASSWORD_POLICY.preventUserInfoInPassword && userInfo) {
    const lowerPassword = password.toLowerCase();
    
    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@')[0].split(/[._-]/);
      for (const part of emailParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('Le mot de passe ne doit pas contenir votre email');
          break;
        }
      }
    }
    
    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('Le mot de passe ne doit pas contenir votre nom');
          break;
        }
      }
    }
  }
  
  let strength: PasswordValidationResult['strength'];
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 6) strength = 'strong';
  else strength = 'very_strong';
  
  return { valid: errors.length === 0, errors, strength };
}
