export class Soundtrack{
 constructor(){this.on=false;this.stage=0;this.volume=.32;this.nodes=[];this.beat=0;}
 async toggle(){if(this.on){this.off();return false;}await this.start();return this.on;}
 async start(){try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();await this.ctx.resume();this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.master.connect(this.ctx.destination);this.on=true;this.beat=0;this.schedule();this.interval=setInterval(()=>this.schedule(),1200);this.rain();}catch{this.on=false;} }
 off(){this.on=false;clearInterval(this.interval);if(this.master){const m=this.master;m.gain.setTargetAtTime(0,this.ctx.currentTime,.15);setTimeout(()=>m.disconnect(),900);}this.noise?.stop();}
 setVolume(v){this.volume=v; if(this.on&&this.master)this.master.gain.setTargetAtTime(this.isDucked?v*.28:v,this.ctx.currentTime,.1);}
 duck(isDucked){this.isDucked=Boolean(isDucked);if(this.on&&this.master){const target=this.isDucked?this.volume*0.28:this.volume;this.master.gain.setTargetAtTime(target,this.ctx.currentTime,.15);}}
 setStage(n){this.stage=n;this.beat=0;}
 tone(freq,time,duration,amp=.06,type='sine'){if(!this.on)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(this.master);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(amp,time+.08);g.gain.exponentialRampToValueAtTime(.001,time+duration);o.start(time);o.stop(time+duration+.05);}
 schedule(){if(!this.on)return;const t=this.ctx.currentTime+.03;const modes=[[146.83,174.61,220,293.66],[146.83,220,261.63,329.63],[130.81,155.56,196,261.63],[174.61,220,261.63,349.23],[146.83,174.61,233.08,293.66],[110,130.81,164.81,220],[174.61,220,293.66,349.23]];const notes=modes[this.stage]||modes[0];const seq=[0,2,1,3,2,1,0,3];this.tone(notes[seq[this.beat%8]],t,2.8,.075);if(this.beat%4===0){notes.slice(0,3).forEach((f,i)=>this.tone(f/2,t+i*.05,5,.025,'triangle'));}if(this.stage===5){this.tone(55,t,.16,.13);this.tone(55,t+.6,.12,.08);}this.beat++;}
 rain(){const b=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.08;this.noise=this.ctx.createBufferSource();this.noise.buffer=b;this.noise.loop=true;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=750;this.noise.connect(f);f.connect(this.master);this.noise.start();}
 cue(ok=true){if(this.on){this.tone(ok?587:174,this.ctx.currentTime,.8,.1);if(ok)this.tone(880,this.ctx.currentTime+.13,1,.06);}}
}
