import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import './MomentumPage.css';

const COLORS = ['#2dd4a0','#4da6f5','#a78bfa','#f5a623','#f56565','#68d391','#f472b6','#fb923c','#60a5fa','#34d399','#fbbf24'];
const AV_MAP = {
  PV:{bg:'#0d2e22',fg:'#2dd4a0'},
  JL:{bg:'#0d2040',fg:'#4da6f5'},
  KP:{bg:'#2e1e05',fg:'#f5a623'},
  KF:{bg:'#2e0f0f',fg:'#f56565'}
};
const COLS = [
  {id:'backlog',label:'Backlog',c:'#636b77'},
  {id:'todo',label:'To Do',c:'#4da6f5'},
  {id:'inprogress',label:'In Progress',c:'#2dd4a0'},
  {id:'review',label:'Review',c:'#a78bfa'},
  {id:'done',label:'Done',c:'#68d391'},
];
const BARC = {backlog:'#636b77',todo:'#4da6f5',inprogress:'#2dd4a0',review:'#a78bfa',done:'#3a4049'};
const ASSIGNEES = ['PV','JL','KP','KF'];
const ASSIGNEE_NAMES = {PV:'Pranav V.',JL:'Justin L.',KP:'KP',KF:'Kevin F.'};

const INIT_PROJECTS = [
  {id:'p1',name:'Workday Pipeline',color:'#2dd4a0',desc:''},
  {id:'p2',name:'ReactHealth ETL',color:'#4da6f5',desc:''},
  {id:'p3',name:'Lavina CT Build',color:'#a78bfa',desc:''},
  {id:'p4',name:'FieldBoard App',color:'#f5a623',desc:''},
];

const INIT_TASKS = [
  {id:'t1',title:'Supplier Invoice Extract fix',project:'p1',status:'done',priority:'high',type:'feature',assignee:'PV',progress:100,start:'2026-02-01',end:'2026-02-14'},
  {id:'t2',title:'Expense Report Lines HCP tags',project:'p1',status:'done',priority:'high',type:'bug',assignee:'PV',progress:100,start:'2026-02-10',end:'2026-02-20'},
  {id:'t3',title:'Payment & Settlement pipeline',project:'p1',status:'inprogress',priority:'high',type:'feature',assignee:'KF',progress:65,start:'2026-03-01',end:'2026-04-15'},
  {id:'t4',title:'XML tag namespace mapping',project:'p1',status:'inprogress',priority:'med',type:'infra',assignee:'PV',progress:40,start:'2026-03-10',end:'2026-04-05'},
  {id:'t5',title:'Kevin validation sign-off',project:'p1',status:'review',priority:'high',type:'feature',assignee:'KF',progress:80,start:'2026-04-01',end:'2026-04-10'},
  {id:'t6',title:'Snowflake Openflow setup',project:'p1',status:'todo',priority:'med',type:'infra',assignee:'PV',progress:0,start:'2026-04-15',end:'2026-05-10'},
  {id:'t7',title:'Incremental patient usage loader',project:'p2',status:'done',priority:'high',type:'feature',assignee:'PV',progress:100,start:'2026-01-05',end:'2026-02-01'},
  {id:'t8',title:'MERGE logic & deduplication',project:'p2',status:'done',priority:'high',type:'feature',assignee:'JL',progress:100,start:'2026-01-20',end:'2026-02-10'},
  {id:'t9',title:'PATIENT_DETAILS VARIANT cols',project:'p2',status:'inprogress',priority:'med',type:'feature',assignee:'JL',progress:55,start:'2026-03-05',end:'2026-04-20'},
  {id:'t10',title:'Compliance-met pipeline',project:'p2',status:'review',priority:'high',type:'feature',assignee:'KF',progress:75,start:'2026-03-15',end:'2026-04-08'},
  {id:'t11',title:'Snowflake task scheduling',project:'p2',status:'todo',priority:'med',type:'infra',assignee:'PV',progress:0,start:'2026-04-20',end:'2026-05-05'},
  {id:'t12',title:'Foundation pour',project:'p3',status:'done',priority:'high',type:'feature',assignee:'PV',progress:100,start:'2026-02-01',end:'2026-02-28'},
  {id:'t13',title:'Framing & rough-in',project:'p3',status:'inprogress',priority:'high',type:'feature',assignee:'PV',progress:70,start:'2026-03-01',end:'2026-04-30'},
  {id:'t14',title:'Pool excavation',project:'p3',status:'todo',priority:'med',type:'feature',assignee:'KP',progress:0,start:'2026-04-15',end:'2026-05-31'},
  {id:'t15',title:'Electrical & plumbing',project:'p3',status:'todo',priority:'high',type:'infra',assignee:'JL',progress:0,start:'2026-05-01',end:'2026-06-15'},
  {id:'t16',title:'FieldBoard Kanban view',project:'p4',status:'done',priority:'high',type:'feature',assignee:'PV',progress:100,start:'2026-02-15',end:'2026-03-05'},
  {id:'t17',title:'FieldBoard Gantt chart',project:'p4',status:'done',priority:'high',type:'feature',assignee:'PV',progress:100,start:'2026-03-01',end:'2026-03-20'},
  {id:'t18',title:'ClickUp SDLC migration',project:'p4',status:'inprogress',priority:'med',type:'infra',assignee:'KP',progress:45,start:'2026-03-20',end:'2026-04-15'},
  {id:'t19',title:'PMP certification study',project:'p4',status:'backlog',priority:'low',type:'design',assignee:'PV',progress:20,start:'2026-04-01',end:'2026-06-30'},
];

