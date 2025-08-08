import { describe, it, expect } from 'vitest'
import { isDuplicateNameError, createDuplicateNameError } from './database'

describe('database utilities', () => {
  describe('isDuplicateNameError', () => {
    describe('with generic duplicate key errors', () => {
      it('should return false for code 23505 without name constraint pattern', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: 'Key (name, user_id)=(Test, 123) already exists.',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(false) // No name constraint pattern
      })

      it('should return false for duplicate key message without name constraint pattern', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: '',
          hint: '',
          code: '42000',
          name: 'other',
        }
        expect(isDuplicateNameError(error)).toBe(false) // No name constraint pattern
      })
    })

    describe('with name constraint patterns in message', () => {
      it('should return true for unique_template_name_per_user constraint', () => {
        const error = {
          message: 'duplicate key value violates unique constraint "unique_template_name_per_user"',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should return true for unique_plan_name_per_user constraint', () => {
        const error = {
          message: 'duplicate key value violates unique constraint "unique_plan_name_per_user"',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should return true for unique_expense_category_name_per_user constraint', () => {
        const error = {
          message:
            'duplicate key value violates unique constraint "unique_expense_category_name_per_user"',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should return true for generic name_per_user constraint', () => {
        const error = {
          message: 'duplicate key value violates unique constraint containing name_per_user',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })
    })

    describe('with name constraint patterns in details', () => {
      it('should return true for unique_template_name_per_user in details', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: 'Key constraint unique_template_name_per_user violated',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should return true for unique_plan_name_per_user in details', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: 'Key constraint unique_plan_name_per_user violated',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should return true for unique_expense_category_name_per_user in details', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: 'Key constraint unique_expense_category_name_per_user violated',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })
    })

    describe('with specific constraint names', () => {
      it('should return true when constraint name matches in message', () => {
        const error = {
          message: 'duplicate key value violates unique constraint "custom_constraint"',
          details: '',
          hint: '',
          code: '42000',
          name: 'other',
        }
        expect(isDuplicateNameError(error, 'custom_constraint')).toBe(true)
      })

      it('should return true when constraint name matches in details', () => {
        const error = {
          message: 'some error message',
          details: 'Key constraint custom_constraint violated',
          hint: '',
          code: '42000',
          name: 'other',
        }
        expect(isDuplicateNameError(error, 'custom_constraint')).toBe(true)
      })

      it('should return true for generic duplicate key even without constraint name match', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error, 'non_matching_constraint')).toBe(true)
      })

      it('should return false when constraint name does not match and no generic duplicate', () => {
        const error = {
          message: 'some other error',
          details: 'different constraint violated',
          hint: '',
          code: '42000',
          name: 'other',
        }
        expect(isDuplicateNameError(error, 'non_matching_constraint')).toBe(false)
      })
    })

    describe('with non-duplicate errors', () => {
      it('should return false for unrelated database errors', () => {
        const error = {
          message: 'column does not exist',
          details: '',
          hint: '',
          code: '42703',
          name: 'other',
        }
        expect(isDuplicateNameError(error)).toBe(false)
      })

      it('should return false for permission errors', () => {
        const error = {
          message: 'permission denied for table',
          details: '',
          hint: '',
          code: '42501',
          name: 'other',
        }
        expect(isDuplicateNameError(error)).toBe(false)
      })

      it('should return false for constraint violations without name patterns', () => {
        const error = {
          message: 'duplicate key value violates unique constraint "other_constraint"',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(false)
      })
    })

    describe('with edge cases', () => {
      it('should handle undefined constraint name', () => {
        const error = {
          message: 'duplicate key value violates unique constraint "unique_template_name_per_user"',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error, undefined)).toBe(true)
      })

      it('should handle null details', () => {
        const error = {
          message: 'duplicate key value violates unique constraint "unique_plan_name_per_user"',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should handle empty message', () => {
        const error = {
          message: '',
          details: 'unique_expense_category_name_per_user',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error)).toBe(true)
      })

      it('should handle empty constraint name', () => {
        const error = {
          message: 'duplicate key value violates unique constraint',
          details: '',
          hint: '',
          code: '23505',
          name: 'duplicate_key_error',
        }
        expect(isDuplicateNameError(error, '')).toBe(false)
      })
    })
  })

  describe('createDuplicateNameError', () => {
    it('should create error for TEMPLATE entity type', () => {
      const error = createDuplicateNameError('TEMPLATE')
      expect(error.message).toBe('DUPLICATE_TEMPLATE_NAME')
      expect(error.name).toBe('DUPLICATE_TEMPLATE_NAME')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create error for PLAN entity type', () => {
      const error = createDuplicateNameError('PLAN')
      expect(error.message).toBe('DUPLICATE_PLAN_NAME')
      expect(error.name).toBe('DUPLICATE_PLAN_NAME')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create error for CATEGORY entity type', () => {
      const error = createDuplicateNameError('CATEGORY')
      expect(error.message).toBe('DUPLICATE_CATEGORY_NAME')
      expect(error.name).toBe('DUPLICATE_CATEGORY_NAME')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create unique error instances', () => {
      const error1 = createDuplicateNameError('TEMPLATE')
      const error2 = createDuplicateNameError('TEMPLATE')
      expect(error1).not.toBe(error2)
      expect(error1.message).toBe(error2.message)
    })
  })

  describe('integration scenarios', () => {
    it('should work together for template duplicate detection', () => {
      const postgrestError = {
        message: 'duplicate key value violates unique constraint "unique_template_name_per_user"',
        details: 'Key (name, user_id)=(Shopping List, user123) already exists.',
        hint: '',
        code: '23505',
        name: 'duplicate_key_error',
      }

      const isDuplicate = isDuplicateNameError(postgrestError)
      expect(isDuplicate).toBe(true)

      const standardError = createDuplicateNameError('TEMPLATE')
      expect(standardError.name).toBe('DUPLICATE_TEMPLATE_NAME')
    })

    it('should work together for plan duplicate detection', () => {
      const postgrestError = {
        message: 'some error',
        details: 'unique_plan_name_per_user constraint violated',
        hint: '',
        code: '23505',
        name: 'duplicate_key_error',
      }

      const isDuplicate = isDuplicateNameError(postgrestError)
      expect(isDuplicate).toBe(true)

      const standardError = createDuplicateNameError('PLAN')
      expect(standardError.name).toBe('DUPLICATE_PLAN_NAME')
    })

    it('should work together for category duplicate detection', () => {
      const postgrestError = {
        message: 'duplicate key value violates unique constraint containing name_per_user',
        details: '',
        hint: '',
        code: '23505',
        name: 'duplicate_key_error',
      }

      const isDuplicate = isDuplicateNameError(postgrestError)
      expect(isDuplicate).toBe(true)

      const standardError = createDuplicateNameError('CATEGORY')
      expect(standardError.name).toBe('DUPLICATE_CATEGORY_NAME')
    })
  })
})
