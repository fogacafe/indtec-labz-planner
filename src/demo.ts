import type { PlannerState } from './domain'

export const demoState: PlannerState = {
  demands: [
    { id:'d1', responsible:'Ana', title:'Customer onboarding API', areas:['Platform','Business'], startDate:'2026-01-05', durationDays:18, requester:'Business', status:'dev', priority:'high', type:'IT', kind:'feature' },
    { id:'d2', responsible:'Ana', title:'Vacation', areas:['People'], startDate:'2026-02-09', durationDays:10, requester:'People', status:'todo', priority:'low', type:'Business', kind:'feature' },
    { id:'d3', responsible:'Bruno', title:'Pricing workflow', areas:['Trading','Risk'], startDate:'2026-01-19', durationDays:28, requester:'Trading', status:'refinement', priority:'high', type:'Business', kind:'feature' },
    { id:'d4', responsible:'Bruno', title:'Observability baseline', areas:['Platform'], startDate:'2026-03-02', durationDays:15, requester:'Engineering', status:'todo', priority:'medium', type:'IT', kind:'feature' },
    { id:'d5', responsible:'Carla', title:'Settlement automation', areas:['Operations'], startDate:'2026-02-16', durationDays:35, requester:'Operations', status:'backlog', priority:'high', type:'IT', kind:'fix' },
    { id:'d6', responsible:'Carla', title:'License', areas:['People'], startDate:'2026-04-06', durationDays:7, requester:'People', status:'todo', priority:'low', type:'Business', kind:'feature' },
  ],
}
