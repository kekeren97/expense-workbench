'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sandbox = vm.createContext({ console });
for (const file of ['knowledge-data.js', 'knowledge-engine.js']) vm.runInContext(fs.readFileSync(path.join(root, 'dist', file), 'utf8'), sandbox, { filename: file });
const data = vm.runInContext('DEMO_KNOWLEDGE', sandbox);
const answer = (question, context) => sandbox.knowledgeAnswer(question, context);
let checks = 0;
function check(name, test) { test(); checks += 1; console.log(`✓ ${name}`); }
function cites(response, id) { assert(response.citations.some(citation => citation.clauseId === id), `${response.text}\nMissing citation ${id}`); }
function contains(response, expression) { assert.match(response.text, expression); }
function hasAmount(response, value) { assert(response.text.includes(String(value)), response.text); }
function hasNotAmount(response, value) { assert(!response.text.includes(String(value)), response.text); }
const first = answer('我去深圳出差，住宿费用多少？');
check('深圳住宿给出普通员工明确额度与制度引用', () => {
  assert.equal(first.resolved, true); contains(first, /450 元\/间·晚/); contains(first, /含税/); contains(first, /实际费用/); cites(first, 'TR-02');
  assert.equal(first.context.role, '普通员工'); assert.equal(first.context.city, '深圳');
});
const manager = answer('那部门经理呢', first.context);
check('职级追问继承深圳，切换经理额度', () => { contains(manager, /600 元\/间·晚/); assert.equal(manager.context.role, '部门经理'); assert.equal(manager.context.city, '深圳'); });
const nights = answer('住三晚呢', manager.context);
check('中文晚数追问按经理标准计算 1800 元', () => { contains(nights, /600 × 3 = 1800 元/); assert.equal(nights.context.nights, 3); });
check('默认普通员工三晚合计 1350 元', () => { contains(answer('住三晚呢', first.context), /450 × 3 = 1350 元/); });
check('普通员工深圳 600 元每晚超标 33.3%，引用特批流程', () => {
  const result = answer('深圳酒店600元一晚能报吗？'); contains(result, /超过标准 150 元\/晚（33.3%）/); contains(result, /分管副总 \+ 财务负责人/); cites(result, 'TR-03');
});
check('恰好超标 20% 适用部门经理特批边界', () => { const result = answer('深圳住宿540元每晚能报吗？'); contains(result, /20.0%/); contains(result, /部门经理 \+ 财务负责人/); });
check('总价除以晚数并提示逐晚核对', () => { const result = answer('深圳住宿住3晚，总共1500元能报吗？'); contains(result, /1500 元 ÷ 3 晚/); contains(result, /500 元\/晚/); contains(result, /11.1%/); contains(result, /逐晚/); contains(result, /部门经理 \+ 财务负责人/); });
check('金额没有每晚或总额信息时追问', () => { const result = answer('深圳住宿600元能报吗？'); assert.equal(result.resolved, false); contains(result, /每晚房价还是全部住宿总额/); });
check('住宿没有城市时列出分档并待澄清', () => { const result = answer('出差住宿多少钱？'); assert.equal(result.resolved, false); contains(result, /450/); contains(result, /380/); contains(result, /300/); });
check('未知城市不冒充 C 类', () => { const result = answer('我去火星出差，住宿多少钱？'); assert.equal(result.resolved, false); contains(result, /无法确认/); hasNotAmount(result, '300 元/间'); });
check('已知其他大陆城市应用 C 类', () => { const result = answer('我去洛阳出差，住宿多少钱？'); assert.equal(result.resolved, true); contains(result, /300 元\/间·晚/); });
check('港澳台及境外不会套用大陆标准', () => { for (const city of ['香港', '澳门', '台北', '东京', '新加坡']) { const result = answer(`去${city}出差住宿多少钱？`); assert.equal(result.resolved, false); contains(result, /不能直接套用/); } });
check('城市词不会把天气问题误判为住宿', () => { assert.equal(answer('深圳天气多少钱？').resolved, false); assert.equal(answer('那深圳天气呢', first.context).resolved, false); });
check('当天早餐已提供，扣 20 后餐补 80 元', () => { const result = answer('酒店含早餐，餐补还剩多少？'); contains(result, /扣减 20 元/); contains(result, /80 元\/天/); cites(result, 'ME-02'); });
check('多天餐次不明确不默认每天提供', () => { const result = answer('出差3天，提供了午餐，餐补多少？'); assert.equal(result.resolved, false); contains(result, /300 元/); contains(result, /提供了几天或几餐/); hasNotAmount(result, '180 元'); });
check('每天提供午餐时明确算出三天 180 元', () => { const result = answer('出差3天，每天提供午餐，餐补多少？'); assert.equal(result.resolved, true); contains(result, /180 元/); });
check('招待客户与餐补使用不同规则', () => { const result = answer('招待客户吃饭标准多少？'); contains(result, /200 元\/人·次/); cites(result, 'HO-01'); assert(!result.citations.some(citation => citation.clauseId === 'ME-01')); });
check('普通员工、高管分别对应二等座和一等座', () => { const regular = answer('高铁一等座可以报销吗？'); contains(regular, /按普通员工.*二等座/); const executive = answer('那公司高管呢', regular.context); contains(executive, /按公司高管.*一等座/); cites(executive, 'TR-04'); });
check('私车里程补贴含油费，不重复报销', () => { const result = answer('私车公用100公里能报多少？'); contains(result, /120 元/); contains(result, /油费不得重复报销/); cites(result, 'TR-06'); });
check('打车凭证规则使用行程附件条款', () => { const result = answer('打车报销需要附行程单吗？'); cites(result, 'TR-05'); contains(result, /行程/); });
check('发票信息使用虚构公司与明确演示税号', () => { const result = answer('发票抬头和税号是什么？'); contains(result, /星澜能源科技有限公司/); contains(result, /DEMO-TAX-20261001/); cites(result, 'IN-01'); });
check('发票开错明确错误票据规则', () => { const result = answer('发票抬头开错了怎么办？'); cites(result, 'IN-03'); });
check('审批上下边界与配置保持一致', () => {
  for (const amount of [1999, 2000, 2001, 8000, 9999, 10000, 10001]) {
    const rule = data.approval.find(item => item.max === null || amount <= item.max), result = answer(`报销${amount}元需要谁审批？`);
    contains(result, new RegExp(`单笔报销 ${amount} 元，审批链为：${rule.chain.join(' → ')}。`)); cites(result, 'AP-01');
  }
});
check('出差前审批指向申请规则', () => { cites(answer('出差前需要哪些审批？'), 'TR-01'); });
check('发票税务判断不会伪称知识库已有答案', () => { assert.equal(answer('发票增值税抵扣税率是多少？').resolved, false); });
check('不支持的问题标记待人工答复', () => { const result = answer('帮我写一首关于太空的诗'); assert.equal(result.resolved, false); assert.equal(result.citations.length, 0); });
check('所有输出引文能精确定位存在的源条款', () => {
  const questions = ['深圳住宿多少钱', '深圳住宿600元一晚能报吗', '餐补标准', '业务招待标准', '发票抬头', '发票材料', '发票开错', '报销2000元谁审批', '预算不足怎么办', '办公用品怎么采购', '外部培训', '出差结束多久提交报销', '报销多久付款', '借款如何结清', '报销被退回怎么办', '出差前需要审批吗', '打车要行程单吗', '私车公用100公里', '高铁一等座'];
  for (const question of questions) {
    const result = answer(question); assert(result.text, question);
    for (const citation of result.citations) { const doc = data.docs.find(item => item.id === citation.docId); assert(doc, citation.docId); const clause = doc.clauses.find(item => item.id === citation.clauseId); assert(clause, citation.clauseId); assert.equal(clause.title, citation.title); }
    if (result.resolved) assert(result.citations.length, question);
  }
});
check('搜索支持条款号、城市与标签', () => { assert.equal(sandbox.knowledgeSearch('TR-02')[0].clauseId, 'TR-02'); assert(sandbox.knowledgeSearch('住宿').some(clause => clause.clauseId === 'TR-02')); });
check('单份及全库 Markdown 包含完整源文', () => {
  const one = sandbox.knowledgeMarkdown('kb-travel'); const all = sandbox.knowledgeMarkdown();
  for (const clause of data.docs.find(doc => doc.id === 'kb-travel').clauses) { assert(one.includes(clause.id)); assert(one.includes(clause.body)); }
  assert(one.includes(data.company)); assert(one.includes(data.disclaimer)); assert(!one.includes('### ME-01'));
  for (const doc of data.docs) for (const clause of doc.clauses) assert(all.includes(clause.body));
});
check('审批人称谓不会覆盖员工职级', () => { for (const question of ['深圳住宿超标需要部门经理审批吗？', '住宿超标需要部门经理和财务负责人批准吗？', '深圳住宿要分管副总审批吗？']) { const result = answer(question, first.context); assert.equal(result.context.role, '普通员工'); } });
check('日期中的数字不当作住宿房价', () => { const result = answer('2026年10月22日去深圳出差，住宿多少钱？'); contains(result, /450 元\/间·晚/); assert(!result.text.includes('超过标准')); });
check('重点城市与高管标准按数据计算', () => { contains(answer('公司高管去杭州出差住宿多少钱？'), /650 元\/间·晚/); });
check('中文三十晚正常换算', () => { contains(answer('住三十晚呢', first.context), /450 × 30 = 13500 元/); });
check('不含早餐不会扣早餐补贴', () => { const result = answer('酒店不含早餐，餐补多少？'); assert.equal(result.resolved, true); assert(!result.text.includes('剩余餐补 80')); });
check('海外餐补不套用大陆标准', () => { const result = answer('去东京出差，餐补每天多少？'); assert.equal(result.resolved, false); cites(result, 'TR-08'); });
check('停车通行费使用私车条款，避免套用80元市内限额', () => { const result = answer('停车费和过路费可以报销吗？'); cites(result, 'TR-06'); contains(result, /不占用/); });
check('合住不叠加人员住宿上限', () => { const result = answer('两个人合住酒店可以把标准相加吗？'); cites(result, 'TR-07'); contains(result, /不得把同住人的住宿上限相加/); });
check('未覆盖的加班和夜班补贴不套用出差餐补', () => {
  for (const question of ['加班餐补多少钱？', '夜班餐补每天多少？', '通讯补贴多少钱？', '驻外津贴标准是多少？']) {
    const result = answer(question); assert.equal(result.resolved, false); cites(result, 'ME-05');
    contains(result, /不应套用每日100元餐补/); assert(!result.citations.some(citation => citation.clauseId === 'ME-01'));
  }
});
check('借款审批保留专项财务负责人批准，并区分后续报销金额审批', () => {
  const result = answer('借款3000元要谁审批？'); assert.equal(result.resolved, true); cites(result, 'PR-03'); cites(result, 'AP-01');
  contains(result, /直属负责人、部门经理及财务负责人批准/); contains(result, /后续实际报销金额为 3000 元/); contains(result, /借款金额不等于最终可报销金额/);
});
check('培训审批保留人力资源和超过3000元的专项批准', () => {
  for (const amount of [3000, 4000]) {
    const result = answer(`培训${amount}元需要谁审批？`); assert.equal(result.resolved, true); cites(result, 'PU-02'); cites(result, 'AP-01');
    contains(result, /部门经理及人力资源负责人批准/); contains(result, /超过3,000元时，另需财务负责人事前批准/); contains(result, /3,000元整无需该额外批准/);
    contains(result, new RegExp(`本次报销金额为 ${amount} 元`));
  }
});
check('采购问题也保留专项采购批准和金额审批', () => { const result = answer('办公采购5000元需要谁审批？'); cites(result, 'PU-01'); cites(result, 'AP-01'); contains(result, /至少3家可比报价/); });
check('多城市明确方向时按目的地而非出发地核定住宿', () => {
  for (const question of ['我从北京去杭州出差，住宿标准多少？', '从北京到杭州，住宿多少钱？', '我从香港去杭州出差，住宿多少钱？']) {
    const result = answer(question); assert.equal(result.resolved, true); assert.equal(result.context.city, '杭州'); contains(result, /380 元\/间·晚/); cites(result, 'TR-02');
  }
  const overseas = answer('从北京去东京出差住宿多少钱？'); assert.equal(overseas.resolved, false); assert.equal(overseas.context.city, '东京'); cites(overseas, 'TR-08');
});
check('多个城市未明确住宿目的地时追问并不沿用旧城市', () => {
  for (const question of ['北京和杭州出差住宿标准是多少？', '北京、杭州住宿费用多少？', '去北京和杭州出差住宿多少钱？', '先去北京，再去杭州，住宿多少钱？']) {
    const result = answer(question, first.context); assert.equal(result.resolved, false); assert.equal(result.context.city, ''); contains(result, /请确认实际住宿目的地/); cites(result, 'TR-02');
  }
});
console.log(`\nKnowledge checks passed: ${checks}`);
