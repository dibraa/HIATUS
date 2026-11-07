import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
function load(file,modules) {
 const source=ts.transpileModule(readFileSync(new URL("../src/"+file,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(source,{exports,require:name=>{assert(name in modules,name);return modules[name];}});return exports;
}
test("optional dialog descriptions leave no empty paragraph or dangling ARIA reference",()=>{
 const {AdminDialog}=load("components/admin-dialog.tsx",{react:React,"react/jsx-runtime":jsxRuntime,"@/components/admin-icon":{AdminIcon:()=>React.createElement("svg",{"aria-hidden":true})}});
 const props={title:"Archived menu items",pending:false,onClose(){},children:React.createElement("table",null)};
 const plain=renderToStaticMarkup(React.createElement(AdminDialog,props));
 assert(!plain.includes('aria-describedby='));assert(!plain.includes('<p '));assert.match(plain,/Archived menu items/);
 const described=renderToStaticMarkup(React.createElement(AdminDialog,{...props,description:"Restores as unavailable."}));
 assert.match(described,/aria-describedby="([^"]+)"/);
 const id=described.match(/aria-describedby="([^"]+)"/)[1];assert(described.includes('id="'+id+'"'));assert.match(described,/Restores as unavailable/);
});
function signup(message) {
 const Button=({loading,size,variant,...props})=>{void loading;void size;void variant;return React.createElement("button",props);};
 const Field=({label,hint,error,hideLabel,...props})=>{void hideLabel;return React.createElement("label",null,label,React.createElement("input",props),hint,error);};
 const form=load("app/signup/signup-form.tsx",{
  react:{...React,useActionState:()=>[{error:null,success:message},()=>{},false]},"react/jsx-runtime":jsxRuntime,"next/navigation":{useRouter:()=>({push(){}})},
  "@/app/actions/auth":{signUp(){}},"@/components/ui/field":{PasswordField:Field,TextField:Field,FormError:()=>null},"@/components/ui/button":{Button},"@/components/google-sign-in":{GoogleSignIn:()=>null},"@/lib/use-authentication-options":{useAuthenticationOptions:()=>({options:{google_enabled:false,recaptcha_enabled:false},error:null})},
 });
 return renderToStaticMarkup(React.createElement(form.SignupForm,{authentication:{options:null,error:null}}));
}
test("signup removes only duplicate success copy and preserves meaningful additional guidance",()=>{
 const standard=signup("Your account was created successfully.");
 assert.match(standard,/Account created/);assert.match(standard,/Proceed to login/);assert(!standard.includes('Your account was created successfully.'));assert(!standard.includes('aria-describedby="signup-success-message"'));
 const detailed=signup("Check your inbox to finish setup.");assert.match(detailed,/Check your inbox to finish setup/);assert.match(detailed,/aria-describedby="signup-success-message"/);assert.match(detailed,/id="signup-success-message"/);
});
