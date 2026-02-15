import { body, ValidationChain } from 'express-validator';
import { INDUSTRIES, TECH_SKILLS, SOFT_SKILLS, NETWORKING_INTENTIONS } from './validation.util';

// Validation rules for profile update
export const updateProfileValidation: ValidationChain[] = [
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  
  body('networking_intention')
    .optional()
    .isIn(NETWORKING_INTENTIONS)
    .withMessage('Invalid networking intention'),
  
  body('industry')
    .optional()
    .isIn(INDUSTRIES)
    .withMessage('Invalid industry'),
  
  body('tech_skills')
    .optional()
    .isArray({ min: 1, max: 3 })
    .withMessage('Must select 1-3 tech skills')
    .custom((skills) => {
      return skills.every((skill: string) => TECH_SKILLS.includes(skill));
    })
    .withMessage('Invalid tech skills selected'),
  
  body('soft_skills')
    .optional()
    .isArray({ min: 1, max: 3 })
    .withMessage('Must select 1-3 soft skills')
    .custom((skills) => {
      return skills.every((skill: string) => SOFT_SKILLS.includes(skill));
    })
    .withMessage('Invalid soft skills selected'),
  
  // Ensure at least one field is being updated
  body()
    .custom((value, { req }) => {
      const hasUpdate = req.body.display_name || 
                       req.body.networking_intention || 
                       req.body.industry || 
                       req.body.tech_skills || 
                       req.body.soft_skills;
      return hasUpdate;
    })
    .withMessage('At least one field must be provided for update')
];
