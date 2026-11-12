import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(path='/menu'){
 const effects=[],events=new Map(),ref={current:null};let refreshes=0,reloads=0;
 const router={refresh:()=>refreshes++};
 const modules={'react':{useEffect:fn=>effects.push(fn),useRef:()=>ref},'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'next/navigation':{usePathname:()=>path,useRouter:()=>router}};
 const exports={};const source=ts.transpileModule(fs.readFileSync(new URL('../src/components/site-chrome.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,require:name=>modules[name],window:{location:{reload:()=>reloads++},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name,fn)=>{if(events.get(name)===fn)events.delete(name);}}});
 return{render:kind=>exports.SiteChrome({kind,children:'signed-in',guest:'guest'}),effects,events,setPath:value=>{path=value},counts:()=>({refreshes,reloads})};
}
test('authentication and recovery pages immediately select guest navigation and hide customer tabs',()=>{
 for(const path of ['/login','/signup','/session-unavailable']){const f=fixture(path);assert.equal(f.render('navigation').props.children,'guest');assert.equal(f.render('customer-tabs'),null);}
 const f=fixture('/menu');assert.equal(f.render('navigation').props.children,'signed-in');
 for(const path of ['/admin/menu','/staff/menu']){f.setPath(path);assert.equal(f.render('navigation'),null);assert.equal(f.render('footer'),null);}
});
test('history and persisted page restoration revalidate sessions; ordinary pageshow does not reload',()=>{
 const f=fixture();f.render('navigation');const cleanup=f.effects[1]();f.events.get('pageshow')({persisted:false});assert.equal(f.counts().reloads,0);f.events.get('pageshow')({persisted:true});assert.equal(f.counts().reloads,1);f.events.get('popstate')();assert.equal(f.counts().refreshes,1);cleanup();assert.equal(f.events.size,0);
});
test('login entry refreshes once rather than creating a refresh loop',()=>{
 const f=fixture('/login');f.render('navigation');f.effects[0]();f.effects[0]();assert.equal(f.counts().refreshes,1);
});
