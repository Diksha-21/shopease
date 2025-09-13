import { body } from 'express-validator';

export const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Invalid phone number'),
  
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Company name must be at least 2 characters')
];
