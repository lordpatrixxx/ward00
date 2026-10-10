import * as T from 'three';
import {createTara} from './tara-model.js';

export class TaraAvatar {
  constructor() {
    this.renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.4;
    this.canvas=this.renderer.domElement;this.canvas.className='tara-avatar-canvas';
    this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Animated 3D Tara Naik wearing a mustard raincoat and field radio');
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(32,1,.1,30);this.camera.position.set(0,2.05,4.8);this.camera.lookAt(0,1.83,0);
    this.rig=createTara();this.scene.add(this.rig.root);
    this.scene.add(new T.HemisphereLight('#c9e9ef','#433429',2));
    const key=new T.DirectionalLight('#ffe0b5',3);key.position.set(-3,5,5);this.scene.add(key);
    const rim=new T.DirectionalLight('#67e7db',1.4);rim.position.set(3,3,-3);this.scene.add(rim);
    const fill=new T.DirectionalLight('#bad8f4',.8);fill.position.set(3,2,4);this.scene.add(fill);
    this.pointer={x:0,y:0};this.amplitude=0;this.expression='neutral';this.reduced=false;this.active=true;
    this.onMove=e=>{const b=this.canvas.getBoundingClientRect();this.pointer.x=Math.max(-1,Math.min(1,(e.clientX-b.left)/b.width*2-1));this.pointer.y=Math.max(-1,Math.min(1,(e.clientY-b.top)/b.height*2-1));};
    this.canvas.addEventListener('pointermove',this.onMove);this.canvas.addEventListener('pointerleave',()=>{this.pointer.x=0;this.pointer.y=0;});
    this.observer=new ResizeObserver(()=>this.resize());
    this.nextBlink=2.8;this.blinkStart=-10;this.lastFrame=0;this.renderFrame=this.renderFrame.bind(this);
    this.renderer.setAnimationLoop(this.renderFrame);
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.host?.classList.remove('has-avatar');this.active=false;});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.active=true;this.host?.classList.add('has-avatar');});
  }
  mount(host) {this.observer.disconnect();this.host=host;host.append(this.canvas);this.observer.observe(host);host.classList.add('has-avatar');this.resize();}
  resize(){if(!this.host)return;const {width,height}=this.host.getBoundingClientRect();if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);}
  renderFrame(ms){
    if(ms-this.lastFrame<33||document.hidden||!this.canvas.isConnected||!this.active||!this.host?.getClientRects().length)return;
    const bounds=this.host.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return;
    this.lastFrame=ms;const t=ms/1000,r=this.rig, motion=!this.reduced;
    r.root.position.y=motion?Math.sin(t*1.8)*.012:0;r.root.rotation.y=-.06+(motion?Math.sin(t*.5)*.035:0);
    r.head.rotation.y=T.MathUtils.lerp(r.head.rotation.y,motion?this.pointer.x*.15:0,.09);
    r.head.rotation.x=T.MathUtils.lerp(r.head.rotation.x,motion?this.pointer.y*.065:0,.09);
    r.head.rotation.z=this.expression==='thinking'?.05:this.expression==='concerned'?-.025:0;
    r.pony.rotation.x=motion?Math.sin(t*1.4)*.025:0;
    if(t>this.nextBlink&&motion){this.blinkStart=t;this.nextBlink=t+3.2+Math.random()*2.4;}
    const b=t-this.blinkStart, eye=motion&&b<.18?Math.max(.08,Math.abs(b-.09)/.09):1;
    r.eyeGroups.forEach(e=>e.scale.y=eye);
    r.brows.forEach((e,i)=>{const s=i===0?-1:1;e.rotation.z=this.expression==='concerned'?s*.16:this.expression==='determined'?-s*.13:0;e.position.y=this.expression==='relieved'?.20:.183;});
    const a=motion?this.amplitude:0;r.opening.scale.y=.009+a*.059;r.lower.position.y=-a*.078;r.teeth.visible=a>.23;
    r.led.material.emissiveIntensity=.7+this.amplitude*2;
    this.renderer.render(this.scene,this.camera);
  }
  destroy(){this.renderer.setAnimationLoop(null);this.observer.disconnect();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});this.renderer.dispose();}
}
