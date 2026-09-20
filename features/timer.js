/* ==== 功能：学习计时 START ==== */
const Timer = {
  total:1500,left:1500,running:false,tick:null,started:0,
  preset(min,btn){if(this.running)return UI.toast('请先暂停当前计时');this.total=this.left=min*60;document.querySelectorAll('#page-timer .chip').forEach(x=>x.classList.remove('on'));btn.classList.add('on');this.paint();},
  paint(){const m=Math.floor(this.left/60),s=this.left%60;document.getElementById('timerClock').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');document.getElementById('timerMain').textContent=this.running?'暂停':'开始';document.getElementById('timerState').textContent=this.running?'专注中':'准备开始';},
  toggle(){this.running=!this.running;if(this.running){this.started=Date.now();this.tick=setInterval(()=>{this.left=Math.max(0,this.left-1);this.paint();if(!this.left){this.running=false;clearInterval(this.tick);this.finish();}},1000)}else clearInterval(this.tick);this.paint();},
  finish(){clearInterval(this.tick);this.running=false;const used=Math.max(1,Math.round((this.total-this.left)/60));const subject=document.getElementById('timerSubject').value.trim()||'专注学习';Store.upsert('study_sessions',{subject,minutes:used,date:Util.today(),endedAt:Date.now()});this.left=this.total;this.paint();this.render();UI.toast(`已记录 ${used} 分钟`);},
  reset(){clearInterval(this.tick);this.running=false;this.left=this.total;this.paint();},
  render(){this.paint();const list=Store.list('study_sessions',(a,b)=>(b.endedAt||0)-(a.endedAt||0)).slice(0,20);document.getElementById('sessionList').innerHTML=list.length?list.map(x=>`<div class="item"><div class="grow"><span class="strong">${Util.esc(x.subject)}</span><div class="meta">${x.date} · ${x.minutes} 分钟</div></div><button class="del" onclick="Timer.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">还没有学习记录</div>';},
  del(id){Store.softDelete('study_sessions',id);this.render();}
};
/* ==== 功能：学习计时 END ==== */
