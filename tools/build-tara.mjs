import {build} from 'esbuild';
import {writeFile,copyFile,mkdir} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import * as T from 'three';
import {createTara} from '../src/tara-model.js';

// GLTFExporter uses FileReader even for texture-free binary scenes.
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result=`data:${blob.type};base64,${Buffer.from(v).toString('base64')}`;this.onloadend?.();});}
};
await mkdir('dist/vendor',{recursive:true});
await build({entryPoints:['src/tara-avatar.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'dist/vendor/tara-avatar.js',legalComments:'linked'});
await copyFile('node_modules/three/LICENSE','dist/vendor/three-LICENSE.txt');
const {root}=createTara();
const idle=new T.AnimationClip('Breathing',4,[new T.NumberKeyframeTrack('Torso.scale[y]',[0,1,2,3,4],[1,1.006,1,0.996,1])]);
const glb=await new GLTFExporter().parseAsync(root,{binary:true,animations:[idle],onlyVisible:false});
await writeFile('dist/assets/tara/tara-naik.glb',Buffer.from(glb));
console.log(`Tara GLB: ${glb.byteLength} bytes. Browser renderer bundled locally.`);
