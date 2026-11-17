import {randomUUID} from 'node:crypto';
export function webConfig(env=process.env){
 const port=Number(env.PORT||18781),cloud=env.DEPLOY_MODE==='cloud';
 const origin=new URL(env.PUBLIC_ORIGIN||env.RENDER_EXTERNAL_URL||`http://127.0.0.1:${port}`);
 if(!['http:','https:'].includes(origin.protocol)||origin.pathname!=='/'||origin.username||origin.password)throw Error('PUBLIC_ORIGIN must be an HTTP(S) origin');
 if(cloud&&origin.hostname==='127.0.0.1'&&!env.PUBLIC_ORIGIN)throw Error('Cloud deployment requires PUBLIC_ORIGIN or RENDER_EXTERNAL_URL');
 return {port,cloud,host:env.HOST||(cloud?'0.0.0.0':'127.0.0.1'),origin:origin.origin,authority:origin.host,secure:origin.protocol==='https:'};
}
export function sessionId(cookie,cloud){if(!cloud)return 'local';return /(?:^|;\s*)bes_session=([a-f0-9-]{36})(?:;|$)/.exec(cookie||'')?.[1]||randomUUID()}
export function allowedRequest(req,config){return req.headers.host===config.authority&&(!req.headers.origin||req.headers.origin===config.origin)}
