import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TARA_DIALOGUE } from '../dist/tara-dialogue.js';
import { DialogueManager } from '../dist/dialogue-manager.js';

const DIST_DIR = path.resolve('dist');
const ASSETS_TARA = path.join(DIST_DIR, 'assets', 'tara');
const DIALOGUE_JSON = path.join(DIST_DIR, 'tara-dialogue.json');

test('tara dialogue manifest exists and is valid JSON', () => {
  assert.ok(fs.existsSync(DIALOGUE_JSON), 'tara-dialogue.json must exist');
  const raw = fs.readFileSync(DIALOGUE_JSON, 'utf-8');
  const data = JSON.parse(raw);
  assert.ok(data && typeof data === 'object', 'Manifest must be an object');
  assert.ok(Object.keys(data).length >= 24, 'Must have all narrative beats (expected 24)');
});

test('tara dialogue manifest matches TARA_DIALOGUE ES module export', () => {
  const jsonDict = JSON.parse(fs.readFileSync(DIALOGUE_JSON, 'utf-8'));
  assert.equal(Object.keys(jsonDict).length, Object.keys(TARA_DIALOGUE).length);
  for (const key of Object.keys(jsonDict)) {
    assert.ok(TARA_DIALOGUE[key], `ES Module missing key '${key}'`);
    assert.equal(jsonDict[key].text, TARA_DIALOGUE[key].text);
    assert.equal(jsonDict[key].expression, TARA_DIALOGUE[key].expression);
    assert.equal(jsonDict[key].audioMp3, TARA_DIALOGUE[key].audioMp3);
    assert.equal(jsonDict[key].audioWebm, TARA_DIALOGUE[key].audioWebm);
  }
});

test('tara dialogue contains all required story and gameplay beats', () => {
  const data = JSON.parse(fs.readFileSync(DIALOGUE_JSON, 'utf-8'));
  const requiredBeats = [
    'intro',
    'ch1_start',
    'ch1_landmark',
    'ch1_done',
    'ch2_start',
    'ch2_gauge',
    'ch2_done',
    'ch2_wrong',
    'ch3_start',
    'ch3_checks',
    'ch3_route',
    'ch4_start',
    'ch4_audit',
    'ch4_done',
    'ch5_start',
    'ch5_plan_hint',
    'ch5_plan_ok',
    'ch5_sensor_fail',
    'ch5_field_check',
    'ch5_held',
    'ch5_reverted',
    'ch6_start',
    'ch6_ending_held',
    'ch6_ending_reverted'
  ];

  for (const beatId of requiredBeats) {
    assert.ok(data[beatId], `Dialogue line '${beatId}' must exist`);
    const line = data[beatId];
    assert.ok(typeof line.text === 'string' && line.text.length > 5, `'${beatId}' must have readable text`);
    assert.ok(typeof line.duration === 'number' && line.duration > 0, `'${beatId}' must have duration > 0`);
    assert.ok(Array.isArray(line.envelope), `'${beatId}' must have amplitude envelope array`);
    assert.ok(line.envelope.length > 0, `'${beatId}' envelope must not be empty`);
    for (const amp of line.envelope) {
      assert.ok(amp >= 0 && amp <= 1, `'${beatId}' envelope values must be between 0.0 and 1.0`);
    }
  }
});

test('tara character expression states are valid', () => {
  const data = JSON.parse(fs.readFileSync(DIALOGUE_JSON, 'utf-8'));
  const validExpressions = new Set([
    'neutral',
    'concerned',
    'thinking',
    'determined',
    'relieved',
    'speaking'
  ]);

  for (const [id, line] of Object.entries(data)) {
    assert.ok(validExpressions.has(line.expression), `Expression '${line.expression}' on '${id}' is not in valid set`);
  }
});

test('bundled audio assets exist for all dialogue beats', () => {
  const data = JSON.parse(fs.readFileSync(DIALOGUE_JSON, 'utf-8'));
  for (const [id, line] of Object.entries(data)) {
    assert.ok(line.audioMp3, `Beat '${id}' must specify audioMp3`);
    assert.ok(line.audioWebm, `Beat '${id}' must specify audioWebm`);

    const mp3Path = path.join(DIST_DIR, line.audioMp3);
    assert.ok(fs.existsSync(mp3Path), `Audio file '${line.audioMp3}' for beat '${id}' must exist on disk`);
    const statsMp3 = fs.statSync(mp3Path);
    assert.ok(statsMp3.size > 1000, `Audio file '${line.audioMp3}' should be larger than 1KB (got ${statsMp3.size} bytes)`);

    const webmPath = path.join(DIST_DIR, line.audioWebm);
    assert.ok(fs.existsSync(webmPath), `WebM audio file '${line.audioWebm}' for beat '${id}' must exist`);
    const statsWebm = fs.statSync(webmPath);
    assert.ok(statsWebm.size > 1000, `Audio file '${line.audioWebm}' should be larger than 1KB (got ${statsWebm.size} bytes)`);
  }
});

