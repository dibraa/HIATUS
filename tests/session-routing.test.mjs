import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const root=new URL('../',import.meta.url);
function compile(file){return ts.transpileModule(fs.readFileSync(new URL(file,root),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;}
function fixture({status=200,role='customer',active=true,token='valid',error=false,permissions=[]}={}){
 const account={_id:'test-account',email:'test@example.test',role,is_active:active,permissions,full_name:'Test account',phone:null,created_at:'2026-01-01'};
 const modules={},calls=[];
 const fetch=async(_url,options)=>{calls.push(options);if(error)throw new TypeError('isolated network error');return Response.json(status===200?account:{error:'isolated'}, {status});};
 function load(file){const exports={};vm.runInNewContext(compile(file),{exports,require(name){if(name in modules)return modules[name];throw Error(name);},fetch,AbortSignal,URL,Headers,TextEncoder,console,process:{env:{JWT_SECRET:'isolated-secret',NODE_ENV:'test'}}});return exports;}
 modules['@/lib/roles']=load('src/lib/roles.ts');
 modules['./permission-catalog.json']=JSON.parse(fs.readFileSync(new URL('src/lib/permission-catalog.json',root)));
 modules['@/lib/permissions']=load('src/lib/permissions.ts');
 modules['@/lib/mock-staff-data']={USE_MOCKS:false};
 modules['jose']={jwtVerify:async()=>{if(token==='expired')throw Error('expired');return{payload:{role:'customer'}};}};
 const response=(status,path,options)=>({status,path,options,deleted:[],cookies:{delete(name){this.owner.deleted.push(name);}}});
 const wrap=r=>{r.cookies.owner=r;return r;};
 modules['next/server']={NextResponse:{redirect:url=>wrap(response(307,url.pathname+url.search)),next:options=>wrap(response(200,null,options))}};
 if(fs.existsSync(new URL('src/lib/session.ts',root)))modules['@/lib/session']=load('src/lib/session.ts');
 const proxy=load('src/proxy.ts').proxy;
 return{calls,modules,load,async visit(path){const url=new URL(path,'http://localhost');url.clone=()=>new URL(url);return proxy({headers:new Headers(),nextUrl:url,cookies:{get:()=>token?{value:token}:undefined}});}};
}
test('temporary server, rate-limit and network failures do not become login redirects',async()=>{
 for(const options of [{status:503},{status:500},{status:429},{error:true}]){const f=fixture(options);const r=await f.visit('/menu?q=latte&page=2');assert(r.path?.startsWith('/session-unavailable?'),JSON.stringify({options,path:r.path}));assert.equal(r.deleted.length,0);assert(new URL(r.path,'http://localhost').searchParams.get('next').includes('q=latte'));}
});
test('rejected, expired and inactive sessions go to login and clear the rejected cookie',async()=>{
 for(const options of [{status:401},{status:403},{token:'expired'},{active:false}]){const r=await fixture(options).visit('/orders');assert(r.path.startsWith('/login?'));assert(r.deleted.includes('token'));}
});
test('valid login visits return each role to its first permitted home',async()=>{
 for(const [role,permissions,path]of [['customer',[],'/'],['staff',['counter.view'],'/staff'],['admin',['orders.view'],'/admin/orders']])assert.equal((await fixture({role,permissions}).visit('/login')).path,path);
});
test('customer and staff cannot access admin; admin cannot open staff counter',async()=>{
 assert((await fixture().visit('/admin')).path.startsWith('/?denied='));
 assert((await fixture({role:'staff',permissions:['counter.view']}).visit('/admin')).path.startsWith('/staff?denied='));
 assert.equal((await fixture({role:'admin',permissions:['orders.view']}).visit('/staff')).path,'/admin/orders');
});
test('role changes and restricted-account destinations use current backend permissions',async()=>{
 const f=fixture({role:'staff',permissions:['availability.view']});assert.equal((await f.visit('/')).path,'/staff/menu');assert.equal((await f.visit('/staff')).path,'/staff/menu');
 assert.equal((await fixture({role:'admin',permissions:[]}).visit('/login')).path,'/access-denied');
});
test('unavailable page does not recursively check a session; guests still reach login',async()=>{
 const f=fixture({status:503});assert.equal((await f.visit('/session-unavailable?next=/menu')).status,200);assert.equal(f.calls.length,0);assert((await fixture({token:null}).visit('/orders')).path.startsWith('/login?'));
});
test('invalid cookie is stripped from public request and response, with server path headers overwritten',async()=>{
 const r=await fixture({token:'expired'}).visit('/login');assert.equal(r.status,200);assert(r.deleted.includes('token'));assert.equal(r.options.request.headers.get('x-pathname'),'/login');
});

test('server-rendered account checks share outage handling and do not accept inactive accounts', async()=>{
 for(const options of [{status:503},{error:true},{status:401},{active:false},{}]){
  const f=fixture(options);f.modules['react']={cache:fn=>fn};f.modules['next/headers']={headers:async()=>new Headers({'x-pathname':'/menu','x-session-return-to':'/menu?q=latte'})};f.modules['next/navigation']={redirect:path=>{throw Object.assign(new Error('isolated redirect'),{path});}};f.modules['@/lib/server-token']={getServerToken:async()=>'valid'};
  const auth=f.load('src/lib/auth.ts');
  if(options.status===503||options.error)await assert.rejects(auth.getCurrentUser(),e=>e.path?.startsWith('/session-unavailable?'));
  else if(options.status===401||options.active===false)assert.equal(await auth.getCurrentUser(),null);
  else assert.equal((await auth.getCurrentUser()).role,'customer');
 }
});
test('session recovery rejects external or authentication-loop return destinations',()=>{
 const f=fixture(),safe=f.modules['@/lib/session'].sessionReturnTo;
 for(const path of ['https://example.test','//example.test','/login','/signup','/session-unavailable?next=/menu'])assert.equal(safe(path),'/');
 assert.equal(safe('/menu?q=coffee&page=2'),'/menu?q=coffee&page=2');
});

test('anonymous visitors can browse menu pages and details while cart and checkout stay protected',async()=>{
 const f=fixture({token:null});for(const path of ['/menu','/menu?page=2','/menu/test-item'])assert.equal((await f.visit(path)).status,200);
 assert.equal(f.calls.length,0);for(const path of ['/cart','/checkout','/orders','/profile','/favorites'])assert((await f.visit(path)).path.startsWith('/login?'));
});
