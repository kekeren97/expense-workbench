'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const original={id:'BX-RETURNED',title:'杭州项目住宿',person:'林悦',dept:'运营管理部',category:'住宿费用',amount:480,date:'2026-10-20',status:'returned',issue:'缺少住宿明细',invoiceNo:'INV-ORIGINAL',company:'星澜能源科技有限公司',files:[{id:'original-file',name:'住宿发票.pdf',size:123}],note:'入住一晚',mine:true,history:[{text:'员工提交报销申请',date:'2026-10-21 09:00'},{text:'退回补充：缺少住宿明细',date:'2026-10-21 11:00'}]};
const previous={expenses:[original,{...original,id:'BX-OTHER',invoiceNo:'INV-OTHER',mine:false}],receipts:[],docs:[],logs:[],draft:null,knowledgeVersion:'2026.10-v2'};
function harness(initial){
 const listeners={},elements={},fields={},saved=[];
 const form={reportValidity:()=>true,elements:{namedItem(name){return fields[name]||(fields[name]={value:''});}}};
 const document={addEventListener(type,callback){(listeners[type]??=[]).push(callback);},getElementById(id){if(id==='expense-form')return form;return elements[id]??=(id==='detail'?{close(){this.closed=true;},addEventListener(){}}:{innerHTML:'',addEventListener(){}});}};
 class FormDataMock{constructor(source){this.source=source;}*[Symbol.iterator](){for(const [key,field]of Object.entries(fields))yield[key,field.value];}}
 const context=vm.createContext({console,crypto:require('node:crypto').webcrypto,Blob,URL,setTimeout,clearTimeout,FormData:FormDataMock,document,localStorage:{getItem:()=>JSON.stringify(initial),setItem:(key,value)=>saved.push(JSON.parse(value))}});
 for(const name of ['knowledge-data.js','knowledge-engine.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+name,'utf8').replace(/shell\(\);render\(\);\s*$/,''),context,{filename:name});
 const run=code=>vm.runInContext(code,context);
 run("navigate=next=>{view=next;};render=()=>{};toast=message=>{};");
 function click(action){for(const cb of listeners.click||[])cb({target:{closest:()=>({dataset:{action}})}});}
 return{run,click,fields,saved};
}
const h=harness(previous);
h.run("selectedId='BX-RETURNED';role='employee';");h.click('revise');
assert.equal(h.run('revisionId'),'BX-RETURNED');
assert.match(h.run('newPage()'),/取消补正，另开新单/);
assert.match(h.run('newPage()'),/正在补正原单 BX-RETURNED/);
assert(!h.run('newPage()').includes('data-action="sample-expense"'));
h.run('restoreForm()');h.fields.amount.value='380';h.fields.note.value='已补齐住宿明细，按标准更正金额';
assert.equal(h.run('precheck(collectExpense(),newFiles).length'),0,'original invoice is not considered a duplicate of itself');
assert.equal(h.run("precheck({...collectExpense(),invoiceNo:'INV-OTHER'},newFiles).length"),1,'another returned claim still counts as a duplicate');
h.click('save-draft');
const draft=h.saved.at(-1);
assert.equal(draft.draft.revisionId,'BX-RETURNED');assert.equal(draft.draft.values.amount,'380');assert.deepEqual(draft.draft.files,original.files);
const resumed=harness(draft);resumed.run('restoreForm()');
assert.equal(resumed.run('revisionId'),'BX-RETURNED');assert.equal(resumed.fields.amount.value,'380');
resumed.click('confirm-submit');
const after=resumed.saved.at(-1);const amended=after.expenses.find(row=>row.id==='BX-RETURNED');
assert.equal(after.expenses.length,2,'resubmission does not increase claim count');assert.equal(amended.status,'pending');assert.equal(amended.amount,380);assert.equal(amended.note,'已补齐住宿明细，按标准更正金额');assert.equal(amended.person,original.person);assert.equal(amended.mine,true);
assert.deepEqual(amended.history.slice(0,original.history.length),original.history);assert.equal(amended.history.length,original.history.length+2);assert.match(amended.history.at(-2).text,/补正后重新提交/);assert.equal(amended.issue,'');
assert.equal(after.draft,null);assert.equal(resumed.run('lastSubmitted'),'BX-RETURNED');assert.equal(resumed.run('revisionId'),null);assert.equal(resumed.run('newFiles.length'),0);assert.equal(resumed.run('Object.keys(formMemory).length'),0);
const cancelled=harness(draft);cancelled.click('cancel-revision');
assert.equal(cancelled.run('revisionId'),null);assert.equal(cancelled.run('state.draft'),null);assert.equal(cancelled.run('newFiles.length'),0);assert.equal(cancelled.run('Object.keys(formMemory).length'),0);assert.deepEqual(cancelled.saved.at(-1).expenses,previous.expenses);
assert(!cancelled.run('newPage()').includes('正在补正原单'));
const stale=structuredClone(draft);stale.expenses[0].status='approved';const staleForm=harness(stale);staleForm.run('restoreForm()');staleForm.click('confirm-submit');
assert.equal(staleForm.run('state.expenses[0].status'),'approved','a stale revision draft cannot reopen an already approved claim');assert.equal(staleForm.saved.length,0);
console.log('PASS: original-ID resubmission, preserved history/count, precise duplicate check, draft reload, explicit cancellation, and stale-state guard.');
