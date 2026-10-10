import * as T from 'three';

// Original stylized mesh. Coordinates are metres; named parts make the GLB editable.
export function createTara() {
  const root = new T.Group(); root.name = 'Tara_Naik';
  const mat = (color, roughness=.65, metalness=0) => new T.MeshStandardMaterial({color,roughness,metalness});
  const skin=mat('#ac6847'), earSkin=mat('#844532'), hair=mat('#151b20',.43), hairLight=mat('#2c2725',.5);
  const coat=mat('#c79329',.56), seam=mat('#8d6426'), lining=mat('#38484b'), strap=mat('#27363b'), silver=mat('#9aa8a3',.33,.65);
  const lip=mat('#9c4e40',.56), mouthMat=mat('#381e25'), white=mat('#e7ded2',.35), iris=mat('#49301d',.28), pupil=mat('#111519',.22);
  const add=(p,g,m,pos=[0,0,0],scale=[1,1,1],name='')=>{const o=new T.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);o.name=name;p.add(o);return o;};
  const ell=(p,m,pos,scale,name)=>add(p,new T.SphereGeometry(1,40,28),m,pos,scale,name);
  const tube=(p,pts,r,m,name)=>add(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(...a))),32,r,8,false),m,[0,0,0],[1,1,1],name);
  const box=(p,m,pos,scale,name)=>{const g=new T.BoxGeometry(...scale,2,2,2);return add(p,g,m,pos,[1,1,1],name);};
  // Waterproof coat, shoulders, folded collar and backpack.
  const body=new T.Group(); body.name='Torso'; root.add(body);
  ell(body,coat,[0,1.04,0],[.61,.91,.33],'Raincoat');
  ell(body,strap,[0,1.13,-.34],[.56,.7,.2],'Backpack');
  for(const s of [-1,1]) {
    const sleeve=ell(body,coat,[s*.58,1.16,-.02],[.235,.63,.24],'Sleeve');sleeve.rotation.z=s*.18;
    ell(body,lining,[s*.68,.64,.005],[.20,.055,.20],'Cuff');
    ell(body,skin,[s*.65,.48,.065],[.16,.22,.14],'Hand');
    tube(body,[[s*.42,1.82,-.18],[s*.43,1.7,.22],[s*.42,1.35,.34],[s*.45,.69,.27]],.056,strap,'Backpack_strap');
    box(body,silver,[s*.436,1.28,.388],[.115,.095,.025],'Strap_buckle');
    tube(body,[[s*.05,1.67,.27],[s*.30,1.73,.33],[s*.36,1.84,.10],[s*.25,1.85,-.22],[s*.02,1.82,-.30]],.043,coat,'Hood_fold');
    tube(body,[[s*.2,.65,.294],[s*.4,.76,.276]],.012,seam,'Pocket_seam');
    tube(body,[[s*.28,1.73,.34],[s*.22,1.41,.354]],.012,lining,'Drawcord');
    ell(body,silver,[s*.22,1.40,.354],[.018,.04,.02],'Cord_tip');
  }
  tube(body,[[0,.18,.2],[0,.65,.332],[0,1.15,.342],[0,1.65,.285]],.019,lining,'Zip');
  box(body,silver,[0,1.54,.333],[.045,.068,.025],'Zip_pull');
  for(let i=0;i<28;i++)box(body,silver,[0,.35+i*.04,.35-Math.pow(.35+i*.04-1.04,2)*.1],[.036,.012,.008],'Zip_tooth');
  ell(body,skin,[0,1.88,-.025],[.205,.32,.19],'Neck');
  // Radio clipped to the right shoulder strap.
  const radio=new T.Group();radio.name='Field_radio';radio.position.set(.40,1.40,.42);radio.rotation.z=-.08;body.add(radio);
  box(radio,strap,[0,0,0],[.19,.31,.095],'Radio_case');
  box(radio,mat('#66b9a7',.28),[0,.065,.052],[.13,.065,.009],'Radio_display');
  tube(radio,[[.065,.15,0],[.065,.43,0]],.012,lining,'Antenna');
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)box(radio,silver,[-.049+j*.049,-.02-i*.028,.052],[.025,.014,.008],'Radio_key');
  const led=ell(radio,new T.MeshStandardMaterial({color:'#71e9ce',emissive:'#36c7a9',emissiveIntensity:.7}),[-.06,.125,.055],[.014,.014,.006],'Radio_LED');
  // Head is a continuous shaped surface rather than a stack of facial primitives.
  const head=new T.Group();head.name='Head';head.position.set(0,2.35,0);root.add(head);
  const geo=new T.SphereGeometry(1,72,56), p=geo.attributes.position;
  for(let i=0;i<p.count;i++) {
    let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const jaw=y<-.20?1-(-y-.20)*.25:1;
    const front=Math.max(0,z);
    x*=.43*jaw;
    const cheek=.025*Math.exp(-Math.pow((y+.12)/.3,2))*front;
    z=z*.385+cheek;
    // Nose bridge and tip sculpted into the face using smooth Gaussian fields.
    const nose=(.065*Math.exp(-Math.pow(x/.075,2)-Math.pow((y+.035)/.27,2))+.045*Math.exp(-Math.pow(x/.095,2)-Math.pow((y+.18)/.10,2)))*Math.pow(front,8);
    z+=nose;
    p.setXYZ(i,x,y*.59,z);
  }
  geo.computeVertexNormals();add(head,geo,skin,[0,0,0],[1,1,1],'Face');
  const eyeGroups=[],brows=[];
  for(const s of [-1,1]) {
    ell(head,skin,[s*.424,-.022,-.007],[.073,.135,.086],'Ear');
    ell(head,earSkin,[s*.445,-.017,.06],[.029,.079,.018],'Ear_inner');
    ell(head,silver,[s*.434,-.103,.072],[.019,.019,.018],'Ear_stud');
    // Eyes sit against the face surface, with continuous upper and lower eyelid curves.
    const eye=new T.Group();eye.name=s<0?'Eye_L':'Eye_R';eye.position.set(s*.177,.075,.354);eye.rotation.y=s*.17;head.add(eye);eyeGroups.push(eye);
    ell(eye,white,[0,0,0],[.107,.049,.043],'Eye_white');
    ell(eye,iris,[0,0,.040],[.046,.046,.012],'Iris');
    ell(eye,pupil,[0,0,.051],[.023,.028,.007],'Pupil');
    ell(eye,white,[-.014,.017,.058],[.010,.010,.002],'Eye_glint');
    tube(eye,[[-.106,0,.002],[-.065,.042,.031],[0,.051,.044],[.071,.035,.028],[.105,-.004,0]],.009,hair,'Upper_lash');
    tube(eye,[[-.102,-.004,0],[-.060,-.036,.02],[0,-.044,.034],[.068,-.03,.018],[.103,-.004,0]],.008,earSkin,'Lower_lid');
    const brow=new T.Group();brow.name=s<0?'Brow_L':'Brow_R';brow.position.set(s*.177,.183,.33);head.add(brow);brows.push(brow);
    tube(brow,[[-.103,-.009,0],[-.040,.018,.035],[.025,.018,.035],[.103,-.003,-.005]],.016,hair,'Eyebrow');
    ell(head,earSkin,[s*.036,-.126,.455],[.011,.006,.005],'Nostril');
  }
  const mouth=new T.Group();mouth.name='Mouth';mouth.position.set(0,-.262,.345);head.add(mouth);
  const opening=ell(mouth,mouthMat,[0,-.004,0],[.095,.009,.014],'Mouth_open');
  const upper=tube(mouth,[[-.105,0,0],[-.050,.019,.013],[0,.011,.025],[.05,.019,.013],[.105,0,0]],.014,lip,'Upper_lip');
  const lower=tube(mouth,[[-.103,-.002,0],[-.052,-.024,.018],[0,-.030,.022],[.052,-.024,.018],[.103,-.002,0]],.016,lip,'Lower_lip');
  const teeth=ell(mouth,white,[0,-.006,.008],[.067,.008,.008],'Teeth');teeth.visible=false;
  // Scalp surface with a higher front hairline and lower rear hairline.
  const hp=[],hi=[],rows=28,cols=64;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
    const a=i/cols*Math.PI*2, front=(Math.cos(a)+1)/2;
    const edge=1.94-.91*Math.pow(front,3)+.08*Math.sin(a*3);
    const theta=j/rows*edge;
    hp.push(.454*Math.sin(theta)*Math.sin(a),.618*Math.cos(theta)+.019,.406*Math.sin(theta)*Math.cos(a)-.02);
    if(j<rows&&i<cols){const n=j*(cols+1)+i;hi.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}
  }
  const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));hg.setIndex(hi);hg.computeVertexNormals();
  add(head,hg,hair,[0,0,0],[1,1,1],'Hair_cap');
  ell(head,hair,[.025,.464,-.015],[.367,.173,.337],'Swept_crown');
  // Swept locks over the crown, fine contrasting strands, and a tied ponytail.
  for(let i=0;i<16;i++) {
    const k=i/15;
    tube(head,[[-.35+k*.57,.365+Math.sin(k*Math.PI)*.12,.27],[-.30+k*.62,.53,.23],[-.20+k*.52,.62,-.01],[.02+k*.28,.48,-.29],[.18,.24,-.42]],.017+(i%3)*.005,i%4===0?hairLight:hair,'Swept_lock');
  }
  const pony=new T.Group();pony.name='Ponytail';pony.position.set(.11,.14,-.4);head.add(pony);
  ell(pony,hair,[0,-.22,-.03],[.18,.39,.16],'Ponytail_volume');
  for(let i=0;i<7;i++){const x=(i-3)*.035;tube(pony,[[x,.01,0],[x+.04,-.22,-.1],[x+.09,-.45,-.04],[x+.02,-.62,.04]],.024,i%3===0?hairLight:hair,'Ponytail_lock');}
  ell(pony,seam,[0,.008,.005],[.155,.038,.13],'Hair_tie');
  tube(head,[[-.365,.35,.22],[-.425,.15,.24],[-.402,-.02,.28],[-.36,-.14,.24]],.018,hair,'Loose_lock');
  root.userData={author:'WARD00 original procedural character',description:'Stylized Tara Naik, engineering student and Aangan resident'};
  return {root,body,head,eyeGroups,brows,opening,upper,lower,teeth,pony,led};
}
