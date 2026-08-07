export type ActionBarAction = {
  key: string
  icon: string
  label: string
  color: string
  loading?: boolean
  disabled?: boolean
  visible?: boolean
  priority?: 'primary' | 'secondary'
  handler: () => void | Promise<void>
}

export type PlanOption = {
  label: string
  value: string
  status: string
  startDate: string
  endDate: string
  currency: string
}
