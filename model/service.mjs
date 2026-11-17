import http from 'node:http';import path from 'node:path';import {pipeline,env} from '@huggingface/transformers';
env.cacheDir=path.resolve(import.meta.dirname,'../runtime/model-cache');
// Optional mirror, explicitly configured by the operator; defaults to Hugging Face.
if(process.env.HF_ENDPOINT)env.remoteHost=process.env.HF_ENDPOINT.replace(/\/$/,'')+'/';
let generator=null,failure=null;const model='onnx-community/Qwen2.5-0.5B-Instruct';let running=false;
const server=http.createServer(async(req,res)=>{const send=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value))};if(req.url==='/health')return send({ready:!!generator,model,error:failure});if(req.url!=='/generate'||req.method!=='POST')return send({error:'not found'},404);if(!generator)return send({error:failure||'模型下载或加载中'},503);if(running)return send({error:'模型忙，请稍后重试'},429);let raw='';for await(const c of req){raw+=c;if(raw.length>16000)return send({error:'input too large'},413)}running=true;try{const {messages}=JSON.parse(raw);const result=await generator(messages,{max_new_tokens:180,do_sample:false});const generated=result[0].generated_text;send({text:Array.isArray(generated)?generated.at(-1).content:generated,model})}catch(e){send({error:e.message},500)}finally{running=false}});
server.listen(18783,'127.0.0.1',()=>console.log('Local model: http://127.0.0.1:18783'));
pipeline('text-generation',model,{dtype:'q4',device:'cpu'}).then(x=>{generator=x;console.log('Local model ready')}).catch(e=>{failure=e.message;console.error('Model unavailable:',e.message)});
