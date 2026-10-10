/** Tara's persistent 3D viewport, accessible portrait fallback, and speech animation. */
export class TaraCharacter {
 constructor(options={}) {
  this.onToggle=options.onToggle;this.expression='neutral';this.isSpeaking=false;this.amplitude=0;this.isCollapsed=false;this.animFrame=null;this.avatar=null;this.avatarPromise=null;this.mode='3d';
 }
 get reduced(){return typeof window!=='undefined'&&(document.body.classList.contains('reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches);}
 renderHTML(){return `<section class="tara-panel ${this.isCollapsed?'collapsed':''}" id="tara-panel" aria-label="Tara Naik character panel" data-expression="${this.expression}"><div class="tara-header-bar"><div class="tara-id"><span class="live-dot" id="tara-status-dot"></span><div class="tara-title-wrap"><strong class="tara-name">TARA NAIK</strong><small class="tara-meta">AANGAN · FIELD CONNECTION</small></div></div><div class="tara-bar-actions"><span class="tara-state-tag" id="tara-state-tag">CONNECTED</span><button class="tara-collapse-btn" id="tara-collapse-btn" aria-label="${this.isCollapsed?'Expand':'Collapse'} Tara panel">${this.isCollapsed?'＋':'—'}</button></div></div><div class="tara-body-wrap"><div class="tara-portrait-stage" id="tara-stage"><div class="tara-back-atmosphere" aria-hidden="true"><div class="tara-radar-sweep"></div></div><img class="tara-portrait-fallback" src="assets/tara/tara-3d-portrait.png" alt="Tara Naik in a mustard raincoat with a field radio"><div class="tara-avatar-host" id="tara-avatar-host"></div><span class="tara-connection-label">● LIVE FROM AANGAN</span><button class="tara-view-toggle" id="tara-view-toggle" aria-label="Switch Tara to portrait view">PORTRAIT VIEW</button></div><div class="tara-dialogue-slot" id="tara-dialogue-slot"><p class="tara-idle-caption">“Let’s put our neighborhood back on the map.”</p></div></div></section>`;}
 mount(host){
  this.container=host;host.innerHTML=this.renderHTML();
  host.querySelector('#tara-collapse-btn').onclick=()=>this.toggleCollapse();
  host.querySelector('#tara-view-toggle').onclick=()=>{this.mode=this.mode==='3d'?'portrait':'3d';this.updateView();};
  this.setExpression(this.expression);this.setSpeaking(this.isSpeaking,this.amplitude);this.updateView();
  if(this.avatar){this.avatar.mount(host.querySelector('#tara-avatar-host'));this.avatar.reduced=this.reduced;this.updateView();}
  else if(!this.avatarPromise){
   this.avatarPromise=import('./vendor/tara-avatar.js').then(({TaraAvatar})=>{
    this.avatar=new TaraAvatar();const slot=this.container?.querySelector('#tara-avatar-host');if(slot)this.avatar.mount(slot);
    this.avatar.reduced=this.reduced;this.avatar.expression=this.expression;this.avatar.amplitude=this.isSpeaking?this.amplitude:0;this.updateView();
   }).catch(()=>{this.mode='portrait';this.updateView();});
  }
 }
 updateView(){
  const stage=this.container?.querySelector('#tara-stage'),btn=this.container?.querySelector('#tara-view-toggle');
  stage?.classList.toggle('portrait-mode',this.mode==='portrait');
  if(this.avatar)this.avatar.active=this.mode==='3d'&&!this.isCollapsed;
  if(btn){btn.textContent=this.mode==='portrait'?'3D VIEW':'PORTRAIT VIEW';btn.setAttribute('aria-label',this.mode==='portrait'?'Switch Tara to 3D view':'Switch Tara to portrait view');btn.disabled=this.mode==='portrait'&&!this.avatar;}
 }
 toggleCollapse(){this.isCollapsed=!this.isCollapsed;const panel=this.container?.querySelector('#tara-panel');panel?.classList.toggle('collapsed',this.isCollapsed);const btn=this.container?.querySelector('#tara-collapse-btn');if(btn){btn.textContent=this.isCollapsed?'＋':'—';btn.setAttribute('aria-label',`${this.isCollapsed?'Expand':'Collapse'} Tara panel`);}this.updateView();this.onToggle?.(this.isCollapsed);}
 setExpression(expr){this.expression=['neutral','concerned','thinking','determined','relieved'].includes(expr)?expr:'neutral';if(this.avatar)this.avatar.expression=this.expression;const panel=this.container?.querySelector('#tara-panel');if(panel)panel.dataset.expression=this.expression;const tag=this.container?.querySelector('#tara-state-tag');if(tag)tag.textContent=({neutral:'CONNECTED',concerned:'ALERT',thinking:'ANALYZING',determined:'RESOLUTE',relieved:'HOLDING'})[this.expression];}
 setSpeaking(speaking,amplitude=0){this.isSpeaking=!!speaking;this.amplitude=Math.max(0,Math.min(1,amplitude));if(this.avatar){this.avatar.amplitude=this.isSpeaking?this.amplitude:0;this.avatar.reduced=this.reduced;}this.container?.querySelector('#tara-panel')?.classList.toggle('speaking',this.isSpeaking);this.container?.querySelector('#tara-status-dot')?.classList.toggle('transmitting',this.isSpeaking);}
 syncWithAudio(clock,envelope,duration){this.stopSyncLoop();if(!envelope?.length)return;const tick=()=>{if(!this.isSpeaking)return;const t=clock();if(t>=duration){this.setSpeaking(false);return;}this.setSpeaking(true,envelope[Math.floor(t*20)]||0);this.animFrame=requestAnimationFrame(tick);};this.animFrame=requestAnimationFrame(tick);}
 stopSyncLoop(){if(this.animFrame)cancelAnimationFrame(this.animFrame);this.animFrame=null;}
 destroy(){this.stopSyncLoop();this.avatar?.destroy();}
}