const uid = () => '_' + Math.random().toString(36).slice(2,9);
const TODAY = new Date();

function Av({code, size=18}) {
  const av = AV_MAP[code];
  if (!av) return <div style={{width:size,flexShrink:0}}/>;
  const fs = size <= 18 ? 8 : size <= 26 ? 10 : 12;
  return (
    <div className="av" style={{width:size,height:size,fontSize:fs,background:av.bg,color:av.fg}}>
      {code}
    </div>
  );
}

function KanbanCard({task, projects, isDragging, onDragStart, onDragEnd, onClick}) {
  const proj = projects.find(p => p.id === task.project);
  const cc = proj ? proj.color : '#636b77';
  const od = task.end && new Date(task.end) < TODAY && task.status !== 'done';
  const priLabel = task.priority === 'med' ? 'Medium' : task.priority === 'high' ? 'High' : 'Low';
  const typeLabel = task.type.charAt(0).toUpperCase() + task.type.slice(1);
  return (
    <div
      className={`kcard${isDragging ? ' drag' : ''}`}
      style={{'--cc': cc, ...(od ? {borderColor:'var(--red)'} : {})}}
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
    >
      <div className="kcard-ttl">{task.title}</div>
      <div className="kcard-ft">
        <span className={`tag t-${task.priority}`}>{priLabel}</span>
        <span className={`tag t-${task.type}`}>{typeLabel}</span>
        {AV_MAP[task.assignee] && <div style={{marginLeft:'auto'}}><Av code={task.assignee}/></div>}
      </div>
      {task.progress > 0 && task.progress < 100 && (
        <div style={{marginTop:7,background:'var(--bg5)',borderRadius:2,height:2.5}}>
          <div style={{width:`${task.progress}%`,height:'100%',background:cc,borderRadius:2}}/>
        </div>
      )}
    </div>
  );
}

