/* ==== 功能：成就 START ==== */
const Achievements = {
  activityDates(){
    const dates = new Set();
    Store.list('study_sessions').forEach(x => x.date && dates.add(x.date));
    Store.list('word_reviews').forEach(x => x.date && dates.add(x.date));
    Store.list('tasks').forEach(x => x.doneAt && dates.add(Util.dateOf(new Date(x.doneAt))));
    Store.list('coding_items').forEach(x => x.status === '已完成' && x._u && dates.add(Util.dateOf(new Date(x._u))));
    return [...dates].sort();
  },
  dayDiff(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);},
  streaks(dates){
    if(!dates.length)return {current:0,best:0};
    let run=1,best=1;
    for(let i=1;i<dates.length;i++){
      if(this.dayDiff(dates[i-1],dates[i])===1)run+=1;else run=1;
      best=Math.max(best,run);
    }
    const last=dates[dates.length-1],gap=this.dayDiff(last,Util.today());
    return {current:gap<=1?run:0,best};
  },
  collect(){
    const dates=this.activityDates(),streak=this.streaks(dates);
    const sessions=Store.list('study_sessions');
    const minutes=sessions.reduce((sum,x)=>sum+(Number(x.minutes)||0),0);
    const tasks=Store.list('tasks').filter(x=>x.done).length;
    const words=Store.list('words').filter(x=>(x.mastery||0)>=3).length;
    const coding=Store.list('coding_items').filter(x=>x.status==='已完成').length;
    const journey=dates.length?this.dayDiff(dates[0],Util.today())+1:0;
    return {dates,streak,minutes,tasks,words,coding,journey};
  },
  render(){
    const r=this.collect();
    const hero=document.getElementById('achievementHero');
    const stats=document.getElementById('achievementStats');
    const badges=document.getElementById('achievementBadges');
    if(!hero||!stats||!badges)return;
    hero.innerHTML=r.journey
      ?`<div class="hero num">${r.journey}<span class="unit">天同行</span></div><p class="hint">从第一次留下学习记录算起，你累计认真生活了 ${r.dates.length} 天。</p>`
      :'<div class="empty">完成一次学习、任务或单词复习后，成就会从这里开始记录。</div>';
    stats.innerHTML=[
      [r.streak.current,'当前连续'],[r.streak.best,'最长连续'],[Math.round(r.minutes/60*10)/10,'学习小时'],[r.tasks,'完成任务'],[r.words,'掌握单词'],[r.coding,'编程成果']
    ].map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
    const goals=[
      ['第一步',r.dates.length,1,'留下第一个认真学习的日子'],
      ['七日节奏',r.streak.best,7,'连续坚持 7 天'],
      ['月度坚持',r.dates.length,30,'累计活跃 30 天'],
      ['专注十小时',r.minutes,600,'累计学习 10 小时'],
      ['任务达人',r.tasks,20,'完成 20 项任务'],
      ['词汇收藏家',r.words,50,'掌握 50 个单词'],
      ['代码进阶',r.coding,5,'完成 5 个编程学习项']
    ];
    badges.innerHTML=goals.map(([name,value,target,desc])=>{
      const unlocked=value>=target,pct=Math.min(100,Math.round(value/target*100));
      return `<div class="item" style="opacity:${unlocked?1:.66}"><span class="box">${unlocked?'★':'◇'}</span><div class="grow"><span class="strong">${name}${unlocked?' · 已解锁':''}</span><div class="meta">${desc} · ${Math.min(value,target)}/${target}</div><div class="progress"><i style="width:${pct}%"></i></div></div></div>`;
    }).join('');
  }
};
/* ==== 功能：成就 END ==== */
