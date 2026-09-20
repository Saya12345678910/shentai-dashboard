/* ==== 功能：今日总览 START ==== */
const Home = {
  render(){
    const today = Util.today();
    document.getElementById('homeDate').textContent = new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
    const tasks = Store.list('tasks');
    const due = tasks.filter(x => !x.done && (!x.due || x.due <= today));
    const sessions = Store.list('study_sessions').filter(x => x.date === today);
    const mins = sessions.reduce((s,x)=>s+(Number(x.minutes)||0),0);
    const reviewed = Store.list('word_reviews').filter(x => x.date === today).length;
    const spent = Store.list('expenses').filter(x => x.date === today).reduce((s,x)=>s+(Number(x.amount)||0),0);
    document.getElementById('homeStats').innerHTML = [
      [tasks.filter(x=>x.done).length + '/' + tasks.length,'任务完成'],
      [mins + ' 分','今日学习'],[reviewed,'复习单词'],['¥' + spent.toFixed(2),'今日开销']
    ].map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
    const events = Store.list('events',(a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).filter(x=>x.date>=today).slice(0,3);
    const next = [...due.slice(0,3).map(x=>`<div class="item"><span class="box"></span><div class="grow"><span class="strong">${Util.esc(x.text)}</span><div class="meta">${Util.esc(x.subject||'未分类')} · ${x.due||'未设日期'}</div></div></div>`),...events.map(x=>`<div class="item"><span class="box">◇</span><div class="grow"><span class="strong">${Util.esc(x.title)}</span><div class="meta">${x.date} ${x.time||''}</div></div></div>`)];
    document.getElementById('homeNext').innerHTML = next.length ? next.join('') : '<div class="empty">今天没有迫近的事项</div>';
    document.getElementById('homeStudy').innerHTML = sessions.length ? sessions.slice(-4).reverse().map(x=>`<div class="item"><div class="grow">${Util.esc(x.subject||'专注学习')}<div class="meta">${x.minutes} 分钟</div></div></div>`).join('') : '<div class="empty">开始一次专注，记录会出现在这里</div>';
  }
};
/* ==== 功能：今日总览 END ==== */
