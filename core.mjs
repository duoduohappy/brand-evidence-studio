import MiniSearch from 'minisearch';
import {Annotation, StateGraph, START, END} from '@langchain/langgraph';
import {createHash} from 'node:crypto';
import {TODAY} from './data.mjs';
export const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const eligible=(d,brand,kind)=>d.brand===brand&&d.kind===kind&&d.state==='active'&&d.effective<=TODAY&&d.expires>=TODAY;
const tokens=s=>{const chars=String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return [...chars,...Array.from({length:Math.max(0,chars.length-1)},(_,i)=>chars.slice(i,i+2))]};
export function retrieve(docs,c,filtered=true){
 const pool=filtered?docs.filter(d=>eligible(d,c.brand,c.kind)):docs;
 if(!pool.length)return [];
 const index=new MiniSearch({fields:['title','body'],storeFields:['title'],tokenize:tokens});index.addAll(pool);
 return index.search(c.query,{combineWith:'OR'}).slice(0,4).map(r=>({...pool.find(d=>d.id===r.id),score:Number(r.score.toFixed(3))}));
}
export function audit(text,c,docs,evidence){
 const issues=[];const refs=[...text.matchAll(/\[([A-Z][A-Z0-9-]+)\]/g)].map(m=>m[1]);
 for(const id of refs){const d=docs.find(d=>d.id===id);if(!d||!eligible(d,c.brand,c.kind))issues.push('引用不可用于当前品牌、时间或资料状态：'+id)}
 if(/全网第一|绝对安全|治愈失眠|免费赠送|跳过审批|立即发布/.test(text))issues.push('含绝对化、无依据承诺或越权指令');
 if(!evidence.length)return {status:issues.length?'BLOCKED':'NO_EVIDENCE',issues:issues.length?issues:['没有当前有效证据，需要人工补充资料'],refs};
 if(!refs.length)issues.push('缺少可追溯的资料引用');
 const active=docs.filter(d=>refs.includes(d.id)&&eligible(d,c.brand,c.kind));
 const allowed=active.map(d=>d.body.replaceAll(' ','')).join(' ');
 for(const phrase of ['手机应用','智能控制','快速充电','环保材料','京东','淘宝','保修期','太阳能'])if(text.includes(phrase)&&!allowed.includes(phrase))issues.push('资料未支持的具体表述：'+phrase);
 for(const m of text.matchAll(/\d+\s*(?:小时|元|档|件)|IPX\d|20\d\d-\d\d-\d\d|USB-C/g)){if(!allowed.includes(m[0].replaceAll(' ','')))issues.push('数字或规格无有效证据：'+m[0])}
 if(c.kind==='event'&&(!/20\d\d-\d\d-\d\d/.test(text)||!/限购|限.*件/.test(text)))issues.push('优惠内容缺少截止日期或限购条件');
 return {status:issues.length?'BLOCKED':'READY',issues:[...new Set(issues)],refs};
}
export function assemble(evidence){return evidence.length?evidence.slice(0,1).map(d=>d.body+' ['+d.id+']').join('\n'):'资料未覆盖此问题，需向品牌方确认。'}
export async function execute(c,docs,{mode='evidence',trace=()=>{},generate,fixture}={}){
 const State=Annotation.Root({evidence:Annotation(),draft:Annotation(),review:Annotation(),rawModel:Annotation()});
 const node=(name,fn)=>async state=>{const start=Date.now();try{const out=await fn(state);trace({node:name,status:'ok',ms:Date.now()-start,output:out});return out}catch(e){trace({node:name,status:'error',ms:Date.now()-start,error:e.message});throw e}};
 const graph=new StateGraph(State)
 .addNode('retrieve',node('retrieve',()=>({evidence:retrieve(docs,c)})))
 .addNode('compose',node('compose',async s=>{const output=mode==='probe'?fixture:mode==='model'&&s.evidence.length?await generate(c,s.evidence):assemble(s.evidence);return typeof output==='string'?{draft:output}:{draft:output.draft,rawModel:output.rawModel}}))
 .addNode('check',node('check',s=>({review:audit(s.draft,c,docs,s.evidence)})))
 .addNode('await_review',node('await_review',()=>({})))
 .addNode('halt',node('halt',()=>({})))
 .addEdge(START,'retrieve').addEdge('retrieve','compose').addEdge('compose','check')
 .addConditionalEdges('check',s=>s.review.status==='READY'?'await_review':'halt')
 .addEdge('await_review',END).addEdge('halt',END).compile();
 return graph.invoke({});
}
export const stamp=(text,revision)=>hash({text,revision});
export async function publishDraft(run,revision,connector){
 if(!run.approval||run.approval.stamp!==stamp(run.draft,revision))throw Error('审批已失效：内容或知识版本发生变化，请重新检查并签核');
 if(run.review.status!=='READY')throw Error('检查未通过，不能写入 CMS');
 const payload={title:run.name,body:run.draft,brand:run.brand,contentHash:hash(run.draft),runKey:run.id+':'+run.approval.stamp};
 const written=await connector.write(payload);const read=await connector.read(written.documentId);
 if(read.body!==payload.body||read.brand!==payload.brand||read.title!==payload.title||read.contentHash!==payload.contentHash||read.runKey!==payload.runKey||read.publishedAt!==null)throw Error('CMS 回读校验失败');
 return {documentId:read.documentId,contentHash:read.contentHash,publishedAt:read.publishedAt,verifiedAt:new Date().toISOString()};
}
