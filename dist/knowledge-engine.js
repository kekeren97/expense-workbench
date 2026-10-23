/* Local, source-backed rules for the fictional demo company. No network or model calls. */
const ExpenseKnowledgeEngine = (() => {
  'use strict';
  const cnDigits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const numberPattern = '[0-9]+(?:\\.[0-9]+)?|[零〇一二两三四五六七八九十百千]+';
  const mainlandOthers = '洛阳 焦作 桂林 惠州 中山 江门 汕头 湛江 茂名 肇庆 清远 韶关 梅州 汕尾 河源 阳江 潮州 揭阳 云浮 保定 唐山 廊坊 沧州 邯郸 邢台 秦皇岛 承德 张家口 衡水 雄安 大同 晋中 长治 运城 临汾 晋城 阳泉 吕梁 忻州 朔州 包头 鄂尔多斯 呼伦贝尔 赤峰 通辽 鞍山 抚顺 本溪 丹东 锦州 营口 阜新 辽阳 盘锦 铁岭 朝阳 葫芦岛 吉林 四平 辽源 通化 白山 松原 白城 延吉 齐齐哈尔 牡丹江 大庆 佳木斯 黑河 绥化 伊春 鹤岗 鸡西 双鸭山 七台河 徐州 常州 南通 连云港 淮安 盐城 扬州 镇江 泰州 宿迁 嘉兴 湖州 绍兴 金华 衢州 舟山 台州 丽水 温州 芜湖 蚌埠 淮南 马鞍山 淮北 铜陵 安庆 黄山 滁州 阜阳 宿州 六安 亳州 池州 宣城 莆田 三明 泉州 漳州 南平 龙岩 宁德 景德镇 萍乡 九江 新余 鹰潭 赣州 吉安 宜春 抚州 上饶 淄博 枣庄 东营 烟台 潍坊 济宁 泰安 威海 日照 临沂 德州 聊城 滨州 菏泽 开封 平顶山 安阳 鹤壁 新乡 濮阳 许昌 漯河 三门峡 南阳 商丘 信阳 周口 驻马店 济源 黄石 十堰 宜昌 襄阳 鄂州 荆门 孝感 荆州 黄冈 咸宁 随州 恩施 仙桃 潜江 天门 株洲 湘潭 衡阳 邵阳 岳阳 常德 张家界 益阳 郴州 永州 怀化 娄底 湘西 柳州 梧州 北海 防城港 钦州 贵港 玉林 百色 贺州 河池 来宾 崇左 儋州 琼海 文昌 万宁 五指山 东方 乐东 陵水 自贡 攀枝花 泸州 德阳 绵阳 广元 遂宁 内江 乐山 南充 眉山 宜宾 广安 达州 雅安 巴中 资阳 阿坝 甘孜 凉山 六盘水 遵义 安顺 毕节 铜仁 黔西南 黔东南 黔南 曲靖 玉溪 保山 昭通 丽江 普洱 临沧 楚雄 红河 文山 西双版纳 大理 德宏 怒江 迪庆 日喀则 昌都 林芝 山南 那曲 阿里 铜川 宝鸡 咸阳 渭南 延安 汉中 榆林 安康 商洛 嘉峪关 金昌 白银 天水 武威 张掖 平凉 酒泉 庆阳 定西 陇南 临夏 甘南 海东 海北 黄南 海南州 果洛 玉树 海西 石嘴山 吴忠 固原 中卫 克拉玛依 吐鲁番 哈密 昌吉 博尔塔拉 巴音郭楞 阿克苏 克孜勒苏 喀什 和田 伊犁 塔城 阿勒泰 石河子'.split(' ');
  const overseasPattern = /香港|澳门|台湾|台北|高雄|境外|国外|海外|新加坡|东京|大阪|京都|首尔|釜山|纽约|洛杉矶|旧金山|伦敦|巴黎|柏林|悉尼|墨尔本|曼谷|吉隆坡|迪拜|美国|日本|韩国|英国|法国|德国|澳大利亚|加拿大|泰国|马来西亚|越南|欧洲|非洲/;
  const topicLabels = { lodging: '差旅住宿标准', meals: '差旅餐补', hospitality: '业务招待', transport: '交通报销', invoice: '发票规范', approval: '审批权限', process: '报销时限', purchase: '采购与培训', travel: '出差申请' };
  function corpus() { return typeof DEMO_KNOWLEDGE === 'undefined' ? { docs: [], roles: ['普通员工', '部门经理', '公司高管'], lodgingTiers: [] } : DEMO_KNOWLEDGE; }
  function list() { return (corpus().docs || []).flatMap(doc => (doc.clauses || []).map(clause => ({ docId: doc.id, clauseId: clause.id, title: clause.title, body: clause.body, tags: clause.tags || [], docTitle: doc.title, category: doc.category }))); }
  function byId(id) { return list().find(clause => clause.clauseId === id); }
  function textOf(ids) { return ids.map(id => byId(id)?.body).filter(Boolean).join('\n\n'); }
  function asNumber(value) {
    if (!value) return null;
    if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
    let total = 0, current = 0;
    for (const character of value) {
      if (Object.hasOwn(cnDigits, character)) current = cnDigits[character];
      else { const unit = { 十: 10, 百: 100, 千: 1000 }[character]; if (!unit) return null; total += (current || 1) * unit; current = 0; }
    }
    return total + current;
  }
  function numberMatch(query, expression) { const match = query.match(expression); return match ? asNumber(match[1]) : null; }
  function money(value) { return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''); }
  function tiers() {
    const source = corpus().lodgingTiers || [];
    return (Array.isArray(source) ? source : Object.entries(source).map(([key, value]) => ({ id: key, ...value }))).map((tier, index) => ({ ...tier, id: tier.id || tier.code || ['A', 'B', 'C'][index], cities: tier.cities || [], rates: tier.rates || [] }));
  }
  function roleFrom(query, previous) {
    const previousRole = corpus().roles?.includes(previous) ? previous : '普通员工';
    const explicitRole = /(?:我是|我现在是|我的职级[是为]|职级[是为]|作为|按|那(?:么)?|换成|改成|如果是)\s*(?:普通员工|部门经理|公司高管|高管|经理|总经理|副总)/.test(query);
    if (/审批|批准/.test(query) && !explicitRole) return previousRole;
    if (/公司高管|高管|总经理|副总/.test(query) && !/(?:高管|总经理|副总).{0,5}(?:审批|批准)|审批.*(?:高管|总经理|副总)/.test(query)) return '公司高管';
    if (/部门经理|部门负责人|我是经理|那经理|经理呢/.test(query) && !/(?:部门经理|部门负责人).{0,5}(?:审批|批准)|(?:找|由)部门经理|审批.*部门经理/.test(query)) return '部门经理';
    if (/普通员工|一般员工|基层员工/.test(query)) return '普通员工';
    return corpus().roles?.includes(previous) ? previous : '普通员工';
  }
  function cityInfo(query, previous) {
    const known = [...new Set([...tiers().flatMap(tier => tier.cities), ...mainlandOthers])].filter(city => typeof city === 'string' && !/其他|大陆/.test(city)).sort((a, b) => b.length - a.length);
    const overseas = [...query.matchAll(new RegExp(overseasPattern.source, 'g'))].map(match => match[0]);
    const mentioned = [...new Set([...known.filter(city => query.includes(city)), ...overseas])];
    const stated = query.match(/(?:城市是|目的地是|城市为|目的地为)\s*([\u4e00-\u9fffA-Za-z]{2,12}?)(?:市)?(?=[，,。！？?\s]|出差|住宿|$)/)?.[1];
    const directions = [...query.matchAll(/(?:前往|去往|去|到)\s*([\u4e00-\u9fffA-Za-z]{2,12}?)(?:市)?(?=出差|的住宿|住酒店|住宿|入住|[，,。！？?\s]|$)/g)].map(match => match[1]);
    const directionalNames = mentioned.filter(city => new RegExp('(?:前往|去往|去|到)\\s*' + city + '(?:市)?').test(query));
    const destinations = [...new Set([...directions, ...directionalNames])];
    const compoundDestination = destinations.some(city => mentioned.filter(name => city.includes(name)).length > 1);
    if (!stated && (destinations.length > 1 || compoundDestination || (!destinations.length && mentioned.length > 1))) return { city: '', tier: null, ambiguous: true, cities: mentioned };
    let explicit = stated || destinations[0] || null;
    if (!explicit && !mentioned.length) {
      explicit = query.match(/在\s*([\u4e00-\u9fffA-Za-z]{2,10}?)(?:市)?(?:出差|的住宿|住酒店|住宿|入住)/)?.[1] || null;
      const followup = query.match(/^那?([\u4e00-\u9fff]{2,6}?)(?:市)?(?:呢|住宿多少钱|住宿标准)[？?]?$/);
      if (!explicit && followup && !/经理|员工|高管|住宿|费用|餐补|出差|公司|住|晚|天|元|餐|公里|多少|这样|这个|那个/.test(followup[1])) explicit = followup[1];
    }
    const city = explicit || mentioned[0] || (previous || '').replace(/市$/, '');
    if (!city) return { city: '', tier: null };
    if (overseasPattern.test(city)) return { city, tier: null, outside: true };
    const tier = tiers().find(item => item.cities.includes(city)) || ((mainlandOthers.includes(city) || /^(其他中国大陆城市|其他大陆城市|其他城市|中国大陆其他城市)$/.test(city)) ? tiers().find(item => item.id === 'C') : null);
    return { city, tier, unknown: !tier };
  }
  function nightsIn(query) {
    const explicit = numberMatch(query, new RegExp('(?:住了?|住宿|入住|连住|共住)\\s*(' + numberPattern + ')\\s*(?:晚|夜)'));
    if (explicit !== null) return explicit;
    for (const match of query.matchAll(new RegExp('(' + numberPattern + ')\\s*(?:晚|夜)', 'g'))) {
      const before = query.slice(0, match.index);
      if (!/[每/\d元块]$/.test(before) && !/[一]$/.test(before)) return asNumber(match[1]);
    }
    return null;
  }
  function daysIn(query) { return numberMatch(query, new RegExp('(' + numberPattern + ')\\s*天')); }
  function lodgingAmount(query) {
    let value = numberMatch(query, new RegExp('(?:每晚|一晚|每间每晚|每间晚|每晚房费|每晚费用|每晚房价)(?:是|为|要|花费|花了|共|\\s)*(' + numberPattern + ')(?:元|块)?'));
    if (value === null) value = numberMatch(query, new RegExp('(' + numberPattern + ')\\s*(?:元|块)?\\s*(?:/晚|/间.?晚|一晚|每晚|元每晚)'));
    if (value !== null) return { value, kind: 'nightly' };
    value = numberMatch(query, new RegExp('(?:总共|一共|总计|合计|总价|总额|总费用|共花了|共花|花了|共计|总共花费|共)\\s*(' + numberPattern + ')\\s*(?:元|块)?'));
    if (value === null) value = numberMatch(query, new RegExp('(' + numberPattern + ')\\s*(?:元|块)?(?:总共|总价|总额|的总费用)'));
    if (value !== null) return { value, kind: 'total' };
    value = numberMatch(query, new RegExp('(' + numberPattern + ')\\s*(?:元|块)'));
    return value !== null ? { value, kind: 'ambiguous' } : null;
  }
  function amountIn(query) {
    const currency = query.match(/(?:¥|￥)\s*([\d,]+(?:\.\d+)?)/) || query.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:元|块)/);
    if (currency) return Number(currency[1].replace(/,/g, ''));
    const candidate = query.match(/(?:报销|金额|费用|采购|付款|审批|预算)(?:金额|是|为|共|总计|合计|达|到|满|超过|不超过|未超过|\s)*(\d+(?:\.\d+)?)(?!\d*[-年月日])/);
    if (candidate) return Number(candidate[1]);
    const beforeApproval = query.match(/(\d+(?:\.\d+)?)\s*(?:谁|需要谁|怎么|如何|要谁)?审批/);
    return beforeApproval ? Number(beforeApproval[1]) : null;
  }
  function result(topic, text, ids, context, resolved = true, suggestions = []) {
    const citations = [...new Set(ids)].map(byId).filter(Boolean).map(({ docId, clauseId, title }) => ({ docId, clauseId, title }));
    return { topic: topicLabels[topic] || topic, text, source: citations.length ? citations.map(citation => `${list().find(item => item.clauseId === citation.clauseId)?.docTitle} · ${citation.clauseId} ${citation.title}`).join('；') : '现有演示制度未覆盖 · 待人工确认', resolved: resolved && citations.length > 0, citations, context: { ...context, lastTopic: topic }, suggestions };
  }
  function lodging(query, context, info) {
    const roleIndex = corpus().roles.indexOf(context.role);
    const next = { ...context, city: info.city };
    const explicitNights = nightsIn(query);
    const nights = explicitNights === null ? (context.lastTopic === 'lodging' ? context.nights : null) : explicitNights;
    if (nights) next.nights = nights;
    const ids = ['TR-02'];
    if (info.ambiguous) return result('lodging', `问题中提到了${info.cities.join('、')}，请确认实际住宿目的地；多个城市的住宿应按各自城市逐晚核定。当前按${context.role}，我暂不选用其中任何一个城市的额度。`, ids, next, false, info.cities.slice(0, 3).map(city => `${city}住宿标准多少？`));
    if (info.outside) return result('lodging', `${info.city}属于境外或港澳台差旅，现有制度中的 A / B / C 类住宿标准只适用于中国大陆，不能直接套用。请在预订前由财务确认适用额度与审批安排。`, ['TR-08'], next, false, ['中国大陆住宿标准是什么？', '出差前需要哪些审批？']);
    if (info.unknown) return result('lodging', `暂时无法确认“${info.city}”所属的住宿城市档位。请补充准确的中国大陆城市名称；明确属于其他中国大陆城市后，才可适用 C 类标准。当前职级按${context.role}。`, ids, next, false, ['深圳住宿多少钱？', '杭州住宿多少钱？', '其他中国大陆城市住宿标准']);
    if (!info.tier) {
      const table = tiers().map(tier => `${tier.id} 类${tier.id === 'A' ? '（北京、上海、广州、深圳）' : tier.id === 'B' ? '（杭州、南京、成都等制度列明城市）' : '（其他中国大陆城市）'}：${money(tier.rates[roleIndex])} 元/间·晚`).join('\n');
      return result('lodging', `请补充出差城市，我就能给出对应额度。当前按${context.role}：\n${table}\n\n以上均为含税上限，凭合规发票按实际发生费用报销，不按上限发放补贴。`, ids, next, false, ['深圳住宿多少钱？', '杭州住宿多少钱？', '桂林住宿多少钱？']);
    }
    const limit = info.tier.rates[roleIndex];
    let answer = `${info.city}属于 ${info.tier.id} 类城市。按${context.role}，住宿上限为 ${money(limit)} 元/间·晚（含税），凭合规发票按实际费用报销，未花满不补差额。`;
    if (nights && nights > 0 && nights <= 365) answer += `\n\n住 ${nights} 晚、1 间房的标准上限合计为 ${money(limit)} × ${nights} = ${money(limit * nights)} 元；实际报销仍须逐晚符合标准。`;
    const quoted = lodgingAmount(query);
    let nightly = quoted?.kind === 'nightly' ? quoted.value : null;
    if (quoted?.kind === 'total') {
      if (!nights || nights <= 0) return result('lodging', `${answer}\n\n你提供的 ${money(quoted.value)} 元是总费用，还需要住宿晚数和逐晚房价，才能核对是否超标。`, ids, next, false, ['住三晚呢', '每晚600元能报吗？']);
      nightly = quoted.value / nights;
      answer += `\n你提供的总费用 ${money(quoted.value)} 元 ÷ ${nights} 晚，平均为 ${money(nightly)} 元/晚；平均数只用于初步测算，逐晚房价可能不同，须以酒店明细逐晚核对。`;
    }
    if (quoted?.kind === 'ambiguous') return result('lodging', `${answer}\n\n请确认 ${money(quoted.value)} 元是每晚房价还是全部住宿总额；如果是总额，请同时提供晚数。`, ids, next, false, ['每晚600元能报吗？', '住3晚，总共1500元能报吗？']);
    if (nightly !== null) {
      if (nightly > limit) {
        const excess = nightly - limit, percent = excess / limit * 100;
        ids.push('TR-03');
        const approvers = percent <= 20 + 1e-9 ? '部门经理 + 财务负责人' : '分管副总 + 财务负责人';
        answer += `\n\n${quoted.kind === 'total' ? '按平均房价测算，' : ''}${money(nightly)} 元/晚超过标准 ${money(excess)} 元/晚（${percent.toFixed(1)}%）。${percent <= 20 + 1e-9 ? '超标不超过 20%' : '超标超过 20%'}，须在预订前取得${approvers}的书面特批，并随报销提交必要性说明和价格证明。未获特批时，超出标准部分个人承担；不能直接按超标金额承诺报销。`;
      } else answer += `\n\n${money(nightly)} 元/晚${nightly === limit ? '等于' : '低于'}标准，额度层面符合要求；还需有效出差审批、合规发票与住宿明细。${quoted.kind === 'total' ? '平均不超标不代表每晚均合规，请核对逐晚价格。' : ''}`;
    } else if (/超标|超过|超出|特批|例外/.test(query)) {
      ids.push('TR-03');
      answer += `\n\n确需超标时，预订前先书面特批：超标不超过 20%（本标准 ${money(limit * 1.2)} 元/晚以内），由部门经理 + 财务负责人批准；超过 20%，由分管副总 + 财务负责人批准。附必要性说明和价格证明；未获特批的超额部分由个人承担。`;
    }
    return result('lodging', answer, ids, next, true, ['那部门经理呢', '住三晚呢', '每晚600元能报吗？']);
  }
  function meals(query, context) {
    const policy = corpus().meals;
    const days = daysIn(query) ?? (context.lastTopic === 'meals' ? context.days : null) ?? 1;
    const mealQuery = query.replace(/(?:不|未|没有)(?:提供|供应|供|包含|含|包)(?:[早午晚]餐|[早午晚]饭|早)/g, '');
    const supplied = /提供|包[早午晚餐]|含早|含[午晚]餐|已供|统一安排|免费|管饭|含餐/.test(mealQuery);
    const types = supplied ? [['早餐', policy.breakfast, /早餐|早饭|含早|包早/], ['午餐', policy.lunch, /午餐|午饭|中餐|中饭|包午/], ['晚餐', policy.dinner, /晚餐|晚饭|包晚/]].filter(([, , expression]) => expression.test(mealQuery)) : [];
    let answer = `${context.role}出差餐补统一为 ${policy.daily} 元/天，按批准的实际出差自然日计算。早餐 ${policy.breakfast} 元、午餐 ${policy.lunch} 元、晚餐 ${policy.dinner} 元。`;
    const ids = ['ME-01'];
    if (supplied || /扣减|扣除|重复|招待/.test(query)) ids.push('ME-02');
    if (types.length) {
      const deduction = types.reduce((sum, [, value]) => sum + value, 0);
      const everyDay = /每天|每日|每一天|天天|全程/.test(query) || days === 1;
      if (everyDay) answer += `\n\n已提供${types.map(([label]) => label).join('、')}，每天扣减 ${deduction} 元，剩余餐补 ${policy.daily - deduction} 元/天${days > 1 ? `；${days} 天合计 ${money((policy.daily - deduction) * days)} 元` : ''}。`;
      else answer += `\n\n${days} 天扣减前餐补为 ${money(policy.daily * days)} 元。已提供${types.map(([label]) => label).join('、')}，每实际提供一组扣减 ${deduction} 元；请说明提供了几天或几餐，不能默认每天都提供。`;
    } else if (days > 1) answer += `\n\n${days} 天未提供餐食时，餐补为 ${policy.daily} × ${days} = ${money(policy.daily * days)} 元。`;
    if (supplied && !types.length) answer += '\n\n已提供餐食时，请说明具体提供早餐、午餐还是晚餐，以及餐次数，才能算出扣减后的金额。';
    answer += '\n\n酒店含早、会议供餐、接待方提供或已作为业务招待报销的对应餐次须扣减，不能重复领取。';
    if (!ids.includes('ME-02')) ids.push('ME-02');
    return result('meals', answer, ids, { ...context, days }, !(supplied && (!types.length || (days > 1 && !/每天|每日|每一天|天天|全程/.test(query)))), ['酒店含早餐，餐补还剩多少？', '出差3天，每天含早餐，餐补多少？']);
  }
  function transport(query, context) {
    const policy = corpus().transport, index = corpus().roles.indexOf(context.role);
    if (/私车|自驾|油费|公里|里程|汽油|停车|过路|高速通行/.test(query)) {
      const km = numberMatch(query, new RegExp('(' + numberPattern + ')\\s*(?:公里|千米|km)', 'i'));
      const text = `私车公用须事前审批，按有效公务里程 ${money(policy.privateKm)} 元/公里补贴${km !== null ? `；${km} 公里对应 ${money(km * policy.privateKm)} 元` : ''}。该补贴已包含燃油、折旧与日常损耗，油费不得重复报销。${textOf(['TR-06'])}`;
      return result('transport', text, ['TR-06'], context, true, ['私车公用100公里补贴多少？', '停车费和过路费可以报销吗？']);
    }
    if (/打车|网约车|出租车|市内|公交|地铁|行程单|停车|过路/.test(query)) return result('transport', `出差市内交通按实际发生费用报销，上限为 ${policy.localDaily} 元/人·天；${textOf(['TR-05'])}`, ['TR-05'], context, true, ['打车发票还需要什么附件？', '私车公用怎么报销？']);
    return result('transport', `按${context.role}，高铁/动车标准为${policy.rail[index]}，飞机标准为${policy.flight[index]}。${textOf(['TR-04'])}`, ['TR-04'], context, true, ['那公司高管呢', '打车报销需要附行程单吗？']);
  }
  function approval(query, context) {
    const amount = amountIn(query), rules = corpus().approval || [];
    const specialIds = [];
    if (/借款|借支|预支|备用金|核销/.test(query)) specialIds.push('PR-03');
    if (/培训|学习|课程|考试/.test(query)) specialIds.push('PU-02');
    if (/采购|办公用品|办公设备|电脑/.test(query)) specialIds.push('PU-01');
    if (specialIds.length) {
      const rule = amount === null ? null : rules.find(item => item.max === null || amount <= item.max);
      const amountText = rule ? `金额审批另按报销单执行：若${specialIds.includes('PR-03') ? '后续实际' : '本次'}报销金额为 ${money(amount)} 元，审批链为：${rule.chain.join(' → ')}。${specialIds.includes('PR-03') ? '借款金额不等于最终可报销金额，应在核销时据实确认。' : ''}` : '报销单还须按实际报销金额执行 AP-01 审批。';
      const ids = [...specialIds, 'AP-01', ...(/预算/.test(query) ? ['AP-02'] : [])];
      return result('approval', `专项事前批准：\n${textOf(specialIds)}\n\n${amountText}\n\n${textOf(ids.filter(id => !specialIds.includes(id)))}`, ids, context, true, ['报销2000元谁审批？', '培训3000元需要哪些审批？']);
    }
    if (amount !== null) {
      const rule = rules.find(item => item.max === null || amount <= item.max);
      if (rule) return result('approval', `单笔报销 ${money(amount)} 元，审批链为：${rule.chain.join(' → ')}。\n\n${textOf(['AP-01'])}${/预算/.test(query) ? `\n\n${textOf(['AP-02'])}` : ''}`, /预算/.test(query) ? ['AP-01', 'AP-02'] : ['AP-01'], context, true, ['报销2000元谁审批？', '报销10000元谁审批？']);
    }
    return result('approval', textOf(/预算/.test(query) ? ['AP-02', 'AP-01'] : ['AP-01']), /预算/.test(query) ? ['AP-02', 'AP-01'] : ['AP-01'], context, true, ['报销2000元谁审批？', '报销10001元谁审批？']);
  }
  function search(query) {
    const normalized = String(query || '').trim().toLowerCase();
    const clauses = list();
    if (!normalized) return clauses.map(({ tags, category, ...clause }) => clause);
    const terms = normalized.split(/[\s，。！？、,!?;；]+/).filter(Boolean);
    return clauses.map(clause => {
      const title = `${clause.title} ${clause.docTitle}`.toLowerCase(), body = clause.body.toLowerCase();
      let score = 0;
      if (clause.clauseId.toLowerCase() === normalized) score += 100;
      if (title.includes(normalized)) score += 30;
      if (body.includes(normalized)) score += 12;
      for (const term of terms) if (term.length >= 2) { if (title.includes(term)) score += 8; if (body.includes(term)) score += 2; }
      for (const tag of clause.tags) if (String(tag).length >= 2 && normalized.includes(String(tag).toLowerCase())) score += 8;
      return { ...clause, score };
    }).filter(clause => clause.score > 0).sort((a, b) => b.score - a.score).map(({ tags, category, score, ...clause }) => clause);
  }
  function answer(question, suppliedContext = {}) {
    const query = String(question || '').trim().replace(/[,，](?=\d{3}(?:\D|$))/g, '');
    const context = { ...suppliedContext, role: roleFrom(query, suppliedContext.role), city: suppliedContext.city || '' };
    if (!list().length) return result('其他待解答', '演示制度尚未加载，请刷新后重试。', [], context, false);
    const info = cityInfo(query, context.city);
    if (info.city) context.city = info.city;
    const followup = /^(那|那么|如果|改成|换成|再|住|算|按|公司高管|部门经理|普通员工)/.test(query) && !/天气|景点|旅游攻略|股票|招聘|航班时刻|实时|汇率/.test(query);
    const isLodging = /住宿|酒店|宾馆|房费|房价|每晚|一晚|\/晚|住[了\d一二两三四五六七八九十]/.test(query);
    const isHospitality = /招待|接待|客户.*(?:吃饭|用餐|餐费|陪同)|陪同.*客户|(?:请|陪).*客户.*(?:饭|餐)|业务餐|工作餐/.test(query) && !/餐补|伙食补助|出差补助/.test(query);
    const isMeals = /餐补|伙食补助|伙食补贴|出差补助|出差餐费|差旅餐费|含早|扣.*[早午晚]餐/.test(query);
    const isApproval = /(?:谁|哪|怎么|如何|哪些).*(?:审批|批准)|审批(?:人|链|权限|流程|路径)|报销.*审批|金额.*审批|预算/.test(query);
    if (/税率|抵扣率|增值税抵扣|法律责任|能否抵扣/.test(query)) return result('其他待解答', '现有公司演示制度不包含税率、税额抵扣或法律责任的判断依据，请提供具体业务与票据，由财务核实。', [], context, false);
    if (/加班|夜班|通讯补贴|通信补贴|驻外津贴|驻外补贴/.test(query)) return result('其他补贴待确认', textOf(['ME-05']), ['ME-05'], context, false, ['出差餐补标准是什么？', '私车公用补贴标准是什么？']);
    if (isApproval && /借款|借支|预支|备用金|核销|培训|学习|课程|考试|采购|办公用品|办公设备|电脑/.test(query)) return approval(query, context);
    if (info.outside && (isMeals || /飞机|机票|火车|高铁|动车|交通|打车|私车|自驾/.test(query))) return result('travel', `${info.city}属于境外或港澳台差旅，现有中国大陆差旅额度不能直接套用。请联系财务确认当地标准及专项预算。`, ['TR-08'], context, false);
    if (/外币|汇率|美元|欧元|港币|日元/.test(query)) return result('travel', '现有演示制度未提供外币汇率与折算规则，请向财务确认币种、日期和适用汇率后再计算报销金额。', ['TR-08'], context, false);
    if (isMeals) return meals(query, context);
    if (isHospitality) return result('hospitality', `业务招待餐费上限为 ${corpus().hospitality.perPerson} 元/人·次（含税），按实际参加人数计算，须事前审批。\n\n${textOf(['HO-01', 'HO-02'])}`, ['HO-01', 'HO-02'], context, true, ['招待客户需要哪些附件？', '客户3人能安排几人陪同？']);
    if (/出差.*(?:申请|准备)|出差前.*审批/.test(query)) return result('travel', textOf(['TR-01']), ['TR-01'], context, true, ['深圳住宿多少钱？', '报销需要哪些附件？']);
    if (/合住|同住|延住|酒店.*(?:取消|退款)|住宿.*(?:取消|退款)/.test(query)) return result('lodging', textOf(['TR-07']), ['TR-07'], context, true, ['深圳住宿多少钱？', '报销需要哪些附件？']);
    if (isApproval && !/住宿.*超标|超标.*住宿|住宿.*特批|超标.*(?:审批|批准)/.test(query)) return approval(query, context);
    if (isLodging || (followup && context.lastTopic === 'lodging' && (/经理|高管|员工|\d|[一二两三四五六七八九十].*晚|呢/.test(query)))) return lodging(query, context, info);
    if (/飞机|机票|经济舱|商务舱|头等舱|火车|高铁|动车|二等座|一等座|交通|打车|网约车|出租车|私车|自驾|公里|里程|油费|停车|过路|地铁|行程单/.test(query) || (followup && context.lastTopic === 'transport' && /经理|高管|员工/.test(query))) return transport(query, context);
    if (/发票|开票|抬头|税号|电子票|重复票|购买方|票据/.test(query)) {
      const ids = /错|丢|重复|作废|红冲|退票|失效/.test(query) ? ['IN-03'] : /附件|材料|清单|原件|截图|pdf|PDF|下载/.test(query) ? ['IN-02'] : ['IN-01'];
      return result('invoice', textOf(ids), ids, context, true, ['发票抬头和税号是什么？', '发票抬头开错了怎么办？', '报销需要哪些附件？']);
    }
    if (/采购|办公用品|办公设备|电脑|培训|学习|课程/.test(query)) {
      const ids = /培训|学习|课程/.test(query) ? ['PU-02'] : ['PU-01'];
      return result('purchase', textOf(ids), ids, context, true, ['购买办公用品需要事前审批吗？', '外部培训怎么报销？']);
    }
    if (/报销.*(?:材料|附件)|(?:材料|附件).*报销/.test(query)) return result('invoice', textOf(['IN-02']), ['IN-02'], context, true, ['发票抬头和税号是什么？', '什么时候提交报销？']);
    if (/借款|借支|预支|冲销|核销/.test(query)) return result('process', textOf(['PR-03']), ['PR-03'], context, true, ['借款需要多久结清？', '报销多久付款？']);
    if (/退回|驳回|补正|补材料|重新提交/.test(query)) return result('process', textOf(['PR-04']), ['PR-04'], context, true, ['报销需要哪些附件？', '报销多久审核？']);
    if (/多久|截止|截止日|时限|工作日|提交时间|什么时候.*报销|报销.*时间|多久到账|什么时候.*(?:付款|支付)|审核|打款|付款|月结|每月|日期/.test(query) && /报销|提交|审核|付款|打款|到账|结算|截止|月结/.test(query)) {
      const ids = /审核|付款|到账|打款|支付/.test(query) ? ['PR-02'] : ['PR-01'];
      return result('process', textOf(ids), ids, context, true, ['出差回来几天内提交报销？', '报销审核后多久付款？']);
    }
    if (/出差.*(?:申请|审批|准备)|(?:申请|审批).*出差|出差前/.test(query)) return result('travel', textOf(['TR-01']), ['TR-01'], context, true, ['深圳住宿多少钱？', '报销需要哪些附件？']);
    if (followup && context.lastTopic === 'meals' && /天|餐|经理|高管|员工/.test(query)) return meals(query, context);
    const matches = search(query);
    const strong = matches.filter(clause => clause.title.includes(query) || clause.clauseId.toLowerCase() === query.toLowerCase() || (byId(clause.clauseId)?.tags || []).some(tag => String(tag).length >= 3 && query.includes(tag)));
    if (query.length >= 2 && strong.length && !/天气|旅游|股票|招聘|编程|写诗|法律|税率|抵扣率/.test(query)) {
      const best = strong.slice(0, 2);
      return result(best[0].docTitle, best.map(item => item.body).join('\n\n'), best.map(item => item.clauseId), context, true, []);
    }
    return result('其他待解答', '现有演示制度没有足够依据回答这个问题，已标记为待人工确认。你可以补充费用类型、城市、职级、金额或具体疑问，财务再确认适用规则。', [], context, false, ['深圳出差住宿多少钱？', '出差餐补标准是什么？', '发票抬头和税号是什么？']);
  }
  function markdown(docId) {
    const knowledge = corpus(), docs = knowledge.docs.filter(doc => !docId || doc.id === docId);
    if (!docs.length) return '';
    return `# ${knowledge.company} · 财务制度知识库\n\n版本：${knowledge.version}\n生效日期：${knowledge.effectiveDate}\n\n${knowledge.disclaimer}\n\n` + docs.map(doc => `## ${doc.title}\n\n${doc.summary}\n\n` + doc.clauses.map(clause => `### ${clause.id} ${clause.title}\n\n${clause.body}`).join('\n\n')).join('\n\n---\n\n');
  }
  return { answer, search, markdown };
})();
function knowledgeAnswer(question, context = {}) { return ExpenseKnowledgeEngine.answer(question, context); }
function knowledgeSearch(query) { return ExpenseKnowledgeEngine.search(query); }
function knowledgeMarkdown(docId) { return ExpenseKnowledgeEngine.markdown(docId); }
