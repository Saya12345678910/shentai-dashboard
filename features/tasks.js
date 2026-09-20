/* ==== 功能：学习任务 START ==== */
const Tasks = {
  render(){
    const list = Store.list('tasks',(a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999'));
    document.getElementById('taskList').innerHTML = list.length ? list.map(x=>`<div class="item ${x.done?'done':''}"><button class="box" onclick="Tasks.toggle('${x.id}')">${x.done?'✓':''}</button><div class="grow"><span class="strong">${Util.esc(x.text)}</span><div class="meta">${Util.esc(x.subject||'未分类')} · ${x.due||'未设日期'} · ${Util.esc(x.priority||'普通')}</div></div><button class="del" onclick="Tasks.del('${x.id}')">✕</button></div>`).join('') : '<div class="empty">还没有任务</div>';
  },
  add(){
    const text=document.getElementById('taskText').value.trim(); if(!text)return UI.toast('先写下任务内容');
    Store.upsert('tasks',{text,subject:document.getElementById('taskSubject').value.trim(),due:document.getElementById('taskDue').value,priority:document.getElementById('taskPriority').value,done:false,created:Util.today()});
    document.getElementById('taskText').value=''; this.render(); UI.toast('任务已添加');
  },
  toggle(id){ const x=Store.list('tasks').find(v=>v.id===id); if(!x)return; Store.upsert('tasks',{...x,done:!x.done,doneAt:!x.done?Date.now():null}); this.render(); },
  del(id){ Store.softDelete('tasks',id); this.render(); }
};
/* ==== 功能：学习任务 END ==== */
