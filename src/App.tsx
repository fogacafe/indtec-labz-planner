import { useMemo, useState } from 'react'
import { Bug, Check, ChevronDown, ChevronUp, Download, Filter, GripVertical, RotateCcw, Sparkles, X } from 'lucide-react'
import type { Demand, DemandKind, DemandStatus, DemandType, PlannerState, Priority } from './domain'
import { endDateOf, kindLabels, priorityLabels, sprintCount, statusLabels } from './domain'
import { demoState } from './demo'
import { LocalStoragePlannerStorage } from './storage'
import './styles.css'
import './planner-refinement.css'

const storage = new LocalStoragePlannerStorage()
const year = 2026
const weekMs = 7 * 86_400_000
const yearStart = new Date(`${year}-01-01T12:00:00`)
const weeks = Array.from({ length: 53 }, (_, index) => index + 1)
const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const quarters = ['Q1','Q2','Q3','Q4']

function normalizeDemand(demand: Demand): Demand {
  return { ...demand, kind: demand.kind ?? 'feature' }
}
function initialState(): PlannerState {
  const value = storage.load() ?? structuredClone(demoState)
  return { demands: value.demands.map(normalizeDemand) }
}
function weekOf(date: string) { return Math.max(1, Math.min(53, Math.floor((new Date(`${date}T12:00:00`).getTime() - yearStart.getTime()) / weekMs) + 1)) }
function isLeave(title: string) { return /f[eé]rias|vacation|licen[cs]a|license/i.test(title) }
function classFor(value: string) { return value.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-') }

export default function App() {
  const [state,setState] = useState<PlannerState>(initialState)
  const [dragged,setDragged] = useState<string | null>(null)
  const [expandedId,setExpandedId] = useState<string | null>(null)
  const [draft,setDraft] = useState<Demand | null>(null)
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

  const openEditor = (demand: Demand) => {
    if (expandedId === demand.id) { setExpandedId(null); setDraft(null); return }
    setExpandedId(demand.id)
    setDraft(structuredClone(normalizeDemand(demand)))
  }
  const cancelEditor = () => { setExpandedId(null); setDraft(null) }
  const saveEditor = () => {
    if (!draft) return
    persist({ demands: state.demands.map(d=>d.id===draft.id?draft:d) })
    setExpandedId(null)
    setDraft(null)
  }
  const patchDraft = <K extends keyof Demand>(key:K,value:Demand[K]) => setDraft(current=>current?{...current,[key]:value}:current)

  const reset = () => { const next=structuredClone(demoState); storage.clear(); setState(next); cancelEditor() }
  const exportCsv = () => {
    const header=['Responsible','Kind','Title','Areas','Start','End','Days','Sprints','Requester','Status','Priority','Type']
    const rows=visible.map(d=>[d.responsible,kindLabels[d.kind ?? 'feature'],d.title,d.areas.join(' | '),d.startDate,endDateOf(d),d.durationDays,sprintCount(d),d.requester,statusLabels[d.status],priorityLabels[d.priority],d.type])
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
            const kind=d.kind ?? 'feature'
            const isExpanded=expandedId===d.id
            return <div className={`demand-item ${newOwner?'owner-start':''} ${isExpanded?'is-expanded':''}`} key={d.id}>
              <div className="demand-row" draggable onDragStart={()=>setDragged(d.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropOn(d.id)}>
                <div className="fixed-cells">
                  <div className="drag"><GripVertical size={14}/><input value={d.responsible} onChange={e=>update(d.id,'responsible',e.target.value)}/></div>
                  <div className="title-cell">
                    <span className={`kind-icon kind-${kind}`} title={kindLabels[kind]}>{kind==='fix'?<Bug size={13}/>:<Sparkles size={13}/>}</span>
                    <input className={leave?'leave-title':''} value={d.title} onChange={e=>update(d.id,'title',e.target.value)}/>
                    <button className="row-editor-trigger" onClick={()=>openEditor(d)} title="Edit details" aria-label={`Edit ${d.title}`}>{isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>
                  </div>
                  <input type="date" value={d.startDate} onChange={e=>update(d.id,'startDate',e.target.value)}/>
                  <input type="number" min={1} value={d.durationDays} onChange={e=>update(d.id,'durationDays',Math.max(1,Number(e.target.value)))}/>
                  <span className="calculated">{sprintCount(d)}</span>
                  <select className={`compact-select type-${classFor(d.type)}`} value={d.type} onChange={e=>update(d.id,'type',e.target.value as DemandType)}><option>IT</option><option>Business</option></select>
                </div>
                <div className="week-grid">{weeks.map(w=><div key={w} className="week-cell"/>)}<div className={`bar ${leave?'leave':`priority-${d.priority}`} status-${classFor(d.status)}`} style={{gridColumn:`${start} / span ${span}`}} title={`${d.title} · ${d.startDate} → ${endDateOf(d)}`}><span>{d.title}</span></div></div>
              </div>

              {isExpanded && draft?.id===d.id && <div className="inline-editor-shell">
                <div className="inline-editor">
                  <div className="editor-heading"><div><span className={`kind-icon kind-${draft.kind}`}>{draft.kind==='fix'?<Bug size={14}/>:<Sparkles size={14}/>}</span><strong>{draft.title}</strong></div><span>{draft.startDate} → {endDateOf(draft)}</span></div>
                  <div className="editor-fields">
                    <EditorSelect label="Kind" value={draft.kind} onChange={v=>patchDraft('kind',v as DemandKind)} options={Object.entries(kindLabels)}/>
                    <EditorSelect label="Status" value={draft.status} onChange={v=>patchDraft('status',v as DemandStatus)} options={Object.entries(statusLabels)}/>
                    <EditorSelect label="Priority" value={draft.priority} onChange={v=>patchDraft('priority',v as Priority)} options={Object.entries(priorityLabels)}/>
                    <label><span>Requester</span><input value={draft.requester} onChange={e=>patchDraft('requester',e.target.value)}/></label>
                    <label className="areas-field"><span>Areas</span><input value={draft.areas.join(', ')} onChange={e=>patchDraft('areas',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}/></label>
                  </div>
                  <div className="editor-actions"><button className="ghost" onClick={cancelEditor}><X size={14}/> Cancel</button><button className="save" onClick={saveEditor}><Check size={14}/> Save</button></div>
                </div>
                <div className="editor-timeline-fill" aria-hidden="true"/>
              </div>}
            </div>
          })}
        </div>
      </div>
    </main>
  </div>
}

function FilterSelect({label,value,values,onChange}:{label:string,value:string,values:string[],onChange:(value:string)=>void}) { return <label className="filter-control"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="all">All</option>{values.map(v=><option value={v} key={v}>{v}</option>)}</select></label> }
function EditorSelect({label,value,onChange,options}:{label:string,value:string,onChange:(value:string)=>void,options:[string,string][]}) { return <label><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label> }
