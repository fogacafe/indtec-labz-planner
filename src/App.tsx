import { useMemo, useState } from 'react'
import { Download, Filter, GripVertical, RotateCcw } from 'lucide-react'
import type { Demand, DemandStatus, DemandType, PlannerState, Priority } from './domain'
import { daysBetween, endDateOf, priorityLabels, sprintCount, statusLabels } from './domain'
import { demoState } from './demo'
import { LocalStoragePlannerStorage } from './storage'
import './styles.css'

const storage = new LocalStoragePlannerStorage()
const year = 2026
const weekMs = 7 * 86_400_000
const yearStart = new Date(`${year}-01-01T12:00:00`)
const weeks = Array.from({ length: 53 }, (_, index) => index + 1)
const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const quarters = ['Q1','Q2','Q3','Q4']

function initialState(): PlannerState { return storage.load() ?? structuredClone(demoState) }
function weekOf(date: string) { return Math.max(1, Math.min(53, Math.floor((new Date(`${date}T12:00:00`).getTime() - yearStart.getTime()) / weekMs) + 1)) }
function isLeave(title: string) { return /f[eé]rias|vacation|licen[cs]a|license/i.test(title) }
function classFor(value: string) { return value.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-') }

export default function App() {
  const [state,setState] = useState<PlannerState>(initialState)
  const [dragged,setDragged] = useState<string | null>(null)
  const [filters,setFilters] = useState({ responsible:'all', priority:'all', type:'all', area:'all' })

  const persist = (next: PlannerState) => { setState(next); storage.save(next) }
  const update = <K extends keyof Demand>(id:string,key:K,value:Demand[K]) => persist({ demands: state.demands.map(d=>d.id===id?{...d,[key]:value}:d) })

  const responsibleOptions = [...new Set(state.demands.map(d=>d.responsible))].sort()
  const areaOptions = [...new Set(state.demands.flatMap(d=>d.areas))].sort()
  const visible = useMemo(() => state.demands.filter(d =>
    (filters.responsible==='all'||d.responsible===filters.responsible) &&
    (filters.priority==='all'||d.priority===filters.priority) &&
    (filters.type==='all'||d.type===filters.type) &&
    (filters.area==='all'||d.areas.includes(filters.area))
  ).sort((a,b)=>a.responsible.localeCompare(b.responsible)||a.startDate.localeCompare(b.startDate)),[state,filters])

  const dropOn = (targetId:string) => {
    if (!dragged || dragged===targetId) return
    const source = state.demands.find(d=>d.id===dragged); const target = state.demands.find(d=>d.id===targetId)
    if (!source || !target) return
    persist({demands:state.demands.map(d=>d.id===source.id?{...d,startDate:target.startDate,responsible:target.responsible}:d.id===target.id?{...d,startDate:source.startDate,responsible:source.responsible}:d)})
    setDragged(null)
  }

  const reset = () => { const next=structuredClone(demoState); storage.clear(); setState(next) }
  const exportCsv = () => {
    const header=['Responsible','Title','Areas','Start','End','Days','Sprints','Requester','Status','Priority','Type']
    const rows=visible.map(d=>[d.responsible,d.title,d.areas.join(' | '),d.startDate,endDateOf(d),d.durationDays,sprintCount(d),d.requester,statusLabels[d.status],priorityLabels[d.priority],d.type])
    const csv=[header,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`indtec-planner-${year}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return <div className="app-shell">
    <header className="topbar">
      <div><p className="eyebrow">INDTEC / LABZ 003</p><h1>Planner <span>/ annual delivery map</span></h1></div>
      <div className="top-actions"><button onClick={reset}><RotateCcw size={15}/> Reset demo</button><button className="primary" onClick={exportCsv}><Download size={15}/> Export</button></div>
    </header>

    <section className="summary-strip">
      <span><b>{visible.length}</b> DEMANDS</span><span><b>{new Set(visible.map(d=>d.responsible)).size}</b> PEOPLE</span><span><b>{visible.filter(d=>d.priority==='high').length}</b> HIGH PRIORITY</span><span className="storage-state">● LOCAL / PERSISTED</span>
    </section>

    <section className="filters"><div className="filter-title"><Filter size={15}/><span>FILTER MATRIX</span></div>
      <FilterSelect label="Responsible" value={filters.responsible} values={responsibleOptions} onChange={v=>setFilters(f=>({...f,responsible:v}))}/>
      <FilterSelect label="Priority" value={filters.priority} values={['high','medium','low']} onChange={v=>setFilters(f=>({...f,priority:v}))}/>
      <FilterSelect label="Type" value={filters.type} values={['IT','Business']} onChange={v=>setFilters(f=>({...f,type:v}))}/>
      <FilterSelect label="Area" value={filters.area} values={areaOptions} onChange={v=>setFilters(f=>({...f,area:v}))}/>
    </section>

    <main className="planner-frame">
      <div className="timeline-scroll">
        <div className="quarter-row timeline-header"><div className="fixed-head">DELIVERY / {year}</div>{quarters.map(q=><div key={q} className="quarter">{q}</div>)}</div>
        <div className="month-row timeline-header"><div className="fixed-head muted">OWNER / DEMAND</div>{months.map(m=><div key={m} className="month">{m}</div>)}</div>
        <div className="week-row timeline-header"><div className="fixed-head column-labels"><span>OWNER</span><span>TITLE</span><span>START</span><span>DAYS</span><span>SPR</span><span>TYPE</span></div>{weeks.map(w=><div key={w} className="week-number">{String(w).padStart(2,'0')}</div>)}</div>

        <div className="rows">
          {visible.map((d,index)=>{
            const start=weekOf(d.startDate); const end=weekOf(endDateOf(d)); const span=Math.max(1,end-start+1); const leave=isLeave(d.title)
            const newOwner=index===0||visible[index-1]?.responsible!==d.responsible
            return <div className={`demand-row ${newOwner?'owner-start':''}`} key={d.id} draggable onDragStart={()=>setDragged(d.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropOn(d.id)}>
              <div className="fixed-cells">
                <div className="drag"><GripVertical size={14}/><input value={d.responsible} onChange={e=>update(d.id,'responsible',e.target.value)}/></div>
                <input className={leave?'leave-title':''} value={d.title} onChange={e=>update(d.id,'title',e.target.value)}/>
                <input type="date" value={d.startDate} onChange={e=>update(d.id,'startDate',e.target.value)}/>
                <input type="number" min={1} value={d.durationDays} onChange={e=>update(d.id,'durationDays',Math.max(1,Number(e.target.value)))}/>
                <span className="calculated">{sprintCount(d)}</span>
                <select className={`type-${classFor(d.type)}`} value={d.type} onChange={e=>update(d.id,'type',e.target.value as DemandType)}><option>IT</option><option>Business</option></select>
              </div>
              <div className="week-grid">{weeks.map(w=><div key={w} className="week-cell"/>)}<div className={`bar ${leave?'leave':`priority-${d.priority}`} status-${classFor(d.status)}`} style={{gridColumn:`${start} / span ${span}`}} title={`${d.title} · ${d.startDate} → ${endDateOf(d)}`}><span>{d.title}</span></div></div>
            </div>
          })}
        </div>
      </div>
    </main>

    <section className="detail-grid">
      {visible.map(d=><article key={d.id} className="detail-card"><div className="detail-heading"><span className={`priority-dot ${d.priority}`}/><input value={d.title} onChange={e=>update(d.id,'title',e.target.value)}/></div><div className="detail-fields">
        <label>STATUS<select value={d.status} onChange={e=>update(d.id,'status',e.target.value as DemandStatus)}>{Object.entries(statusLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
        <label>PRIORITY<select value={d.priority} onChange={e=>update(d.id,'priority',e.target.value as Priority)}>{Object.entries(priorityLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
        <label>REQUESTER<input value={d.requester} onChange={e=>update(d.id,'requester',e.target.value)}/></label>
        <label>AREAS<input value={d.areas.join(', ')} onChange={e=>update(d.id,'areas',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}/></label>
      </div><footer>{d.startDate} → {endDateOf(d)} · {daysBetween(d.startDate,endDateOf(d))+1} DAYS</footer></article>)}
    </section>
  </div>
}

function FilterSelect({label,value,values,onChange}:{label:string,value:string,values:string[],onChange:(value:string)=>void}) { return <label className="filter-control"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="all">All</option>{values.map(v=><option value={v} key={v}>{v}</option>)}</select></label> }
