import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
// Renderer smoke test, not a browser or visual-layout test.
const elements=new Map(),events={};const element=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',style:{}});return elements.get(s)};
const context={document:{querySelector:element,addEventListener:()=>{}},location:{hash:''},window:{addEventListener:(n,fn)=>events[n]=fn,scrollTo:()=>{}},fetch:u=>fetch('http://127.0.0.1:18781'+u),setInterval:()=>0,setTimeout:()=>0,console};
await vm.runInNewContext('(async()=>{'+fs.readFileSync('public/app.js','utf8')+'})()',context);
const expected={overview:'让品牌内容有据可查',knowledge:'品牌知识库',workbench:'内容工作台',runtime:'Agent 运行记录',approval:'人工审核与 CMS',evaluation:'质量评测',help:'使用说明'};
for(const [p,title]of Object.entries(expected)){context.location.hash='#'+p;events.hashchange();assert.ok(element('#content').innerHTML.includes(title),p);assert.ok(element('#nav').innerHTML.includes('data-page="'+p+'" class="active"'),p);console.log('Rendered navigation:',p)}
fs.writeFileSync('runtime/ui-smoke-report.txt','All 7 navigation views rendered successfully against live API state.\nThis does not verify browser interaction or visual layout.\n');
