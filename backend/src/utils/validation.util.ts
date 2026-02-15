import { body, ValidationChain } from 'express-validator';

// Predefined options
export const INDUSTRIES = [
  'Software / SaaS',
  'Finance',
  'Healthcare',
  'Education',
  'Government',
  'Gaming',
  'Hardware / IoT',
  'Consulting',
  'Other'
];

export const TECH_SKILLS = [
  'Backend (Node, Python, Java, etc.)',
  'Frontend (React, Vue, etc.)',
  'Data Engineering',
  'Data Science / ML',
  'DevOps / Cloud',
  'Mobile',
  'Security',
  'Product Analytics'
];

export const SOFT_SKILLS = [
  'Communication',
  'Leadership',
  'Mentoring',
  'Public Speaking',
  'Problem Solving',
  'Collaboration',
  'Initiative'
];

export const NETWORKING_INTENTIONS = [
  'Searching for a job',
  'Searching for a hire',
  'Just chat'
];

// Validation rules for registration
export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('display_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  
  body('networking_intention')
    .isIn(NETWORKING_INTENTIONS)
    .withMessage('Invalid networking intention'),
  
  body('industry')
    .isIn(INDUSTRIES)
    .withMessage('Invalid industry'),
  
  body('tech_skills')
    .isArray({ min: 1, max: 3 })
    .withMessage('Must select 1-3 tech skills')
    .custom((skills) => {
      return skills.every((skill: string) => TECH_SKILLS.includes(skill));
    })
    .withMessage('Invalid tech skills selected'),
  
  body('soft_skills')
    .isArray({ min: 1, max: 3 })
    .withMessage('Must select 1-3 soft skills')
    .custom((skills) => {
      return skills.every((skill: string) => SOFT_SKILLS.includes(skill));
    })
    .withMessage('Invalid soft skills selected')
];

// Validation rules for login
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for password reset request
export const requestPasswordResetValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

// Validation rules for password reset confirmation
export const resetPasswordValidation: ValidationChain[] = [
  body('token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format')
    .matches(/^[a-f0-9]{64}$/)
    .withMessage('Invalid reset token format'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];
