import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const compile=file=>ts.transpileModule(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function fixture(){const calls=[],routes=[];const make=(type,props)=>({type,props});const modules={
 'react':{useState:x=>[x,()=>{}]},'react/jsx-runtime':{jsx:make,jsxs:make},'next/link':{default:'link'},'next/navigation':{useRouter:()=>({push:path=>routes.push(path)})},'react-hot-toast':{default:{success:()=>{}}},
 '@/lib/cart-context':{useCart:()=>({addItem:(...args)=>calls.push(args)})},'@/lib/format':{formatPrice:value=>String(value)},'@/lib/sizes':{DEFAULT_SIZE:'M',priceForSize:value=>value,servingLabel:()=> 'Per drink',servingInfo:()=>({})},
 '@/components/star-rating':{RatingSummary:'rating'},'@/components/ui/product-image':{ProductImage:'image'},'@/components/ui/button':{Button:'button'},'@/components/favorite-button':{FavoriteButton:'favorite'},'@/components/ui/size-selector':{SizeSelector:'size'},'@/components/ui/quantity-stepper':{QuantityStepper:'quantity'},
 'next/server':{after:()=>{throw Error('Unexpected background work')}},'next/cache':{revalidatePath:()=>{}},'@/lib/server-token':{getServerToken:async()=>null},'@/lib/auth':{getCurrentUser:async()=>null},'@/lib/push-server':{},'@/lib/api-client':{apiJson:()=>{throw Error('Guest order reached API')}},
 };return{calls,routes,load(file){const exports={};vm.runInNewContext(compile(file),{exports,require:name=>{assert(name in modules,name);return modules[name];}});return exports;}};}
function nodes(tree){return Array.isArray(tree)?tree.flatMap(nodes):!tree||typeof tree!=='object'?[]:[tree,...nodes(tree.props?.children)];}
const item={id:'guest-drink',name:'Test drink',price:150,flavor:'Coffee',is_available:true,pricing_mode:'fixed',serving_label:'Per drink'};
test('guest card and detail order controls navigate to login without adding to cart',()=>{
 for(const [file,name]of [['components/menu-item-card.tsx','MenuItemCard'],['app/menu/[id]/add-to-cart.tsx','AddToCart']]){const f=fixture(),tree=f.load(file)[name]({item,isLoggedIn:false});const button=nodes(tree).find(x=>x.type==='button'&&x.props.children==='Log in to order');assert(button);button.props.onClick();assert.equal(f.calls.length,0);assert.equal(f.routes[0],'/login?next=%2Fmenu%2Fguest-drink');assert(!nodes(tree).some(x=>x.props?.children==='Buy now'));}
});
test('signed-in users retain add-to-cart and Buy now behavior',()=>{
 const f=fixture(),tree=f.load('app/menu/[id]/add-to-cart.tsx').AddToCart({item,isLoggedIn:true});nodes(tree).find(x=>x.props?.children==='Add to cart').props.onClick();assert.equal(f.calls.length,1);nodes(tree).find(x=>x.props?.children==='Buy now').props.onClick();assert.equal(f.calls.length,2);assert.equal(f.routes[0],'/checkout');
});
test('anonymous order server action stops before API or background work',async()=>{
 const f=fixture(),result=await f.load('app/actions/orders.ts').placeOrder({items:[],paymentMethod:'cash',orderType:'takeout',pickupNote:'',tableLabel:''});assert.equal(result.orderId,null);assert.match(result.error,/Log in/);
});
