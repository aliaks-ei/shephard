import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Check if a PostgrestError is a duplicate name constraint violation
 */
export function isDuplicateNameError(error: PostgrestError, constraintName?: string): boolean {
  const isGenericDuplicateKey =
    error.code === '23505' ||
    error.message.includes('duplicate key value violates unique constraint')

  if (constraintName) {
    // If we have a specific constraint name, check if it's mentioned in the error
    // OR if we have a generic duplicate key error
    return (
      error.message.includes(constraintName) ||
      Boolean(error.details?.includes(constraintName)) ||
      isGenericDuplicateKey
    )
  }

  const hasNameConstraint =
    error.message.includes('unique_template_name_per_user') ||
    error.message.includes('unique_plan_name_per_user') ||
    error.message.includes('unique_expense_category_name_per_user') ||
    error.message.includes('name_per_user') ||
    Boolean(error.details?.includes('unique_template_name_per_user')) ||
    Boolean(error.details?.includes('unique_plan_name_per_user')) ||
    Boolean(error.details?.includes('unique_expense_category_name_per_user')) ||
    Boolean(error.details?.includes('name_per_user'))

  return isGenericDuplicateKey && hasNameConstraint
}

/**
 * Create a standardized duplicate name error
 */
export function createDuplicateNameError(entityType: 'TEMPLATE' | 'PLAN' | 'CATEGORY'): Error {
  const errorName = `DUPLICATE_${entityType}_NAME`
  const error = new Error(errorName)
  error.name = errorName
  return error
}