function KanbanView({tasks, projects, onMoveTask, onOpenTask, onOpenTaskInCol, onNewProj}) {
  const [dragId, setDragId] = useState(null);
  const [dropOver, setDropOver] = useState(null);

  const onDragStart = (e, tid) => { setDragId(tid); e.dataTransfer.effectAllowed='move'; };
  const onDragEnd = () => { setDragId(null); setDropOver(null); };
  const onDragOver = (e, col) => { e.preventDefault(); setDropOver(col); };
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropOver(null); };
  const onDrop = (e, col) => {
    e.preventDefault(); setDropOver(null);
    if (dragId) { onMoveTask(dragId, col); setDragId(null); }
  };

  return (
    <div className="view act" id="kb-view">
      {COLS.map(col => {
        const cards = tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            className={`kb-col${dropOver === col.id ? ' drop-over' : ''}`}
            onDragOver={e => onDragOver(e, col.id)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, col.id)}
          >
            <div className="kb-col-hd">
              <div className="kb-col-ttl">
                <svg width="7" height="7" viewBox="0 0 7 7"><circle cx="3.5" cy="3.5" r="3.5" fill={col.c}/></svg>
                {col.label}
              </div>
              <span className="kb-cnt">{cards.length}</span>
            </div>
            <div className="kb-cards">
              {cards.map(t => (
                <KanbanCard
                  key={t.id}
                  task={t}
                  projects={projects}
                  isDragging={dragId === t.id}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onClick={onOpenTask}
                />
              ))}
            </div>
            <button className="kb-add" onClick={() => onOpenTaskInCol(col.id)}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 1v8M1 5h8"/></svg>
              Add task
            </button>
          </div>
        );
      })}
      <div className="kb-newcol" onClick={onNewProj}><span>+ New project</span></div>
    </div>
  );
}

