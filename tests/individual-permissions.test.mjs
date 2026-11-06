import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
const catalog = JSON.parse(readFileSync(new URL("../src/lib/permission-catalog.json", import.meta.url),"utf8"));
function load(file, modules = {}, globals = {}) {
 const code = ts.transpileModule(readFileSync(new URL("../src/"+file,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,...globals,require:name=>{assert(name in modules,name);return modules[name];}});return exports;
}
const permission = load("lib/permissions.ts",{"./permission-catalog.json":catalog});
const policy = load("lib/request-permissions.ts");
test("restricted workspace landing respects individual views and handles no-access accounts",()=>{
 assert.equal(permission.firstAllowed("staff",["availability.view"]),"/staff/menu");
 assert.equal(permission.firstAllowed("admin",["users.view"]),"/admin/team");
 assert.equal(permission.firstAllowed("staff",[]),"/access-denied");
 assert.deepEqual([...permission.pagePermission("/admin/reports","refunds")],["reports.view","finance.view"]);
 assert.deepEqual([...permission.pagePermission("/admin/orders/fixture/receipt")],["orders.view|finance.view"]);
});
test("UI permission boundaries hide forbidden actions and retain read-only forms",()=>{
 const controls=load("components/permission-controls.tsx",{react:React,"react/jsx-runtime":jsxRuntime});
 const Edit=controls.withPermission("menu.edit",()=>React.createElement("button",null,"Edit menu"));
 const Settings=controls.withPermission("settings.edit",()=>React.createElement("input",{defaultValue:"Saved shop"}),true);
 const html=renderToStaticMarkup(React.createElement(controls.PermissionProvider,{permissions:["menu.view","settings.view"]},React.createElement(React.Fragment,null,React.createElement(Edit),React.createElement(Settings))));
 assert(!html.includes("Edit menu"));assert.match(html,/<fieldset disabled=""/);assert.match(html,/Saved shop/);
});
test("server-side API preflight blocks denied mutations before forwarding the request",async()=>{
 const calls=[];
 const api=load("lib/api-client.ts",{"./request-permissions":policy},{process:{env:{NEXT_PUBLIC_API_URL:"http://fixture/api"}},FormData,URLSearchParams,fetch:async(url,options)=>{
  calls.push({url,options});return {ok:true,json:async()=>({role:"staff",permissions:["counter.view"]})};
 }});
 await assert.rejects(api.apiJson("/orders/fixture/payment",{method:"POST",token:"fixture",body:JSON.stringify({amount:100})}),/do not have permission/);
 assert.equal(calls.length,1);assert.match(calls[0].url,/auth\/me$/);
});
test("browser and backend request policies agree for protected operations",async()=>{
 const {createRequire}=await import("node:module");const require=createRequire(import.meta.url);const backend=require("../../server/src/security/permissions.js");
 for(const [path,method,role,body] of [["/admin/team/1/permissions","PUT","admin",{}],["/menu/archived","GET","admin",{}],["/menu/1/archive","POST","admin",{}],["/orders/1/payment","POST","staff",{kind:"refund"}],["/orders/1/payment","POST","staff",{kind:"void"}],["/admin/finance/export","GET","admin",{view:"refunds"}],["/settings/credentials/smtp","PUT","admin",{}],["/menu","GET","admin",{paginated:"true"}]]) assert.deepEqual([...policy.required(path,method,role,body)],backend.required(path,method,role,body));
});
