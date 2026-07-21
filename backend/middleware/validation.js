import { body, param, query, validationResult, oneOf } from 'express-validator'
import { ValidationError } from '../utils/errors.js'

export const validate = (req, _res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const list = errors
      .array()
      .map((e) => `${e.path || 'field'}: ${e.msg}`)
      .join('; ')
    return next(new ValidationError(list))
  }
  next()
}

export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters'),
]

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('avatar')
    .optional({ values: 'falsy' })
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Avatar must be a valid URL'),
  body('preferences.theme')
    .optional()
    .isIn(['dark', 'light'])
    .withMessage('Theme must be dark or light'),
  body('preferences.preferredLanguage')
    .optional()
    .isIn(['python', 'javascript', 'java', 'cpp', 'go', 'rust'])
    .withMessage('Unsupported language'),
]

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be 8-128 characters'),
]

export const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
]

export const resetPasswordValidation = [

  oneOf(
    [
      body('token').notEmpty().withMessage('Reset token is required'),
      query('token').notEmpty().withMessage('Reset token is required'),
    ],
    { message: 'Reset token is required' }
  ),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be 8-128 characters'),
]

export const verifyEmailValidation = [
  oneOf(
    [body('token').notEmpty().withMessage('Verification token is required'),
     query('token').notEmpty().withMessage('Verification token is required')],
    { message: 'Verification token is required' }
  ),
]

export const problemAnalysisValidation = [
  body('problemData.title').trim().notEmpty().withMessage('Problem title is required'),
  body('problemData.description')
    .trim()
    .notEmpty()
    .withMessage('Problem description is required'),
]

export const noteValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('content').isString().isLength({ min: 0, max: 50_000 }).withMessage('Content too long'),
  body('category')
    .optional()
    .isIn(['general', 'pattern', 'problem', 'interview', 'misc'])
    .withMessage('Invalid category'),
  body('tags').optional().isArray({ max: 25 }).withMessage('Too many tags'),
  body('tags.*').optional().isString().isLength({ max: 40 }),
  body('pinned').optional().isBoolean(),
]

export const noteUpdateValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().isString().isLength({ max: 50_000 }),
  body('category').optional().isIn(['general', 'pattern', 'problem', 'interview', 'misc']),
  body('tags').optional().isArray({ max: 25 }),
  body('pinned').optional().isBoolean(),
]

export const roadmapProgressValidation = [
  body('topicId').notEmpty().withMessage('Topic id is required'),
  body('completed').isBoolean().withMessage('Completed must be boolean'),
]

export const contestSubmitValidation = [
  body('problemId').notEmpty().withMessage('Problem id is required'),
  body('code').isString().isLength({ min: 1, max: 50_000 }),
  body('language').isIn(['python', 'javascript', 'java', 'cpp', 'go', 'rust']),
]

export const playgroundExecuteValidation = [
  body('language').isIn(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'c']),
  body('source').isString().isLength({ min: 1, max: 50_000 }),
  body('stdin').optional().isString().isLength({ max: 10_000 }),
]

export const submissionValidation = [
  body('problemId').notEmpty().withMessage('Problem id is required'),
  body('code').isString().isLength({ min: 1, max: 50_000 }),
  body('language').isIn(['python', 'javascript', 'java', 'cpp', 'go', 'rust']),
  body('runtime').optional().isInt({ min: 0, max: 600_000 }),
  body('memory').optional().isInt({ min: 0, max: 1_000_000 }),
  body('status')
    .optional()
    .isIn(['accepted', 'wrong_answer', 'time_limit', 'runtime_error', 'compile_error']),
]

export const flashcardCreateValidation = [
  body('front').trim().isLength({ min: 1, max: 500 }),
  body('back').trim().isLength({ min: 1, max: 2000 }),
  body('category').optional().isString().isLength({ max: 50 }),
  body('tags').optional().isArray({ max: 20 }),
]

export const flashcardReviewValidation = [
  body('cardId').notEmpty().withMessage('Card id is required'),
  body('quality').isInt({ min: 0, max: 5 }).withMessage('Quality must be 0-5'),
]

export const interviewAnswerValidation = [
  body('questionIndex').isInt({ min: 0 }),
  body('answer').isString().isLength({ min: 0, max: 50_000 }),
  body('timeSpentSec').optional().isInt({ min: 0, max: 60 * 60 }),
]

export const paginationValidation = [
  query('page').optional().isInt({ min: 1, max: 10_000 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const objectIdValidation = (name) => [
  param(name).isMongoId().withMessage(`Invalid ${name}`),
]
