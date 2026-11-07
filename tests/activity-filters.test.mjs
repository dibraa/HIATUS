import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
function load(file, modules = {}) {
 const code=ts.transpileModule(readFileSync(new URL("../src/"+file,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,URLSearchParams,require:name=>{assert(name in modules,name);return modules[name];}});return exports;
}
const activity=load("lib/activity.ts");
const filters=load("lib/activity-filters.ts");
const period={from:"2026-11-01",to:"2026-11-07",timezone:"Asia/Manila"};
const options={actors:[{id:"fixture",name:"Fixture staff"}],actions:["order.payment"]};
function field({label,hideLabel,hint,error,...props}) {void hideLabel;void hint;void error;return React.createElement("label",null,label,React.createElement("input",props));}
const {ActivityFilters}=load("components/admin-activity-filters.tsx",{react:React,"react/jsx-runtime":jsxRuntime,"next/navigation":{useRouter:()=>({push(){}}),usePathname:()=>"/admin/activity",useSearchParams:()=>null},"@/lib/activity":activity,"@/lib/activity-filters":filters,"@/components/ui/button":{Button:({children,...props})=>React.createElement("button",props,children)},"@/components/ui/field":{TextField:field,SelectField:({label,children,...props})=>React.createElement("label",null,label,React.createElement("select",props,children))}});
test("activity filters survive the serialized query boundary and preserve encoded values",()=>{
 const query=new URLSearchParams({staff:"fixture",search:"latte&cream",action:"order.payment",status:"failure",range:"custom",from:period.from,to:period.to}).toString();
 const html=renderToStaticMarkup(React.createElement(ActivityFilters,{options,query:JSON.parse(JSON.stringify(query)),period,today:period.to}));
 assert.match(html,/value="latte&amp;cream"/);assert.match(html,/value="fixture" selected=""/);assert.match(html,/value="2026-11-01"/);assert.match(html,/value="failure" selected=""/);
 const defaults=renderToStaticMarkup(React.createElement(ActivityFilters,{options,query:"",period,today:period.to,metrics:true}));
 assert.match(defaults,/value="30d" selected=""/);assert(!defaults.includes('id="activity-search"'));
});
test("both activity server pages send a plain query string to client filters",async()=>{
 const Filter=()=>null, Stub=()=>null;
 const metrics={period,staff_count:1,totals:{count:0,success:0,failure:0},by_actor:[],by_action:[],daily:[],weekly:[],monthly:[],recent:[]};
 for(const page of ["activity","performance"]){
  const paths=page==="activity"?["AdminPageHeader","ActivityFilters","AdminPagination","Badge","DataError"]:["AdminPageHeader","AdminStatCard","ActivityFilters","DataError","Badge","PeriodSummary"];
  const modules={"react/jsx-runtime":jsxRuntime,"@/lib/activity":activity,"@/lib/activity-filters":filters,"@/lib/format":{formatDateTime:v=>v},"@/lib/server-token":{getServerToken:async()=>"fixture"},"@/lib/api-client":{apiJson:async path=>path==="/activity/options"?options:path.startsWith("/activity/metrics")?metrics:{items:[],total:0,page:1,page_size:25,period}}};
  const imports={AdminPageHeader:"@/components/admin-page-header",AdminPagination:"@/components/admin-pagination",AdminStatCard:"@/components/admin-stat-card",ActivityFilters:"@/components/admin-activity-filters",Badge:"@/components/ui/badge",DataError:"@/components/ui/data-error",PeriodSummary:"./period-summary"};
  for(const name of paths)modules[imports[name]]={[name]:name==="ActivityFilters"?Filter:Stub};
  const loaded=load("app/admin/"+page+"/page.tsx",modules);
  const tree=await loaded.default({searchParams:Promise.resolve({staff:"fixture",from:period.from,to:period.to})});
  let found;
  function walk(node){if(!node)return;if(Array.isArray(node)){node.forEach(walk);return;}if(node.type===Filter)found=node.props;else if(node.props)walk(node.props.children);}
  walk(tree);assert(found,page+" filter present");assert.equal(typeof found.query,"string");assert.equal(new URLSearchParams(found.query).get("staff"),"fixture");
 }
});

test("period shortcuts use Manila days and validate inclusive calendar ranges",()=>{
 assert.equal(filters.activityToday(new Date("2026-11-06T15:59:59Z")),"2026-11-06");
 assert.equal(filters.activityToday(new Date("2026-11-06T16:00:00Z")),"2026-11-07");
 assert.deepEqual(JSON.parse(JSON.stringify(filters.activityRangeDates("2024-03-01","7d"))),{from:"2024-02-24",to:"2024-03-01"});
 assert.equal(filters.activityDateError("2024-02-29","2024-02-29"),null);
 assert.equal(filters.activityDateError("2023-02-29","2023-03-01"),"Enter valid calendar dates.");
 assert.equal(filters.activityDateError("2024-01-01","2024-12-31"),null);
 assert.match(filters.activityDateError("2024-01-01","2025-01-01"),/366/);
 assert.match(filters.activityDateError("2026-11-07","2026-11-01"),/on or after/);
 assert.match(filters.activityDateError("","2026-11-01"),/both dates/);
 const bookmarked=filters.readActivityFilters("range=7d&from=2024-02-24&to=2024-03-01","2026-11-07");
 assert.equal(bookmarked.range,"custom");assert.equal(bookmarked.from,"2024-02-24");
 const custom=filters.readActivityFilters("range=custom&from=2026-11-01&to=2026-11-07","2026-11-07");
 assert.equal(custom.range,"custom");
});
test("one scheduler cancels stale edits and reads the latest combined draft",()=>{
 let next=0,draft={search:"first",staff:""};const jobs=new Map(),applied=[];
 const clock={set:(fn,delay)=>{const id=++next;jobs.set(id,{fn,delay});return id;},clear:id=>jobs.delete(id)};
 const scheduler=filters.createActivityScheduler(()=>applied.push({...draft}),clock);
 scheduler.schedule(350);assert.equal(jobs.size,1);
 draft={search:"latest",staff:"selected"};scheduler.schedule(0);
 assert.equal(jobs.size,0);assert.deepEqual(applied,[{search:"latest",staff:"selected"}]);
 scheduler.schedule(400);assert.equal([...jobs.values()][0].delay,400);scheduler.cancel();assert.equal(jobs.size,0);
});
test("UI range stays in bookmarks and pagination but never reaches API filters",()=>{
 const search={range:"custom",staff:"fixture",from:period.from,to:period.to,page:"2",search:"latte&cream"};
 assert.equal(activity.activityDisplayQuery(search).get("range"),"custom");
 assert.equal(activity.activityDisplayQuery(search).get("page"),"2");
 assert.equal(activity.activityQuery(search).has("range"),false);
 const values=filters.readActivityFilters(activity.activityDisplayQuery(search).toString(),period.to);
 assert.equal(new URLSearchParams(filters.activityFilterQuery(values)).has("page"),false);
 assert.equal(new URLSearchParams(filters.activityFilterQuery(values,true)).has("search"),false);
});
