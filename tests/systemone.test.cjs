const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app.js');
test('three primitives use one native request without chat fields', () => {
  const r=app.buildRequest('jev-1.13-free',' payment failed ',JSON.stringify(app.presets.triage));
  assert.deepEqual(Object.keys(r).sort(),['model','questions','state']);assert.equal(r.state,'payment failed');
  assert.deepEqual(Object.values(r.questions).map(q=>q.type).sort(),['choice','noul','score']);
});
test('bad questions fail before inference', () => {
  for (const v of ['{','[]','{}','{"a":{"type":"choice","instructions":"route","criteria":[]}}','{"a":{"type":"score","instructions":"rate","criteria":{}}}']) assert.throws(()=>app.buildRequest('jev-1.13-free','state',v));
  assert.throws(()=>app.buildRequest('jev-1.13-free','  ',JSON.stringify(app.presets.noul)));
});
test('structured criteria and instructions remain intact', () => {
  const q={route:{type:'choice',instructions:{question:'route'},criteria:{a:{meaning:'a'},b:{meaning:'b'}}}};
  assert.deepEqual(app.buildRequest('jev-1.13','state',JSON.stringify(q)).questions,q);
});
test('quota errors preserve HTTP, upstream type, and retry guidance', () => {
  const m=app.errorMessage(429,{error:{type:'FreeUsageLimitError',message:'quota exhausted'}},'60');
  assert.match(m,/429/);assert.match(m,/FreeUsageLimitError/);assert.match(m,/60/);
  assert.match(app.errorMessage(403,{error:'Workspace selection is required'}),/工作区/);
});
test('success requires all answers and retains fractional scores', () => {
  const r=app.buildRequest('jev-1.13-free','state',JSON.stringify(app.presets.triage));
  assert.throws(()=>app.readAnswers({choices:[]},r));assert.throws(()=>app.readAnswers({answers:{is_urgent:{type:'noul',noul:.9}}},r));
  const answers={is_urgent:{type:'noul',noul:.93},department:{type:'choice',choice:'billing',confidence:0,probabilities:{billing:.7,technical:.3}},severity:{type:'score',score:1.43,legend:{0:'low',1:'medium',2:'high'},probabilities:{1:.57,2:.43}}};
  const rows=app.readAnswers({answers},r);assert.equal(rows[2].score,1.43);assert.equal(rows[1].confidence,0);
});
test('local and mini bases work; URL credentials and scripts are rejected', () => {
  assert.equal(app.normalizeBase('http://127.0.0.1:4001'),'http://127.0.0.1:4001/v1');assert.equal(app.normalizeBase('http://100.64.0.1:4001/v1/'),'http://100.64.0.1:4001/v1');
  for(const v of ['javascript:alert(1)','https://name:secret@example.com/v1','https://example.com/v1?key=x']) assert.throws(()=>app.normalizeBase(v));
});
test('empty or mismatched typed answers never render as successful inference',()=>{
  const r=app.buildRequest('jev-1.13-free','state',JSON.stringify(app.presets.noul));
  for(const a of [{},{type:'score',score:1},{type:'noul',noul:2},{type:'noul',noul:.7,confidence:-.5}]) assert.throws(()=>app.readAnswers({answers:{is_urgent:a}},r));
});
