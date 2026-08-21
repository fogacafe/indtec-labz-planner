import type { PlannerState } from './domain'

export interface PlannerStorage {
  load(): PlannerState | null
  save(state: PlannerState): void
  clear(): void
}

const key = 'indtec.labz.planner.v1'

export class LocalStoragePlannerStorage implements PlannerStorage {
  load() {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try { return JSON.parse(raw) as PlannerState } catch { return null }
  }

  save(state: PlannerState) {
    localStorage.setItem(key, JSON.stringify(state))
  }

  clear() {
    localStorage.removeItem(key)
  }
}
