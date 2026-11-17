import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {webConfig,sessionId,allowedRequest} from '../web-config.mjs';
test('Cloud config uses Render origin and rejects foreign hosts/origins',()=>{const c=webConfig({PORT:'19081',DEPLOY_MODE:'cloud',RENDER_EXTERNAL_URL:'https://demo.onrender.com'});assert.equal(c.host,'0.0.0.0');assert.ok(allowedRequest({headers:{host:'demo.onrender.com',origin:c.origin}},c));assert.ok(!allowedRequest({headers:{host:'attacker.test'}},c));assert.ok(!allowedRequest({headers:{host:c.authority,origin:'https://attacker.test'}},c));assert.throws(()=>webConfig({DEPLOY_MODE:'cloud'}),/requires/)});
test('Local scope is retained, cloud sessions are unguessable and reusable',()=>{assert.equal(sessionId('',false),'local');const a=sessionId('',true),b=sessionId('',true);assert.notEqual(a,b);assert.equal(sessionId('bes_session='+a,true),a)});
test('Live cloud API isolates browser state and rejects cross-session writes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bes-cloud-'));const port=19881;
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,DEPLOY_MODE:'cloud',HOST:'127.0.0.1',PORT:String(port),PUBLIC_ORIGIN:`http://127.0.0.1:${port}`,DATA_DIR:dir},stdio:'pipe',windowsHide:true});let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
 try{let up=false;for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}/api/state`);if(r.ok){up=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(up,output);
 const base=`http://127.0.0.1:${port}`;const a=await fetch(base+'/api/state'),cookieA=a.headers.get('set-cookie').split(';')[0];const b=await fetch(base+'/api/state'),cookieB=b.headers.get('set-cookie').split(';')[0];assert.notEqual(cookieA,cookieB);
 const call=(route,cookie,body)=>fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const run=await (await call('run',cookieA,{caseId:'T01',mode:'evidence'})).json();assert.equal(run.status,'READY');
 assert.equal((await (await call('state',cookieA)).json()).runs.length,1);assert.equal((await (await call('state',cookieB)).json()).runs.length,0);
 assert.equal((await call('edit',cookieB,{id:run.id,draft:'tamper'})).status,400);
 assert.equal((await fetch(base+'/api/evaluate')).status,400);
 assert.equal((await fetch(base+'/api/evaluate',{method:'POST',headers:{origin:'https://attacker.test','Content-Type':'application/json'},body:'{}'})).status,400);
 }finally{if(child.exitCode===null){child.kill();await new Promise(r=>child.once('exit',r))}if(!path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'bes-cloud-'))throw Error('Unexpected cleanup path');fs.rmSync(dir,{recursive:true,force:true})}
});
