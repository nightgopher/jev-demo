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
    $('questions').value = JSON.stringify(presets.triage, null, 2);
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
    $('example').addEventListener('click', () => { $('questions').value = JSON.stringify(presets[$('preset').value], null, 2); clearResults(); preview(); });
    ['questions', 'state'].forEach(id => $(id).addEventListener('input', preview));
    $('model').addEventListener('change', () => { clearResults(); save(); preview(); status('connectionStatus', '模型已改变，请重新检测或评估。'); });
    $('baseUrl').addEventListener('change', () => { clearResults(); save(); status('connectionStatus', '网关地址已改变，请重新检测连接。'); });
    preview();
    return {buildRequest, preview};
  }
  return {presets, normalizeBase, buildRequest, errorMessage, readAnswers, mount};
});
