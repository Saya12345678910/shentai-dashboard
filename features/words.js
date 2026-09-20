/* ==== 功能：英语单词 START ==== */
const Words = {
  render(){const list=Store.list('words',(a,b)=>(a.mastery||0)-(b.mastery||0)||(b._u||0)-(a._u||0));document.getElementById('wordList').innerHTML=list.length?list.map(x=>`<div class="item"><div class="grow"><span class="strong">${Util.esc(x.word)}</span> <span class="meta">${'●'.repeat(x.mastery||0)}${'○'.repeat(3-(x.mastery||0))}</span><div>${Util.esc(x.meaning)}</div>${x.note?`<div class="meta">${Util.esc(x.note)}</div>`:''}</div><button class="chip" onclick="Words.review('${x.id}',false)">再练</button><button class="chip" onclick="Words.review('${x.id}',true)">记住</button><button class="del" onclick="Words.del('${x.id}')">✕</button></div>`).join(''):'<div class="empty">单词本还是空的</div>';},
  add(){const word=document.getElementById('wordText').value.trim(),meaning=document.getElementById('wordMeaning').value.trim();if(!word||!meaning)return UI.toast('请填写单词和释义');Store.upsert('words',{word,meaning,note:document.getElementById('wordNote').value.trim(),mastery:0});document.getElementById('wordText').value='';document.getElementById('wordMeaning').value='';document.getElementById('wordNote').value='';this.render();},
  review(id,ok){const x=Store.list('words').find(v=>v.id===id);if(!x)return;Store.upsert('words',{...x,mastery:ok?Math.min(3,(x.mastery||0)+1):Math.max(0,(x.mastery||0)-1),lastReview:Util.today()});Store.upsert('word_reviews',{wordId:id,date:Util.today(),ok});this.render();},
  del(id){Store.softDelete('words',id);this.render();}
};
/* ==== 功能：英语单词 END ==== */
