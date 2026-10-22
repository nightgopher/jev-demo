(function (factory) {
  'use strict';
  const app = factory();
  if (typeof module === 'object' && module.exports) module.exports = app;
  else document.addEventListener('DOMContentLoaded', () => app.mount(document, window));
})(function () {
  'use strict';
  const presets = {
    noul: {is_urgent: {type: 'noul', instructions: '这条请求是否需要紧急处理？'}},
    choice: {department: {type: 'choice', instructions: '应由哪个团队处理这条请求？', criteria: {billing: '支付、账单或订阅问题', technical: '软件故障或集成问题', sales: '价格或销售咨询'}}},
    score: {severity: {type: 'score', instructions: '问题的严重程度如何？', criteria: ['轻微，不影响功能', '部分功能受影响，有临时解决方式', '核心业务被阻断，没有可用的替代方式']}}
  };
  presets.triage = {...presets.noul, ...presets.choice, ...presets.score};
  const supportState = '我们的支付接口连续三天失败，客户无法下单，已经影响销售。请尽快处理。';
  const examples = [
    {
      id: 'triage', group: '场景示例', label: '客服工单 · 综合分诊',
      description: '同一条工单同时判断紧急程度、归属团队与影响等级。',
      readout: '比较紧急概率、分类概率和严重程度。这里的评分范围是 0–2，具体结果以实际评估为准。',
      state: supportState, questions: presets.triage
    },
    {
      id: 'alert', group: '场景示例', label: '线上告警 · 核实恢复情况',
      description: '用多个是／否问题检查告警记录中明确出现的事实。',
      readout: '服务已经恢复，并不等于影响可以忽略，也不等于记录已经说明根因。每个问题独立返回概率。',
      state: '10:02–10:08，订单 API 的错误率从 0.2% 升至 18%，部分客户提交订单失败。10:09 回滚后错误率恢复到 0.2%，随后连续观察 20 分钟没有再次升高。当前记录未说明故障根因。',
      questions: {
        recovered: {type: 'noul', instructions: '记录是否明确表明服务已经恢复，并经过持续观察？'},
        affected_customers: {type: 'noul', instructions: '本次故障是否已经影响到真实客户下单？'},
        root_cause_known: {type: 'noul', instructions: '记录是否已经明确说明故障根因？不要根据回滚成功推测根因。'}
      }
    },
    {
      id: 'inbox', group: '场景示例', label: '邮件分类 · 识别来信意图',
      description: '从给定选项中选出邮件的主要诉求，并判断是否需要当天回复。',
      readout: 'Choice 的选项由你定义；“其他”可以承接不属于已有分类的来信。Noul 单独判断时间要求。',
      state: '你好，我们正在试用团队版，想约下周二做一次 20 分钟的产品演示，也想了解 30 人团队的报价。目前使用没有遇到故障。时间不急，本周内回复即可。',
      questions: {
        intent: {type: 'choice', instructions: '这封邮件的主要意图是什么？', criteria: {sales: '产品演示、价格或采购咨询', support: '使用故障或技术支持', billing: '已发生的扣费、发票或退款问题', other: '其他意图'}},
        reply_today: {type: 'noul', instructions: '来信是否明确要求今天之内回复？'}
      }
    },
    {
      id: 'review', group: '场景示例', label: '商品评价 · 情绪与改进优先级',
      description: '识别同时包含赞扬和抱怨的评价，再按业务影响给改进项评分。',
      readout: '情绪分类与改进优先级是两个维度。Score 使用你提供的等级顺序，分数可以落在相邻等级之间。',
      state: '键盘手感很舒服，外观也喜欢，日常写字没有问题。但蓝牙每天会断开两三次，需要重新连接；接收器模式一直正常。希望后续固件能修复，暂时还会继续使用。',
      questions: {
        sentiment: {type: 'choice', instructions: '评价的整体情绪更接近哪一类？', criteria: {positive: '主要是满意或赞扬', mixed: '明确同时包含满意与不满', negative: '主要是不满或抱怨', neutral: '没有明确情绪的事实描述'}},
        improvement_priority: {type: 'score', instructions: '根据评价描述的功能影响，蓝牙问题的改进优先级如何？', criteria: ['只有外观或偏好建议，功能不受影响', '有轻微不便，但主要使用流程顺畅', '功能反复受影响，但存在可用的替代方式', '核心功能不可用，也没有替代方式']}
      }
    },
    {
      id: 'release', group: '场景示例', label: '发布说明 · 检查信息完整性',
      description: '把文档检查表变成多个概率判断，检查说明中是否写明必要信息。',
      readout: '关注“是否明确写明”，避免把没有提及的信息当成已完成。这只是文档信息检查，发布决策仍需人工确认。',
      state: '计划于 10 月 24 日 22:00 发布 v2.4.0，新增批量导出。已在测试环境验证导出 1000 条记录；发布后观察错误率和导出成功率。负责人为示例团队 A。',
      questions: {
        version_present: {type: 'noul', instructions: '说明中是否明确写明即将发布的版本号？'},
        validation_present: {type: 'noul', instructions: '说明中是否明确记录至少一项已经执行的验证？'},
        rollback_documented: {type: 'noul', instructions: '说明中是否明确提供失败时的回滚步骤？仅有观察指标不能视为回滚步骤。'},
        schedule_present: {type: 'noul', instructions: '说明中是否明确写明计划发布的日期和时间？'}
      }
    },
    {
      id: 'search', group: '场景示例', label: '搜索结果 · 逐条评估相关性',
      description: '让多个候选片段使用同一组评分等级，比较它们能否回答查询。',
      readout: '三个问题共用 0–3 的相关性等级。评分是对片段的判断，不是排序位置；同分时可以保留多个候选。',
      state: '查询：如何通过 EasyGateway 调用 Jev 的 System One 接口？\n\n片段 A：向 POST /v1/systemone 提交 model、state 和 questions。问题支持 noul、choice、score，结果从 answers 读取。\n\n片段 B：EasyGateway 支持在桌面端管理模型、查看请求日志和切换主机连接。\n\n片段 C：这份食谱介绍如何烤制法棍，包括揉面、发酵和烘烤时间。',
      questions: Object.fromEntries(['A', 'B', 'C'].map(id => ['relevance_' + id.toLowerCase(), {
        type: 'score', instructions: `片段 ${id} 对回答查询有多大帮助？只评价该片段自身的信息。`,
        criteria: ['完全无关', '主题相邻，但没有回答查询', '部分回答查询，仍缺少关键步骤', '直接回答查询，并提供可操作的信息']
      }]))
    },
    {
      id: 'bugreport', group: '场景示例', label: '缺陷报告 · 评估可复现程度',
      description: '检查一条模糊的缺陷报告，并选择最值得补充的信息。',
      readout: '信息不足可以得到低评分或落到“补充信息”类选项，无需让模型编造复现步骤。',
      state: '反馈：打开以后有时候会卡，重启就好了。请帮忙看看。\n附加信息：没有提供应用版本、操作系统、具体操作步骤、发生时间或截图。',
      questions: {
        completeness: {type: 'score', instructions: '这份报告提供的信息足以支持稳定复现问题吗？', criteria: ['只有笼统现象，几乎无法定位', '有具体触发场景，但缺少步骤或环境', '环境和步骤基本齐全，仍缺关键证据', '环境、步骤、预期、实际结果和证据齐全']},
        next_detail: {type: 'choice', instructions: '收到这份报告后，最应优先补充哪类信息？', criteria: {reproduction: '版本、环境、具体操作步骤和发生现象', priority: '界面配色与个人偏好', roadmap: '下一季度的功能规划'}},
        clear_steps: {type: 'noul', instructions: '报告是否已经提供可执行的具体复现步骤？'}
      }
    },
    {
      id: 'workflow', group: '场景示例', label: '工作流决策 · 选择下一步动作',
      description: '按显式规则，在有限动作中选出下一步；使用结构化 instructions 和 criteria。',
      readout: '这里仅返回推荐动作，不会实际执行。观察模型能否区分认证失效与适合直接重试的暂时性故障。',
      state: '某条数据同步任务已尝试 2 次，两次都返回 HTTP 401，错误为 access_token_expired。日志没有出现超时或服务端 5xx。操作者可以重新授权账号，但尚未重新授权。',
      questions: {
        next_action: {type: 'choice', instructions: {task: '选择最合适的下一步动作', rules: ['认证已失效时，应先恢复授权', '只有超时或 5xx 等暂时性错误才适合直接重试', '仅推荐动作，不执行动作']}, criteria: {reauthorize: {action: '重新授权账号', when: '认证或访问令牌已失效'}, retry: {action: '直接重试同步', when: '暂时性的网络或服务端故障'}, inspect_data: {action: '检查输入数据', when: '输入字段或格式不合法'}, none: {action: '无需处理', when: '任务已经成功'}}},
        retry_without_change: {type: 'noul', instructions: '在不恢复授权、也不改变其他条件的情况下，立即重试是否有充分理由能成功？'}
      }
    },
    {
      id: 'noul', group: '基础用法', label: 'Noul · 是／否概率',
      description: '从一个明确的问题开始，读取 0–1 的“是”概率。',
      readout: '概率反映模型的判断，不是确定事实。修改内容中的紧急程度，再比较两次实际结果。',
      state: supportState, questions: presets.noul
    },
    {
      id: 'choice', group: '基础用法', label: 'Choice · 多选分类',
      description: '定义有限选项，让模型选出一个选项并返回概率。',
      readout: '结果中的 choice 对应 criteria 的键，例如 billing；修改选项描述可以改变分类边界。',
      state: supportState, questions: presets.choice
    },
    {
      id: 'score', group: '基础用法', label: 'Score · 分级评分',
      description: '按从低到高排列的等级说明，读取评分和各等级概率。',
      readout: '三个等级对应 0、1、2；score 可以是小数。评分范围由等级数量决定。',
      state: supportState, questions: presets.score
    }
  ];
  const storageKey = 'jev-demo.settings.v1';
  const ownObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function normalizeBase(value) {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('网关地址应为不含密码、查询参数和片段的 HTTP(S) 地址。');
    url.pathname = url.pathname.replace(/\/+$/, '') || '/v1';
    return url.toString().replace(/\/+$/, '');
  }
  function buildRequest(model, state, questionsText) {
    if (!model || !state.trim()) throw new Error('请填写待判断内容并选择模型。');
    let questions;
    try { questions = JSON.parse(questionsText); } catch (_) { throw new Error('问题定义不是有效的 JSON。'); }
    if (!ownObject(questions) || !Object.keys(questions).length) throw new Error('questions 必须是至少包含一个问题的对象。');
    for (const [id, q] of Object.entries(questions)) {
      if (!id.trim() || !ownObject(q) || !['noul', 'choice', 'score'].includes(q.type)) throw new Error('每个问题需要 ID，type 应为 noul、choice 或 score。');
      if (!q.instructions || (typeof q.instructions !== 'string' && !ownObject(q.instructions)) || (typeof q.instructions === 'string' && !q.instructions.trim())) throw new Error(`问题 ${id} 缺少 instructions。`);
      if (q.type === 'choice' && (!ownObject(q.criteria) || !Object.keys(q.criteria).length)) throw new Error(`分类问题 ${id} 需要 criteria 对象。`);
      if (q.type === 'score' && (!Array.isArray(q.criteria) || !q.criteria.length)) throw new Error(`评分问题 ${id} 需要 criteria 数组。`);
    }
    return {model, state: state.trim(), questions};
  }
  function errorMessage(status, data, retryAfter) {
    const error = data && data.error;
    const message = typeof error === 'string' ? error : error && error.message || data && data.message || '上游未返回可读的错误信息。';
    const type = ownObject(error) && error.type ? ` · ${error.type}` : '';
    let text = `HTTP ${status}${type}：${message}`;
    if (status === 429) text += '\n额度或频率受限；这不代表模型协议故障。';
    if (status === 401 || status === 403) text += '\n检查网关 Key 和服务端 OpenCode 工作区 API Key、模型权限及余额。';
    if (retryAfter) text += `\nRetry-After：${retryAfter}`;
    return text;
  }
  function readAnswers(data, request) {
    if (!data || !ownObject(data.answers) || Object.keys(request.questions).some(id => !ownObject(data.answers[id]))) throw new Error('响应缺少所请求问题的 answers；请检查网关和上游协议。');
    return Object.entries(request.questions).map(([id, question]) => {
      const a=data.answers[id];
      const finite=value=>typeof value==='number' && Number.isFinite(value);
      const probability=value=>finite(value) && value>=0 && value<=1;
      if (a.type!==question.type || (a.type==='noul' && !probability(a.noul)) || (a.type==='choice' && !Object.prototype.hasOwnProperty.call(question.criteria,a.choice)) || (a.type==='score' && (!finite(a.score) || a.score<0 || a.score>question.criteria.length-1)) || (a.confidence!==undefined && !probability(a.confidence)) || (a.probabilities!==undefined && (!ownObject(a.probabilities) || Object.values(a.probabilities).some(value=>!probability(value))))) throw new Error(`问题 ${id} 的答案类型或概率无效。`);
      return {...a,id};
    });
  }
  function mount(doc, win) {
    const $ = id => doc.getElementById(id);
    let controller = null;
    let generation = 0;
    let preferences = {baseUrl: 'http://127.0.0.1:4001/v1', model: 'jev-1.13-free'};
    try {
      const old = JSON.parse(win.localStorage.getItem(storageKey) || '{}');
      if (typeof old.baseUrl === 'string') preferences.baseUrl = old.baseUrl;
      if (['jev-1.13-free', 'jev-1.13'].includes(old.model)) preferences.model = old.model;
      // Upgrade the old settings record, removing its persisted master key.
      win.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (_) {}
    $('baseUrl').value = preferences.baseUrl;
    $('model').value = preferences.model;
    const groups = new Map();
    $('preset').replaceChildren();
    for (const example of examples) {
      if (!groups.has(example.group)) {
        const group = doc.createElement('optgroup'); group.label = example.group;
        groups.set(example.group, group); $('preset').append(group);
      }
      const option = doc.createElement('option'); option.value = example.id; option.textContent = example.label;
      groups.get(example.group).append(option);
    }
    $('preset').value = 'triage';
    const controlled = ['baseUrl', 'apiKey', 'model', 'state', 'questions', 'preset', 'example', 'connect', 'evaluate'];
    function busy(value) {
      controlled.forEach(id => { $(id).disabled = value; });
      $('stop').hidden = !value;
      $('resultPanel').setAttribute('aria-busy', String(value));
    }
    function status(id, text, kind) { $(id).textContent = text; $(id).dataset.kind = kind || ''; }
    function clearResults() {
      $('answers').replaceChildren(); $('resultMeta').textContent = ''; $('raw').textContent = '';
      $('rawResult').hidden = true; $('empty').hidden = false;
    }
    function save() {
      try { win.localStorage.setItem(storageKey, JSON.stringify({baseUrl: $('baseUrl').value.trim(), model: $('model').value})); } catch (_) {}
    }
    function preview() {
      try { $('requestPreview').textContent = JSON.stringify(buildRequest($('model').value, $('state').value, $('questions').value), null, 2); }
      catch (e) { $('requestPreview').textContent = e.message; }
    }
    function selectedExample() { return examples.find(example => example.id === $('preset').value); }
    function describeExample() {
      const example = selectedExample();
      if (!example || !$('exampleSummary')) return;
      const types = Object.values(example.questions).map(question => question.type);
      $('exampleSummary').textContent = example.description;
      $('exampleTypes').textContent = [['noul', '概率判断'], ['choice', '分类'], ['score', '评分']]
        .map(([type, label]) => ({label, count: types.filter(value => value === type).length}))
        .filter(item => item.count).map(item => `${item.count} 个${item.label}`).join(' · ');
      $('exampleHint').textContent = '观察重点：' + example.readout;
    }
    function loadExample(announce = true) {
      const example = selectedExample();
      if (!example) return;
      $('state').value = example.state;
      $('questions').value = JSON.stringify(example.questions, null, 2);
      clearResults(); describeExample(); preview();
      if (announce) status('requestStatus', `已载入「${example.label}」，可编辑后开始评估。`);
    }
    function credentials() {
      const base = normalizeBase($('baseUrl').value), key = $('apiKey').value.trim();
      if (!key) throw new Error('请先填写网关 API Key。');
      save();
      return {base, headers: {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}};
    }
    function render(rows) {
      $('empty').hidden = true;
      for (const a of rows) {
        const card = doc.createElement('article'); card.className = 'answer';
        const head = doc.createElement('div'); head.className = 'answer-head';
        const title = doc.createElement('h3'); title.textContent = a.id;
        const type = doc.createElement('small'); type.textContent = a.type || 'answer';
        head.append(title, type); card.append(head);
        const value = doc.createElement('div'); value.className = 'value';
        const primary = a.type === 'noul' ? a.noul : a.type === 'choice' ? a.choice : a.score;
        value.textContent = primary === undefined ? '—' : String(primary); card.append(value);
        if (typeof a.noul === 'number') {
          const p = doc.createElement('p'); p.className = 'muted'; p.textContent = `“是”的概率 ${(a.noul * 100).toFixed(1)}%`; card.append(p);
        }
        if (typeof a.confidence === 'number') {
          const p = doc.createElement('p'); p.className = 'muted'; p.textContent = `置信度 ${(a.confidence * 100).toFixed(1)}%`; card.append(p);
        }
        for (const [label, probability] of Object.entries(a.probabilities || {})) {
          if (typeof probability !== 'number' || !Number.isFinite(probability)) continue;
          const row = doc.createElement('div'); row.className = 'probability';
          const name = doc.createElement('span'); const description = a.legend && a.legend[label];
          name.textContent = label + (description === undefined ? '' : ' · ' + (typeof description === 'string' ? description : JSON.stringify(description)));
          const pct = doc.createElement('span'); pct.textContent = (probability * 100).toFixed(1) + '%';
          const track = doc.createElement('div'); track.className = 'track'; const fill = doc.createElement('div'); fill.className = 'fill'; fill.style.width = Math.min(100, Math.max(0, probability * 100)) + '%';
          track.append(fill); row.append(name, pct, track); card.append(row);
        }
        $('answers').append(card);
      }
    }
    async function run(checkOnly) {
      if (controller) return;
      const messageId = checkOnly ? 'connectionStatus' : 'requestStatus';
      let c, request;
      try { c = credentials(); if (!checkOnly) request = buildRequest($('model').value, $('state').value, $('questions').value); }
      catch (e) { status(messageId, e.message, 'error'); return; }
      const revision = ++generation;
      controller = new AbortController(); busy(true);
      if (!checkOnly) clearResults();
      status(messageId, checkOnly ? '正在检测网关…' : '正在评估…');
      const started = performance.now();
      try {
        const response = await win.fetch(c.base + (checkOnly ? '/models' : '/systemone'), {method: checkOnly ? 'GET' : 'POST', headers: c.headers, credentials: 'omit', signal: controller.signal, ...(checkOnly ? {} : {body: JSON.stringify(request)})});
        const raw = await response.text();
        let data;
        try { data = JSON.parse(raw); } catch (_) { throw new Error(`HTTP ${response.status}：网关未返回 JSON。`); }
        if (!response.ok) throw new Error(errorMessage(response.status, data, response.headers.get('Retry-After')));
        if (revision !== generation) return;
        if (checkOnly) {
          const model = (data.data || []).find(m => m.id === $('model').value);
          if (!model || model.protocol !== 'systemone') throw new Error('所选模型未声明 System One 协议，请升级网关和 providers.yaml 至 v0.3.9 或更新版本。');
          const health = model.gateway_status || {};
          status(messageId, `网关已连接。${model.id} 已配置为 System One。\n${health.reason || '上游可用性需通过实际评估确认。'}`, health.available === false ? 'error' : 'success');
        } else {
          const rows = readAnswers(data, request);
          render(rows);
          $('raw').textContent = JSON.stringify(data, null, 2); $('rawResult').hidden = false;
          const usage = data.usage || {};
          $('resultMeta').textContent = `${data.model || request.model} · ${((performance.now() - started) / 1000).toFixed(2)} 秒` + (typeof usage.input_tokens === 'number' ? ` · 输入 ${usage.input_tokens} / 输出 ${usage.output_tokens ?? '未报告'} tokens` : '');
          status(messageId, `评估完成，收到 ${rows.length} 个结构化答案。`, 'success');
        }
      } catch (e) {
        if (revision === generation) status(messageId, e.name === 'AbortError' ? '请求已取消，可重新评估。' : e.message, e.name === 'AbortError' ? '' : 'error');
      } finally {
        if (revision === generation) { controller = null; busy(false); }
      }
    }
    $('connect').addEventListener('click', () => run(true));
    $('evaluate').addEventListener('click', () => run(false));
    $('stop').addEventListener('click', () => { if (controller) controller.abort(); });
    $('preset').addEventListener('change', describeExample);
    $('example').addEventListener('click', () => loadExample());
    ['questions', 'state'].forEach(id => $(id).addEventListener('input', preview));
    $('model').addEventListener('change', () => { clearResults(); save(); preview(); status('connectionStatus', '模型已改变，请重新检测或评估。'); });
    $('baseUrl').addEventListener('change', () => { clearResults(); save(); status('connectionStatus', '网关地址已改变，请重新检测连接。'); });
    loadExample(false);
    return {buildRequest, preview};
  }
  return {presets, examples, normalizeBase, buildRequest, errorMessage, readAnswers, mount};
});
