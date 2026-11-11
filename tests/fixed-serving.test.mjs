import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../src/lib/sizes.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const sizes={};vm.runInNewContext(source,{exports:sizes});
test('fixed serving uses printed price and label while legacy sizes remain unchanged',()=>{
 assert.equal(sizes.priceForSize(380,'M',{S:100,M:20,L:200},'fixed'),380);assert.equal(sizes.priceForSize(380,'S',{S:-15},'fixed'),380);
 assert.equal(sizes.servingLabel({pricing_mode:'fixed',item_type:'food',serving_label:'2–3 persons'},'M'),'2–3 persons');assert.equal(sizes.servingLabel({serving_label:'22 oz'},'M'),'22 oz');
 assert.equal(sizes.servingLabel({},'S'),'Small');assert.equal(sizes.priceForSize(100,'S',{S:-15}),85);assert.equal(sizes.priceForSize(100,'L',{L:25}),125);
});
test('fixed metadata survives the cart storage migration',()=>{
 const cartSource=ts.transpileModule(readFileSync(new URL('../src/lib/cart-context.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('function migrateStoredLines(raw) {','exports.migrateStoredLines = migrateStoredLines;\nfunction migrateStoredLines(raw) {');
 const exports={};vm.runInNewContext(cartSource,{exports,require(name){if(name==='react')return{createContext:()=>({})};if(name==='react/jsx-runtime')return{};if(name==='./integration-client')return{};if(name==='@/lib/sizes')return sizes;throw Error(name);}});
 const [line]=exports.migrateStoredLines([{menuItemId:'fixed',name:'Noodles',price:380,quantity:2,size:'L',pricing_mode:'fixed',serving_label:'2–3 persons',item_type:'food'}]);assert.equal(line.size,'M');assert.equal(line.serving_label,'2–3 persons');assert.equal(line.item_type,'food');assert.equal(line.price,380);
 const [old]=exports.migrateStoredLines([{menuItemId:'old',name:'Latte',price:85,quantity:1,size:'S'}]);assert.equal(old.size,'S');assert.equal(old.pricing_mode,'sized');
});
