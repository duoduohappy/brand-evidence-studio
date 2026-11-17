import assert from 'node:assert/strict';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:18781';
function visitor(){let cookie='';return async(route,body)=>{const r=await fetch(base+route,{method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});cookie=r.headers.get('set-cookie')?.split(';')[0]||cookie;const text=await r.text();assert.equal(r.status,200,text);return r.headers.get('content-type')?.includes('application/json')?JSON.parse(text):text}}
const a=visitor(),b=visitor();assert.equal((await a('/api/state')).environment,'cloud');
for(const caseId of ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10']){const run=await a('/api/run',{caseId,mode:'probe'});assert.equal(run.status,run.expected)}
const run=await a('/api/run',{caseId:'T09',mode:'evidence'});await a('/api/approve',{id:run.id,reviewer:'容器集成测试'});const first=await a('/api/publish',{id:run.id}),again=await a('/api/publish',{id:run.id});assert.equal(first.receipt.documentId,again.receipt.documentId);assert.equal(first.receipt.publishedAt,null);
const cms=await a('/cms');assert.ok(cms.includes(first.receipt.documentId));assert.ok(!(await b('/cms')).includes(first.receipt.documentId));assert.equal((await b('/api/state')).runs.length,0);
const evaluation=await a('/api/evaluate',{});assert.equal(evaluation.rows.length,10);assert.ok(evaluation.rows.every(r=>r.passed&&r.retrievalPass));
console.log('Hosted stack: 10 scenarios, real Strapi write/readback, retry idempotence, CMS session isolation and evaluation all passed.');