function GanttView({tasks, projects, zoom, setZoom, gtOpen, toggleGt, onOpenTask}) {
  let minD = new Date(TODAY.getFullYear(), TODAY.getMonth()-1, 1);
  let maxD = new Date(TODAY.getFullYear(), TODAY.getMonth()+5, 1);
  tasks.forEach(t => {
    if (t.start && new Date(t.start) < minD) minD = new Date(t.start);
    if (t.end && new Date(t.end) > maxD) maxD = new Date(t.end);
  });
  maxD = new Date(maxD.getFullYear(), maxD.getMonth()+1, 1);

  const months = [];
  let d = new Date(minD.getFullYear(), minD.getMonth(), 1);
  while (d <= maxD) { months.push(new Date(d)); d = new Date(d.getFullYear(), d.getMonth()+1, 1); }

  const span = maxD - minD;
  const pct = dt => Math.max(0, Math.min(100, (new Date(dt) - minD) / span * 100));
  const tp = pct(TODAY);

  const visProjs = projects.filter(p => tasks.some(t => t.project === p.id));

  return (
    <div className="view act" id="gt-view">
      <div className="gt-bar-row">
        <span style={{fontSize:12,color:'var(--text2)'}}>Zoom</span>
        <div className="zoom-grp">
          {['weeks','months','quarters'].map(z => (
            <button key={z} className={`zbtn${zoom===z?' act':''}`} onClick={() => setZoom(z)}>
              {z.charAt(0).toUpperCase()+z.slice(1)}
            </button>
          ))}
        </div>
        <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>
          Today: <span style={{color:'var(--text2)'}}>{TODAY.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
        </span>
      </div>
      <div className="gt-scroll">
        <div className="gt-grid">
          <div className="gt-thead">
            <div className="gt-lc">Task</div>
            <div className="gt-months">{months.map((m,i) => <div key={i} className="gt-month">{m.toLocaleDateString('en-US',{month:'short',year:'2-digit'})}</div>)}</div>
          </div>
          {visProjs.map((proj, pi) => {
            const pt = tasks.filter(t => t.project === proj.id);
            const open = gtOpen[proj.id] !== false;
            return (
              <Fragment key={proj.id}>
                <div className="gt-row grp" style={{animationDelay:`${pi*.03}s`}}>
                  <div className="gt-info">
                    <span className="gt-toggle" onClick={() => toggleGt(proj.id)}>{open?'▾':'▸'}</span>
                    <span className="sb-dot" style={{background:proj.color}}/>
                    <span className="gt-grp-name">{proj.name}</span>
                  </div>
                  <div className="gt-tl"><div className="gt-today" style={{left:`${tp}%`}}/></div>
                </div>
                {open && pt.map((t, ti) => {
                  const sl = t.start ? pct(t.start) : 5;
                  const el = t.end ? pct(t.end) : sl+12;
                  const bw = Math.max(el-sl, 1.5);
                  const c = BARC[t.status] || '#4da6f5';
                  return (
                    <div key={t.id} className="gt-row" style={{animationDelay:`${(pi*5+ti)*.025}s`}} onClick={() => onOpenTask(t.id)}>
                      <div className="gt-info gt-ind">
                        <Av code={t.assignee}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="gt-tname">{t.title}</div>
                          <div className="gt-tsub">{t.progress}% · {t.status}</div>
                        </div>
                      </div>
                      <div className="gt-tl">
                        <div className="gt-today" style={{left:`${tp}%`}}/>
                        <div className="gt-bar" style={{left:`${sl}%`,width:`${bw}%`,background:c,opacity:t.status==='done'?.45:1}}>
                          <div className="gt-bar-prog" style={{width:`${t.progress}%`}}/>
                          <span className="gt-bar-txt">{t.title}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskModal({modal, projects, onSave, onDelete, onClose}) {
  const isEdit = !!modal?.task;
  const defStart = new Date().toISOString().slice(0,10);
  const defEnd = (() => { const d=new Date(); d.setDate(d.getDate()+14); return d.toISOString().slice(0,10); })();
  const [form, setForm] = useState(() => isEdit ? {
    title:modal.task.title, project:modal.task.project, status:modal.task.status,
    priority:modal.task.priority, type:modal.task.type, assignee:modal.task.assignee||'',
    progress:modal.task.progress||0, start:modal.task.start||defStart, end:modal.task.end||defEnd,
  } : {
    title:'', project:modal?.defProj||(projects[0]?.id||''), status:modal?.defStatus||'todo',
    priority:'med', type:'feature', assignee:'', progress:0, start:defStart, end:defEnd,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSave = () => { if (!form.title.trim()) return; onSave(form, isEdit ? modal.task.id : null); };
  return (
    <div className="overlay open" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhd">
          <div className="mttl">{isEdit?'Edit Task':'Add Task'}</div>
          <button className="mx" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <div className="fg">
            <label className="fl">Task name</label>
            <input className="fi" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="What needs to be done?" autoFocus/>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Project</label>
              <select className="fi" value={form.project} onChange={e=>set('project',e.target.value)}>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Status</label>
              <select className="fi" value={form.status} onChange={e=>set('status',e.target.value)}>
                {COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Priority</label>
              <select className="fi" value={form.priority} onChange={e=>set('priority',e.target.value)}>
                <option value="low">Low</option><option value="med">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div className="fg"><label className="fl">Type</label>
              <select className="fi" value={form.type} onChange={e=>set('type',e.target.value)}>
                <option value="feature">Feature</option><option value="bug">Bug</option>
                <option value="design">Design</option><option value="infra">Infra</option>
              </select>
            </div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Assignee</label>
              <select className="fi" value={form.assignee} onChange={e=>set('assignee',e.target.value)}>
                <option value="">Unassigned</option>
                {ASSIGNEES.map(a=><option key={a} value={a}>{ASSIGNEE_NAMES[a]}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Progress %</label>
              <input className="fi" type="number" min="0" max="100" value={form.progress} onChange={e=>set('progress',parseInt(e.target.value)||0)}/>
            </div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Start date</label>
              <input className="fi" type="date" value={form.start} onChange={e=>set('start',e.target.value)}/>
            </div>
            <div className="fg"><label className="fl">End date</label>
              <input className="fi" type="date" value={form.end} onChange={e=>set('end',e.target.value)}/>
            </div>
          </div>
          <div className="fact">
            {isEdit && <button className="btn danger" style={{marginRight:'auto'}} onClick={()=>onDelete(modal.task.id,modal.task.title)}>Delete task</button>}
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn pri" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjModal({proj, tasks, onSave, onDelete, onClose}) {
  const [name, setName] = useState(proj.name);
  const [desc, setDesc] = useState(proj.desc||'');
  const [color, setColor] = useState(proj.color);
  const pt = tasks.filter(t=>t.project===proj.id);
  const done = pt.filter(t=>t.status==='done').length;
  const active = pt.filter(t=>t.status==='inprogress').length;
  return (
    <div className="overlay open" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal sm">
        <div className="mhd">
          <div className="mttl">{proj.name}</div>
          <button className="mx" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <div className="fg"><label className="fl">Name</label>
            <input className="fi" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
          </div>
          <div className="fg"><label className="fl">Color</label>
            <div className="swatches">
              {COLORS.map(c=><div key={c} className={`sw${color===c?' sel':''}`} style={{background:c}} onClick={()=>setColor(c)}/>)}
            </div>
          </div>
          <div className="fg"><label className="fl">Description</label>
            <input className="fi" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional description"/>
          </div>
          <div className="fg"><label className="fl">Overview</label>
            <div className="pst-grid">
              <div className="pst"><div className="pst-n">{pt.length}</div><div className="pst-l">Total</div></div>
              <div className="pst"><div className="pst-n" style={{color:'var(--accent)'}}>{done}</div><div className="pst-l">Done</div></div>
              <div className="pst"><div className="pst-n" style={{color:'var(--blue)'}}>{active}</div><div className="pst-l">Active</div></div>
            </div>
          </div>
          <div className="fact">
            <button className="btn danger" style={{marginRight:'auto'}} onClick={()=>onDelete(proj.id)}>Delete</button>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn pri" onClick={()=>{ if(!name.trim())return; onSave(proj.id,{name:name.trim(),desc,color}); }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtxMenu({ctx, projects, onAction, onClose}) {
  const proj = projects.find(p=>p.id===ctx.pid);
  useEffect(()=>{
    const h = e => { if(!document.getElementById('momentum-ctx')?.contains(e.target)) onClose(); };
    document.addEventListener('click',h);
    return ()=>document.removeEventListener('click',h);
  },[onClose]);
  if (!proj) return null;
  return (
    <div id="momentum-ctx" style={{left:ctx.x,top:ctx.y,position:'fixed'}}>
      <div className="ci" onClick={()=>onAction('settings',ctx.pid)}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7" cy="7" r="2.5"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.1 3.1l1.4 1.4M9.5 9.5l1.4 1.4M9.5 3.1l-1.4 1.4M4.5 9.5l-1.4 1.4"/></svg>
        Settings
      </div>
      <div className="ci" onClick={()=>onAction('rename',ctx.pid)}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M9.5 2l2.5 2.5-7 7H2.5V9l7-7z"/></svg>
        Rename
      </div>
      <div className="ctx-clrs">
        <div className="ctx-clrs-lbl">Color</div>
        <div className="ctx-clrs-row">
          {COLORS.map(c=><div key={c} className={`sw${proj.color===c?' sel':''}`} style={{background:c}} onClick={()=>onAction('color',ctx.pid,c)}/>)}
        </div>
      </div>
      <div className="ctx-sep"/>
      <div className="ci" onClick={()=>onAction('dup',ctx.pid)}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M2 10V2h8"/></svg>
        Duplicate
      </div>
      <div className="ci" onClick={()=>onAction('export',ctx.pid)}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M7 1v8M4.5 6l2.5 3 2.5-3M1 11v2h12v-2"/></svg>
        Export CSV
      </div>
      <div className="ctx-sep"/>
      <div className="ci danger" onClick={()=>onAction('del',ctx.pid)}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1.5 4h11M4.5 4V2.5h5V4M5.5 6.5v4M8.5 6.5v4M2.5 4l1 8h7l1-8"/></svg>
        Delete project
      </div>
    </div>
  );
}

function ConfirmDlg({dlg, onResolve}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'var(--rxl)',width:340,maxWidth:'94vw',padding:22}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>{dlg.title}</div>
        <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:20,whiteSpace:'pre-line'}}>{dlg.msg}</div>
        <div className="conf-acts" style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn" onClick={()=>onResolve(false)}>Cancel</button>
          <button className="btn danger" onClick={()=>onResolve(true)}>{dlg.okLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({msg}) {
  return (
    <div id="toast" style={{position:'fixed',bottom:20,right:20,zIndex:700}}>
      <div className="toast-dot"/><span>{msg}</span>
    </div>
  );
}

export function MomentumPage() {
  const [projects, setProjects] = useState(INIT_PROJECTS);
  const [tasks, setTasks] = useState(INIT_TASKS);
  const [activeProj, setActiveProj] = useState(null);
  const [view, setView] = useState('kb');
  const [zoom, setZoom] = useState('months');
  const [gtOpen, setGtOpen] = useState({});
  const [mineFilter, setMineFilter] = useState(false);
  const [taskModal, setTaskModal] = useState(null);
  const [projModal, setProjModal] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToastMsg(null), 2600);
  };

  const visTasks = useMemo(()=>{
    let ts = activeProj ? tasks.filter(t=>t.project===activeProj) : tasks;
    if (mineFilter) ts = ts.filter(t=>t.assignee==='PV');
    return ts;
  },[tasks,activeProj,mineFilter]);

  const stats = useMemo(()=>{
    const done = visTasks.filter(t=>t.status==='done').length;
    const active = visTasks.filter(t=>t.status==='inprogress').length;
    const od = visTasks.filter(t=>t.end&&new Date(t.end)<TODAY&&t.status!=='done').length;
    const pct = visTasks.length ? Math.round(done/visTasks.length*100) : 0;
    return {total:visTasks.length,done,active,od,pct};
  },[visTasks]);

  useEffect(()=>{
    const h = e => {
      if (e.key==='Escape') { setTaskModal(null); setProjModal(null); setCtx(null); setConfirmDlg(null); }
      if (e.key==='Enter' && confirmDlg) { const cb=confirmDlg.onConfirm; setConfirmDlg(null); cb&&cb(); }
      if ((e.key==='n'||e.key==='N') && !taskModal && !projModal && e.target.tagName!=='INPUT' && e.target.tagName!=='TEXTAREA') {
        setTaskModal({defStatus:'todo', defProj:activeProj||(projects[0]?.id||'')});
      }
    };
    document.addEventListener('keydown',h);
    return ()=>document.removeEventListener('keydown',h);
  },[taskModal,projModal,confirmDlg,activeProj,projects]);

  const handleMoveTask = (tid, status) => {
    setTasks(ts=>ts.map(t=>t.id===tid?{...t,status}:t));
    showToast('Moved to '+COLS.find(c=>c.id===status)?.label);
  };

  const handleSaveTask = (form, editId) => {
    if (editId) { setTasks(ts=>ts.map(t=>t.id===editId?{...t,...form}:t)); showToast('Task updated'); }
    else { setTasks(ts=>[...ts,{...form,id:uid()}]); showToast('Task created'); }
    setTaskModal(null);
  };

  const handleDeleteTask = (tid, title) => {
    setTaskModal(null);
    setConfirmDlg({title:'Delete task',msg:`Delete "${title}"?\nThis cannot be undone.`,okLabel:'Delete task',
      onConfirm:()=>{ setTasks(ts=>ts.filter(t=>t.id!==tid)); showToast('Task deleted'); }});
  };

  const handleNewProj = () => {
    const name = prompt('New project name:');
    if (!name?.trim()) return;
    const color = COLORS[projects.length%COLORS.length];
    setProjects(ps=>[...ps,{id:uid(),name:name.trim(),color,desc:''}]);
    showToast(`Project "${name.trim()}" created`);
  };

  const handleSaveProj = (pid, data) => {
    setProjects(ps=>ps.map(p=>p.id===pid?{...p,...data}:p));
    setProjModal(null); showToast('Project saved');
  };

  const handleDeleteProj = (pid) => {
    const proj = projects.find(p=>p.id===pid);
    if (!proj) return;
    setProjModal(null);
    const tc = tasks.filter(t=>t.project===pid).length;
    const msg = tc>0 ? `Permanently delete "${proj.name}" and its ${tc} task${tc!==1?'s':''}? This cannot be undone.` : `Delete "${proj.name}"? This cannot be undone.`;
    setConfirmDlg({title:'Delete project',msg,okLabel:'Delete',
      onConfirm:()=>{
        setProjects(ps=>ps.filter(p=>p.id!==pid));
        setTasks(ts=>ts.filter(t=>t.project!==pid));
        if (activeProj===pid) setActiveProj(null);
        showToast(`"${proj.name}" deleted`);
      }});
  };

  const handleCtxAction = (action, pid, extra) => {
    setCtx(null);
    const proj = projects.find(p=>p.id===pid);
    if (action==='settings') { setProjModal(proj); return; }
    if (action==='rename') {
      const n = prompt('Rename project:', proj?.name);
      if (n?.trim()) { setProjects(ps=>ps.map(p=>p.id===pid?{...p,name:n.trim()}:p)); showToast(`Renamed to "${n.trim()}"`); }
      return;
    }
    if (action==='color') { setProjects(ps=>ps.map(p=>p.id===pid?{...p,color:extra}:p)); showToast('Color updated'); return; }
    if (action==='dup') {
      if (!proj) return;
      const nid=uid();
      setProjects(ps=>[...ps,{...proj,id:nid,name:proj.name+' (copy)'}]);
      const nt=tasks.filter(t=>t.project===pid).map(t=>({...t,id:uid(),project:nid}));
      setTasks(ts=>[...ts,...nt]);
      showToast(`Duplicated with ${nt.length} task${nt.length!==1?'s':''}`);
      return;
    }
    if (action==='export') {
      const pts=tasks.filter(t=>t.project===pid);
      const rows=[['Title','Status','Priority','Type','Assignee','Progress %','Start','End']];
      pts.forEach(t=>rows.push([t.title,t.status,t.priority,t.type,t.assignee||'',t.progress,t.start||'',t.end||'']));
      const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
      const a=document.createElement('a');
      a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
      a.download=(proj?.name||'project').replace(/\s+/g,'-').toLowerCase()+'.csv';
      a.click(); showToast('CSV exported');
      return;
    }
    if (action==='del') handleDeleteProj(pid);
  };

  const openCtxMenu = (e, pid) => {
    e.stopPropagation(); e.preventDefault();
    const r=e.currentTarget.getBoundingClientRect();
    let left=r.right+4, top=r.top;
    if (left+192>window.innerWidth) left=r.left-196;
    if (top+310>window.innerHeight) top=Math.max(8,window.innerHeight-318);
    setCtx({pid,x:left,y:top});
  };

  const activeProject = projects.find(p=>p.id===activeProj);
  const hdrTitle = mineFilter?'My Tasks':(activeProject?.name||'All Projects');

  return (
    <div id="momentum-app">
      <div id="app">
        {/* SIDEBAR */}
        <div id="sb">
          <div className="sb-logo">
            <div className="sb-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="4" height="12" rx="1.5" fill="#0a1a11"/>
                <rect x="6.5" y="5" width="4" height="9" rx="1.5" fill="#0a1a11"/>
                <rect x="12" y="1" width="3" height="14" rx="1.5" fill="#0a1a11"/>
              </svg>
            </div>
            <span className="sb-name">Momentum</span>
          </div>
          <div className="sb-sec">Workspace</div>
          <div className="sb-list">
            <div className="sb-row">
              <div className={`sb-item${!activeProj&&!mineFilter?' act':''}`} onClick={()=>{setActiveProj(null);setMineFilter(false);}}>
                <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" opacity=".5"><circle cx="3.5" cy="3.5" r="3.5"/></svg>
                <span className="sb-lbl">All Projects</span>
              </div>
            </div>
            <div className="sb-row">
              <div className={`sb-item${mineFilter?' act':''}`} onClick={()=>{setActiveProj(null);setMineFilter(true);}}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 3h11M1 6.5h7M1 10h5"/></svg>
                <span className="sb-lbl">My Tasks</span>
              </div>
            </div>
          </div>
          <div className="sb-sec" style={{marginTop:10}}>Projects</div>
          <div className="sb-projects">
            {projects.map(p=>(
              <div key={p.id} className="sb-row">
                <div className={`sb-item${activeProj===p.id?' act':''}`} onClick={()=>{setActiveProj(p.id);setMineFilter(false);}}>
                  <span className="sb-dot" style={{background:p.color}}/>
                  <span className="sb-lbl">{p.name}</span>
                </div>
                <button className="sb-more" onClick={e=>openCtxMenu(e,p.id)} title="Options">···</button>
              </div>
            ))}
            <div className="sb-row">
              <div className="sb-item" onClick={handleNewProj} style={{color:'var(--text3)',fontSize:12}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1v10M1 6h10"/></svg>
                <span className="sb-lbl">New project</span>
              </div>
            </div>
          </div>
          <div className="sb-footer">
            <div className="sb-user">
              <div className="av" style={{width:26,height:26,fontSize:10,background:'#0d2e22',color:'var(--accent)'}}>PV</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Pranav V.</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>Delivery Manager</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div id="main">
          <div id="hdr">
            <div className="hdr-ttl">{hdrTitle}</div>
            <div className="vtabs">
              <button className={`vtab${view==='kb'?' act':''}`} onClick={()=>setView('kb')}>
                <svg viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="3.5" height="12" rx="1"/><rect x="4.5" y="3" width="3.5" height="9" rx="1"/><rect x="9" y="1" width="3" height="11" rx="1"/></svg>
                Board
              </button>
              <button className={`vtab${view==='gt'?' act':''}`} onClick={()=>setView('gt')}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="0" y="0.5" width="7" height="3" rx="1"/><rect x="3" y="4.5" width="7" height="3" rx="1"/><rect x="1" y="8.5" width="9" height="3" rx="1"/></svg>
                Timeline
              </button>
            </div>
            <button className="hbtn pri" onClick={()=>setTaskModal({defStatus:'todo',defProj:activeProj||(projects[0]?.id||'')})}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"><path d="M5.5 0v11M0 5.5h11"/></svg>
              Add Task
            </button>
          </div>

          <div id="statsbar">
            <div className="st"><div className="st-v">{stats.total}</div><div className="st-l">Tasks</div></div>
            <div className="st-sep"/>
            <div className="st"><div className="st-v" style={{color:'var(--accent)'}}>{stats.done}</div><div className="st-l">Done</div></div>
            <div className="st-sep"/>
            <div className="st"><div className="st-v" style={{color:'var(--blue)'}}>{stats.active}</div><div className="st-l">Active</div></div>
            <div className="st-sep"/>
            <div className="st"><div className="st-v" style={{color:'var(--red)'}}>{stats.od}</div><div className="st-l">Overdue</div></div>
            <div className="st-sep"/>
            <div className="st"><div className="st-v" style={{color:'var(--amber)'}}>{stats.pct}%</div><div className="st-l">Complete</div></div>
          </div>

          <div id="content">
            {view==='kb' ? (
              <KanbanView
                tasks={visTasks} projects={projects}
                onMoveTask={handleMoveTask}
                onOpenTask={tid=>setTaskModal({task:tasks.find(t=>t.id===tid)})}
                onOpenTaskInCol={col=>setTaskModal({defStatus:col,defProj:activeProj||(projects[0]?.id||'')})}
                onNewProj={handleNewProj}
              />
            ) : (
              <GanttView
                tasks={visTasks} projects={projects} zoom={zoom} setZoom={setZoom}
                gtOpen={gtOpen}
                toggleGt={pid=>setGtOpen(o=>({...o,[pid]:o[pid]===false?true:false}))}
                onOpenTask={tid=>setTaskModal({task:tasks.find(t=>t.id===tid)})}
              />
            )}
          </div>
        </div>
      </div>

      {taskModal && <TaskModal modal={taskModal} projects={projects} onSave={handleSaveTask} onDelete={handleDeleteTask} onClose={()=>setTaskModal(null)}/>}
      {projModal && <ProjModal proj={projModal} tasks={tasks} onSave={handleSaveProj} onDelete={handleDeleteProj} onClose={()=>setProjModal(null)}/>}
      {ctx && <CtxMenu ctx={ctx} projects={projects} onAction={handleCtxAction} onClose={()=>setCtx(null)}/>}
      {confirmDlg && <ConfirmDlg dlg={confirmDlg} onResolve={yes=>{const cb=confirmDlg.onConfirm;setConfirmDlg(null);if(yes&&cb)cb();}}/>}
      {toastMsg && <Toast msg={toastMsg}/>}
    </div>
  );
}