test('all required character portrait artwork files exist', () => {
  const requiredStates = [
    'tara-neutral',
    'tara-concerned',
    'tara-thinking',
    'tara-determined',
    'tara-relieved',
    'tara-speaking',
    'tara-sprite'
  ];

  for (const state of requiredStates) {
    const webpPath = path.join(ASSETS_TARA, `${state}.webp`);
    const jpgPath = path.join(ASSETS_TARA, `${state}.jpg`);
    assert.ok(fs.existsSync(webpPath), `Portrait asset '${state}.webp' must exist`);
    assert.ok(fs.existsSync(jpgPath), `Portrait asset '${state}.jpg' fallback must exist`);
    assert.ok(fs.statSync(webpPath).size > 5000, `'${state}.webp' must not be empty or stub`);
    assert.ok(fs.statSync(jpgPath).size > 5000, `'${state}.jpg' must not be empty or stub`);
  }
});

test('DialogueManager pauses timer during mandatory dialogue and resumes when cancelled', async () => {
  let timerPausedState = null;
  const dm = new DialogueManager({
    onTimerPause: (paused) => {
      timerPausedState = paused;
    }
  });

  // Calling play with isMandatory=true must trigger onTimerPause(true)
  await dm.play('ch5_sensor_fail', { force: true, isMandatory: true });
  assert.equal(timerPausedState, true, 'Timer must pause when mandatory dialogue begins');
  assert.equal(dm.activeTimerPause, true);

  // Cancelling must immediately release timer pause
  dm.cancel();
  assert.equal(timerPausedState, false, 'Timer must resume when dialogue is cancelled or finished');
  assert.equal(dm.activeTimerPause, false);

  // Manual replay must NOT pause timer (prevents unlimited timer exploit)
  timerPausedState = null;
  await dm.play('ch5_sensor_fail', { force: true, isMandatory: true, isReplay: true });
  assert.equal(timerPausedState, null, 'Replay must not re-pause timer');
});

test('DialogueManager deduplicates dialogue on ordinary chapter re-renders', async () => {
  let playCount = 0;
  const dm = new DialogueManager();
  // Override internal playback trigger for test observation
  dm.playBundledAudio = () => { playCount++; };

  // First call should play
  await dm.play('ch1_start');
  assert.ok(dm.playedIds.has('ch1_start'));

  // Second call without force (such as from a state re-render) should be ignored
  const currentCount = playCount;
  await dm.play('ch1_start');
  assert.equal(playCount, currentCount, 'Should not re-trigger speech audio on re-render');
});

test('late rejected audio cannot restart speech after navigating away', async () => {
  const OriginalAudio=globalThis.Audio;
  let rejectPlayback, fallbackCalls=0;
  globalThis.Audio=class {
    addEventListener(){} pause(){} canPlayType(){return 'probably';}
    play(){return new Promise((resolve,reject)=>{rejectPlayback=reject;});}
  };
  try {
    const dm=new DialogueManager({soundtrack:{on:true,volume:.3,setVolume(){}}});
    dm.playWithSpeechSynthesis=()=>{fallbackCalls++;};
    await dm.play('intro');
    dm.cancel();rejectPlayback(new Error('Playback interrupted'));
    await Promise.resolve();await Promise.resolve();
    assert.equal(fallbackCalls,0);
    assert.equal(dm.isPlaying,false);
  } finally {globalThis.Audio=OriginalAudio;}
});

test('muting voice releases a mandatory pause and retains the caption for replay', async () => {
  let paused=false;
  const dm=new DialogueManager({onTimerPause:v=>{paused=v;}});
  await dm.play('ch5_sensor_fail',{isMandatory:true});
  assert.equal(paused,true);
  dm.toggleVoiceMute();
  assert.equal(paused,false);
  assert.equal(dm.isPlaying,false);
  assert.equal(dm.currentLine.id,'ch5_sensor_fail');
  assert.equal(dm.captionTimer,null);
});

test('exported Tara is a real GLB with editable meshes and a breathing animation', () => {
  const file=fs.readFileSync(path.join(ASSETS_TARA,'tara-naik.glb'));
  assert.equal(file.toString('ascii',0,4),'glTF');
  assert.equal(file.readUInt32LE(4),2);
  assert.equal(file.readUInt32LE(8),file.length);
  const length=file.readUInt32LE(12);
  const gltf=JSON.parse(file.toString('utf8',20,20+length));
  assert.ok(gltf.meshes.length>30);
  assert.ok(gltf.nodes.some(n=>n.name==='Head'));
  assert.ok(gltf.animations.some(a=>a.name==='Breathing'));
});
