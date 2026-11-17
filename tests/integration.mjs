import assert from 'node:assert/strict';import fs from 'node:fs';
const base='http://127.0.0.1:18781/api/';const report=[];
async function call(route,data,expected=200){const r=await fetch(base+route,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const b=await r.json();assert.equal(r.status,expected,JSON.stringify(b));return b}
const health=await call('health');assert.equal(health.cms.cms,'Strapi');report.push('Independent Strapi service healthy');
for(const caseId of ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10']){const r=await call('run',{caseId,mode:'probe'});const s=await call('state');assert.equal(r.review.status,s.cases.find(c=>c.id===caseId).expected);report.push(caseId+' actual API guard: '+r.review.status)}
const r=await call('run',{caseId:'T09',mode:'evidence'});await call('publish',{id:r.id},400);report.push('Write before approval rejected');
await call('approve',{id:r.id,reviewer:'集成测试审核人'});const first=await call('publish',{id:r.id});const retry=await call('publish',{id:r.id});assert.equal(first.receipt.documentId,retry.receipt.documentId);assert.equal(first.receipt.publishedAt,null);report.push('T09 real CMS duplicate retry returns same documentId');
await call('knowledge',{id:'A-PROD-2',state:'retired'});try{await call('publish',{id:r.id},400);report.push('T08 changed knowledge invalidates approval')}finally{await call('knowledge',{id:'A-PROD-2',state:'active'})}
const b=await call('run',{caseId:'T10',mode:'evidence'});await call('approve',{id:b.id,reviewer:'集成测试审核人'});const delivered=await call('publish',{id:b.id});assert.equal(delivered.receipt.publishedAt,null);report.push('T10 second brand saved as real unpublished CMS draft');
const e=await call('evaluate',{});assert.equal(e.rows.length,10);assert.ok(e.rows.every(r=>r.passed&&r.retrievalPass));report.push('Evaluation: all 10 retrieval and fixture guard expectations met');
fs.mkdirSync('runtime',{recursive:true});fs.writeFileSync('runtime/integration-report.json',JSON.stringify({at:new Date().toISOString(),cms:health.cms,results:report,evaluation:e},null,2));console.log(report.join('\n'));
