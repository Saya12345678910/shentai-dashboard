/* ==== 功能：重要事件 START ==== */
const Events = {
  render(){
    const today=Util.today(); const list=Store.list('events',(a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    document.getElementById('eventList').innerHTML=list.length?list.map(x=>{const diff=Math.ceil((new Date(x.date+'T00:00:00')-new Date(today+'T00:00:00'))/864e5);const when=diff<0?'已过去':diff===0?'就是今天':diff===1?'明天':`还有 ${diff} 天`;return `<div class="item"><div class="grow"><span class="strong">${Util.esc(x.title)}</span><div class="meta">${x.date} ${x.time||''} · ${when}</div>${x.note?`<div class="meta">${Util.esc(x.note)}</div>`:''}</div><button class="del" onclick="Events.del('${x.id}')">✕</button></div>`}).join(''):'<div class="empty">还没有重要事件</div>';
  },
  add(){const title=document.getElementById('eventTitle').value.trim(),date=document.getElementById('eventDate').value;if(!title||!date)return UI.toast('请填写事件名称和日期');Store.upsert('events',{title,date,time:document.getElementById('eventTime').value,note:document.getElementById('eventNote').value.trim()});document.getElementById('eventTitle').value='';document.getElementById('eventNote').value='';this.render();UI.toast('事件已保存');},
  del(id){Store.softDelete('events',id);this.render();}
};
/* ==== 功能：重要事件 END ==== */
