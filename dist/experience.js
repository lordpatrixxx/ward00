// Presentation effects are independent of saved campaign state.
export class Experience {
 constructor(sound){
  this.sound=sound; this.transitionTimer=0;
  document.addEventListener('click',e=>{
   const target=e.target.closest('button,a,input');
   if(!target||target.disabled)return;
   if(this.sound.on)this.sound.tone(420,this.sound.ctx.currentTime,.12,.018,'triangle');
   if(this.reduced)return;
   const r=target.getBoundingClientRect(), x=e.detail?e.clientX:r.left+r.width/2,y=e.detail?e.clientY:r.top+r.height/2;
   const ring=document.createElement('i');ring.className='interaction-ring';ring.style.left=x+'px';ring.style.top=y+'px';ring.setAttribute('aria-hidden','true');
   (target.closest('dialog')||document.body).append(ring);setTimeout(()=>ring.remove(),650);
  },true);
  document.addEventListener('pointermove',e=>{
   if(this.reduced||e.pointerType!=='mouse')return;
   const card=e.target.closest('.check-card,.improvement,.evidence-card,.hero-console');
   if(card){const r=card.getBoundingClientRect();card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');}
  });
 }
 get reduced(){return document.body.classList.contains('reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches;}
 boot(){
  const d=document.querySelector('#boot');if(!d)return;
  const main=document.querySelector('#main'),steps=['Opening the city network','Reading the monsoon warning','Aangan: location not found','Your city is waiting.'];
  let closed=false;const timers=[];
  const finish=()=>{if(closed)return;closed=true;timers.forEach(clearTimeout);d.close();document.body.classList.remove('booting');main.focus({preventScroll:true});d.remove();};
  document.body.classList.add('booting');d.showModal();d.querySelector('button').onclick=finish;d.addEventListener('cancel',e=>{e.preventDefault();finish();});
  if(this.reduced){finish();return;}
  steps.forEach((s,i)=>timers.push(setTimeout(()=>{d.querySelector('.boot-status').textContent=s;d.dataset.step=i;d.querySelector('.boot-track i').style.width=((i+1)*25)+'%';},i*780)));
  timers.push(setTimeout(finish,3400));
 }
 enter(chapter){
  if(this.reduced)return;
  clearTimeout(this.transitionTimer);document.querySelector('#chapter-arrival')?.remove();
  const overlay=document.createElement('div');overlay.id='chapter-arrival';overlay.setAttribute('aria-hidden','true');
  const top=document.createElement('span'),title=document.createElement('strong'),line=document.createElement('i');
  top.textContent=chapter.time+' / NAYANTARA';title.textContent=chapter.short;overlay.append(top,title,line);document.body.append(overlay);
  this.transitionTimer=setTimeout(()=>overlay.remove(),1250);
 }
 afterRender(state){
  const v=document.querySelector('.weather-film');if(v){if(this.reduced)v.pause();else v.play().catch(()=>{});}
  const root=document.querySelector('.play-column');if(!root)return;
  root.querySelectorAll('.check-card,.evidence-card,.improvement,.sensor-readings article,.map-pin').forEach((e,i)=>e.style.setProperty('--order',i));
  root.querySelectorAll('[data-valve]').forEach(e=>e.style.setProperty('--level',e.value+'%'));
  if(!this.reduced){root.querySelectorAll('.map-bottom strong').forEach(e=>{if(e.textContent!=='8,412')return;const start=performance.now();const tick=t=>{if(!e.isConnected)return;const f=Math.min(1,(t-start)/650);e.textContent=Math.round(8412*(1-Math.pow(1-f,3))).toLocaleString('en-US');if(f<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);});}
 }
 feedback(ok){
  document.body.classList.remove('feedback-good','feedback-bad');
  requestAnimationFrame(()=>document.body.classList.add(ok?'feedback-good':'feedback-bad'));
  clearTimeout(this.feedbackTimer);this.feedbackTimer=setTimeout(()=>document.body.classList.remove('feedback-good','feedback-bad'),800);
 }
 scan(){
  const map=document.querySelector('.map-viewport');if(!map)return;
  map.classList.remove('scanning');void map.offsetWidth;map.classList.add('scanning');
  setTimeout(()=>map.classList.remove('scanning'),1500);
 }
}
