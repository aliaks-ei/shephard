import type { PostgrestError } from '@supabase/supabase-js'

export function isDuplicateNameError(error: PostgrestError, constraintName?: string): boolean {
  const isGenericDuplicateKey =
    error.code === '23505' ||
    error.message.includes('duplicate key value violates unique constraint')

  if (constraintName) {
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
    error.message.includes('unique_expense_name_per_plan_category') ||
    error.message.includes('name_per_user') ||
    Boolean(error.details?.includes('unique_template_name_per_user')) ||
    Boolean(error.details?.includes('unique_plan_name_per_user')) ||
    Boolean(error.details?.includes('unique_expense_category_name_per_user')) ||
    Boolean(error.details?.includes('unique_expense_name_per_plan_category')) ||
    Boolean(error.details?.includes('name_per_user'))

  return isGenericDuplicateKey && hasNameConstraint
}

export function createDuplicateNameError(
  entityType: 'TEMPLATE' | 'PLAN' | 'CATEGORY' | 'EXPENSE',
): Error {
  const errorName = `DUPLICATE_${entityType}_NAME`
  const error = new Error(errorName)
  error.name = errorName
  return error
}
