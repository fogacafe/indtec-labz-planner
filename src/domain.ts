export type Priority = 'high' | 'medium' | 'low'
export type DemandType = 'IT' | 'Business'
export type DemandKind = 'feature' | 'fix'
export type DemandStatus = 'backlog' | 'refinement' | 'todo' | 'dev' | 'waiting-uat' | 'uat' | 'waiting-prod' | 'prod' | 'assisted-prod'

export type Demand = {
  id: string
  responsible: string
  title: string
  areas: string[]
  startDate: string
  durationDays: number
  requester: string
  status: DemandStatus
  priority: Priority
  type: DemandType
  kind: DemandKind
}

export type PlannerState = {
  demands: Demand[]
}

export const statusLabels: Record<DemandStatus, string> = {
  backlog: 'Backlog',
  refinement: 'Refinement',
  todo: 'To do',
  dev: 'Dev',
  'waiting-uat': 'Waiting UAT',
  uat: 'UAT',
  'waiting-prod': 'Waiting prod',
  prod: 'Prod',
  'assisted-prod': 'Assisted prod',
}

export const priorityLabels: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const kindLabels: Record<DemandKind, string> = {
  feature: 'Feature',
  fix: 'Fix',
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + Math.max(days - 1, 0))
  return value.toISOString().slice(0, 10)
}

export function daysBetween(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`).getTime()
  const b = new Date(`${end}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function endDateOf(demand: Demand) {
  return addDays(demand.startDate, demand.durationDays)
}

export function sprintCount(demand: Demand) {
  return Math.max(1, Math.ceil(demand.durationDays / 10))
}
