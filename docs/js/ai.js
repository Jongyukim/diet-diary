// ===== API 키 상수 (여기에 직접 입력하거나 AI 탭 UI로 등록) =====
const OPENAI_API_KEY = 'YOUR_KEY_HERE';

// ===== 프롬프트 상수 =====
const SCAN_SYSTEM = `You are a nutrition label parser. Extract nutrition information from the image and return ONLY a JSON object. No explanation, no markdown, no code blocks. Pure JSON only. If you cannot read a value clearly, use null.`;

const SCAN_USER = `이 영양성분표에서 다음 정보를 추출해서 JSON으로만 반환해줘:
{"name":"제품명 (없으면 null)","serving":"1회 제공량 (예: 100g, 1개)","cal":칼로리 숫자,"carb":탄수화물g 숫자,"fat":지방g 숫자,"protein":단백질g 숫자}
다른 말 하지 말고 JSON만 반환해.`;

const SCAN_SYSTEM_EXT = `You are a nutrition label parser.
Extract ALL available nutrition information from the image.
Return ONLY a valid JSON object, no markdown, no explanation.
If a value is not visible or unclear, use null.`;

const SCAN_USER_EXT = `이 영양성분표에서 모든 영양정보를 추출해서 아래 JSON 형식으로만 반환해줘.\n없는 값은 null로 채워줘. 다른 말은 하지 마.\n{"name":"제품명","serving":"1회 제공량","cal":칼로리,"ca":탄수화물g,"f":지방g,"p":단백질g,"fiber":식이섬유g,"sugar":당류g,"sodium":나트륨mg,"saturatedFat":포화지방g,"transFat":트랜스지방g,"cholesterol":콜레스테롤mg,"calcium":칼슘mg,"iron":철분mg,"vitaminD":비타민Dμg,"vitaminC":비타민Cmg}`;

const CHAT_SYSTEM_TPL = `You are a personal nutrition consultant for a diet tracking app.
You have access to the user's recent diet data below.
Be specific, practical, and concise. Respond in Korean.
Do not repeat the data back to the user. Just give actionable advice.

--- 최근 7일 식단 데이터 ---
평균 칼로리: {avgCal}kcal (목표: {targetCal}kcal)
평균 탄수화물: {avgCarb}g ({carbPct}%)
평균 지방: {avgFat}g ({fatPct}%)
평균 단백질: {avgProtein}g ({proteinPct}%)
BMR: {bmr}kcal
평균 칼로리 경감: {avgDeficit}kcal/일
자주 먹은 음식: {topFoods}
기록한 날: {recordedDays}/7일
현재 체중: {weight}kg, 목표: {goalWeight}kg
---`;

const REPORT_SYSTEM_TPL = `You are a nutrition analyst. Generate a weekly diet report in Korean.
Be direct and specific. Use bullet points. Max 300 words.
Format:
1. 이번 주 요약 (2줄)
2. 잘한 점 (2가지)
3. 개선할 점 (2가지)
4. 추천 영양제 (부족한 영양소 기반, 최대 3가지)
5. 다음 주 목표 (1가지)

--- 이번 주 데이터 ---
기록일: {recordedDays}/7일
평균 칼로리: {avgCal}kcal (목표: {targetCal}kcal)
탄수화물: {avgCarb}g ({carbPct}%)
지방: {avgFat}g ({fatPct}%)
단백질: {avgProtein}g ({proteinPct}%)
체중 변화: {weightStart}kg → {weightEnd}kg
운동 횟수: {exerciseDays}일
비타민 복용: {vitaminDays}/7일
가장 많이 먹은 음식: {topFoods}
가장 부족한 영양소: {deficientNutrients}`;

// ===== 유틸 =====
function fillTpl(tpl, ctx) {
  return Object.entries(ctx).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v ?? ''), tpl);
}
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== API 키 관리 =====
function getApiKey() {
  if (OPENAI_API_KEY !== 'YOUR_KEY_HERE') return OPENAI_API_KEY;
  return localStorage.getItem('dd_openai_key') || '';
}
function saveApiKey() {
  const k = document.getElementById('aiKeyInp').value.trim();
  if (!k) { showToast('키를 입력하세요'); return; }
  localStorage.setItem('dd_openai_key', k);
  document.getElementById('aiKeyInp').value = '';
  updateApiKeyUI();
  showToast('API 키 저장 ✅');
}
function updateApiKeyUI() {
  const el = document.getElementById('apiKeyStatus');
  if (el) el.textContent = getApiKey() ? '✅ API 키 등록됨' : '❌ API 키 없음';
}

// ===== AI 탭 전환 =====
function switchAITab(tab, btn) {
  document.querySelectorAll('.ai-tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.ai-section').forEach(s => s.classList.remove('on'));
  if (btn) btn.classList.add('on');
  document.getElementById('ai' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('on');
}

// ===== 주간 컨텍스트 계산 =====
function getWeeklyContext() {
  const allDays = load().days || {};
  const today = new Date();
  const results = [];
  let vitaminDays = 0;
  const weights = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = localDK(d);
    const day = allDays[k];
    if (day) {
      if (hasRecord(day)) results.push(day);
      if (day.vitamin) vitaminDays++;
      if (day.weight) weights.push(day.weight);
    }
  }

  const tCal  = d => slots.reduce((s,sl) => s + (d.meals[sl]||[]).reduce((a,i) => a + (i.cal||0), 0), 0);
  const tCarb = d => slots.reduce((s,sl) => s + (d.meals[sl]||[]).reduce((a,i) => a + (i.ca||i.carb||0), 0), 0);
  const tFat  = d => slots.reduce((s,sl) => s + (d.meals[sl]||[]).reduce((a,i) => a + (i.f||i.fat||0), 0), 0);
  const tProt = d => slots.reduce((s,sl) => s + (d.meals[sl]||[]).reduce((a,i) => a + (i.p||i.protein||0), 0), 0);

  const n = results.length || 1;
  const avgCal     = Math.round(results.reduce((s,d) => s + tCal(d),  0) / n);
  const avgCarb    = Math.round(results.reduce((s,d) => s + tCarb(d), 0) / n);
  const avgFat     = Math.round(results.reduce((s,d) => s + tFat(d),  0) / n);
  const avgProtein = Math.round(results.reduce((s,d) => s + tProt(d), 0) / n);

  const foodCount = {};
  results.forEach(d => slots.forEach(sl => (d.meals[sl]||[]).forEach(item => {
    foodCount[item.name] = (foodCount[item.name]||0) + 1;
  })));
  const topFoods = Object.entries(foodCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([n]) => n).join(', ') || '없음';

  const s = gs();
  const deficient = [];
  if (avgCarb    < s.targetCarb * 0.7) deficient.push('탄수화물');
  if (avgFat     < s.targetFat  * 0.7) deficient.push('지방');
  if (avgProtein < s.targetPro  * 0.7) deficient.push('단백질');

  const w = latestW() || 75;
  const bmr = calcBMR(s, w);
  const avgDeficit = results.length ? Math.round(results.reduce((sum, d) => {
    const cal = tCal(d), ex = (d.exercises||[]).reduce((a,e) => a + e.cal, 0);
    return sum + (bmr - cal + ex);
  }, 0) / results.length) : 0;

  return {
    avgCal, avgCarb, avgFat, avgProtein,
    carbPct:    Math.round(avgCarb    * 4 / (avgCal||1) * 100),
    fatPct:     Math.round(avgFat     * 9 / (avgCal||1) * 100),
    proteinPct: Math.round(avgProtein * 4 / (avgCal||1) * 100),
    recordedDays: results.length,
    topFoods,
    deficientNutrients: deficient.join(', ') || '없음',
    targetCal: s.targetCal, bmr, weight: w, goalWeight: s.goalWeight,
    avgDeficit, vitaminDays,
    exerciseDays: results.filter(d => (d.exercises||[]).length > 0).length,
    weightStart: weights[0]  || w,
    weightEnd:   weights[weights.length-1] || w,
  };
}

// ===== GPT API 호출 =====
async function callGPT(messages, maxTokens = 500, model = 'gpt-4o-mini') {
  const key = getApiKey();
  if (!key) { showToast('API 키를 먼저 등록하세요'); return null; }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error?.message || `API 오류 ${res.status}`);
  }
  return (await res.json()).choices[0].message.content;
}

// ===== 영양성분 스캔 =====
let _scanBase64 = null;

function handleScanImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const url = ev.target.result;
    _scanBase64 = url.split(',')[1];
    const prev = document.getElementById('scanPreview');
    prev.src = url;
    prev.style.display = 'block';
    document.getElementById('scanResultArea').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function runScan() {
  if (!_scanBase64) { showToast('이미지를 먼저 선택하세요'); return; }
  if (!getApiKey())  { showToast('API 키를 먼저 등록하세요'); return; }
  const btn = document.getElementById('scanBtn');
  btn.disabled = true; btn.textContent = '분석 중...';
  try {
    const raw = await callGPT([
      { role: 'system', content: SCAN_SYSTEM },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${_scanBase64}` } },
        { type: 'text', text: SCAN_USER },
      ]},
    ], 200, 'gpt-4o');
    const data = JSON.parse(raw);
    document.getElementById('scanName').value    = data.name    || '';
    document.getElementById('scanServing').value = data.serving || '100g';
    document.getElementById('scanCal').value     = data.cal     ?? '';
    document.getElementById('scanCarb').value    = data.carb    ?? '';
    document.getElementById('scanFat').value     = data.fat     ?? '';
    document.getElementById('scanProtein').value = data.protein ?? '';
    document.getElementById('scanResultArea').style.display = 'block';
  } catch(e) {
    showToast('분석 실패: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = '🔍 분석';
  }
}

function saveScanResult() {
  const name = document.getElementById('scanName').value.trim();
  if (!name) { showToast('제품명을 입력하세요'); return; }
  const fs = gcf();
  fs.push({
    id: 'ai' + Date.now(), nk: name, name,
    cal: parseFloat(document.getElementById('scanCal').value)     || 0,
    ca:  parseFloat(document.getElementById('scanCarb').value)    || 0,
    f:   parseFloat(document.getElementById('scanFat').value)     || 0,
    p:   parseFloat(document.getElementById('scanProtein').value) || 0,
    sk:  document.getElementById('scanServing').value || '1회 제공량',
  });
  scf(fs);
  showToast(`"${name}" 식품 등록 완료 ✅`);
  document.getElementById('scanPreview').style.display = 'none';
  document.getElementById('scanResultArea').style.display = 'none';
  document.getElementById('scanFileInp').value = '';
  _scanBase64 = null;
}

// ===== 채팅 컨설턴트 =====
const CHAT_HISTORY_KEY = 'dd_chat_history';
let _chatHistory = [];

function _loadChatHistory() {
  try { _chatHistory = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY)) || []; }
  catch { _chatHistory = []; }
}
function _saveChatHistory() { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(_chatHistory)); }

function clearChatHistory() { _chatHistory = []; _saveChatHistory(); renderChatMessages(); }

function renderChatMessages() {
  const el = document.getElementById('chatMessages');
  if (!el) return;
  if (_chatHistory.length === 0) {
    el.innerHTML = '<div class="chat-empty">안녕하세요! 식단에 대해 무엇이든 물어보세요 💬</div>';
    return;
  }
  el.innerHTML = _chatHistory.map(m => {
    const safe = escapeHtml(m.content).replace(/\n/g, '<br>');
    return `<div class="chat-msg ${m.role}"><div class="chat-bubble">${safe}</div></div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

async function sendChat() {
  const inp = document.getElementById('chatInp');
  const msg = inp.value.trim();
  if (!msg) return;
  if (!getApiKey()) { showToast('API 키를 먼저 등록하세요'); return; }
  inp.value = '';
  _chatHistory.push({ role: 'user', content: msg });
  renderChatMessages();
  _saveChatHistory();
  const btn = document.getElementById('chatSendBtn');
  btn.disabled = true; btn.textContent = '...';
  try {
    const sys = fillTpl(CHAT_SYSTEM_TPL, getWeeklyContext());
    const msgs = [{ role: 'system', content: sys }, ..._chatHistory.slice(-10)];
    const reply = await callGPT(msgs, 800);
    _chatHistory.push({ role: 'assistant', content: reply });
    renderChatMessages();
    _saveChatHistory();
  } catch(e) {
    showToast('오류: ' + e.message);
    _chatHistory.pop();
    renderChatMessages();
  } finally {
    btn.disabled = false; btn.textContent = '전송';
  }
}

// ===== 주간 리포트 =====
const REPORT_STORAGE_KEY = 'dd_weekly_report';

function _getLastReport()  { try { return JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY)); } catch { return null; } }
function _saveReport(r)    { localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(r)); }
function _shouldAutoGenerate() {
  const r = _getLastReport();
  if (!r?.date) return true;
  return (Date.now() - new Date(r.date)) / 86400000 >= 7;
}

function renderReport() {
  const el = document.getElementById('reportContent');
  if (!el) return;
  const r = _getLastReport();
  if (!r) {
    el.innerHTML = '<div class="report-empty">아직 리포트가 없어요.<br>아래 버튼을 눌러 첫 리포트를 생성하세요.</div>';
    return;
  }
  const date = new Date(r.date).toLocaleDateString('ko-KR');
  el.innerHTML = `<div class="report-date">📅 ${date} 생성</div><div class="report-text">${escapeHtml(r.text).replace(/\n/g,'<br>')}</div>`;
}

async function generateReport() {
  if (!getApiKey()) { showToast('API 키를 먼저 등록하세요'); return; }
  const btn = document.getElementById('reportBtn');
  if (btn) { btn.disabled = true; btn.textContent = '생성 중...'; }
  try {
    const ctx = getWeeklyContext();
    const sys = fillTpl(REPORT_SYSTEM_TPL, ctx);
    const text = await callGPT([
      { role: 'system', content: sys },
      { role: 'user', content: '이번 주 식단 리포트 생성해줘.' },
    ], 1000);
    _saveReport({ text, date: new Date().toISOString() });
    renderReport();
    showToast('주간 리포트 생성 완료 ✅');
  } catch(e) {
    showToast('오류: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📋 리포트 생성'; }
  }
}

// ===== AI 탭 초기화 =====
function initAITab() {
  updateApiKeyUI();
  _loadChatHistory();
  renderChatMessages();
  renderReport();
  if (getApiKey() && _shouldAutoGenerate()) generateReport();
}

// ===== 설정탭 영양성분 스캔 =====
let _settingsScanBase64 = null;

const _SCAN_FIELDS = [
  { key:'name',        label:'제품명',          type:'text',   req:true },
  { key:'serving',     label:'1회 제공량',       type:'text',   req:true },
  { key:'cal',         label:'칼로리 (kcal)',    type:'number', req:true },
  { key:'ca',          label:'탄수화물 (g)',     type:'number', req:true },
  { key:'f',           label:'지방 (g)',         type:'number', req:true },
  { key:'p',           label:'단백질 (g)',       type:'number', req:true },
  { key:'fiber',       label:'식이섬유 (g)',     type:'number' },
  { key:'sugar',       label:'당류 (g)',         type:'number' },
  { key:'sodium',      label:'나트륨 (mg)',      type:'number' },
  { key:'saturatedFat',label:'포화지방 (g)',     type:'number' },
  { key:'transFat',    label:'트랜스지방 (g)',   type:'number' },
  { key:'cholesterol', label:'콜레스테롤 (mg)',  type:'number' },
  { key:'calcium',     label:'칼슘 (mg)',        type:'number' },
  { key:'iron',        label:'철분 (mg)',        type:'number' },
  { key:'vitaminD',    label:'비타민D (μg)',     type:'number' },
  { key:'vitaminC',    label:'비타민C (mg)',     type:'number' },
];

function triggerScanInput() {
  document.getElementById('settingsScanInput').click();
}

function handleScanFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const url = ev.target.result;
    _settingsScanBase64 = url.split(',')[1];
    const img = document.getElementById('settingsScanImg');
    img.src = url;
    img.style.display = 'block';
    document.getElementById('settingsScanPlaceholder').style.display = 'none';
    document.getElementById('settingsScanAnalyzeBtn').style.display = '';
    document.getElementById('settingsScanResultForm').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function runSettingsScan() {
  if (!_settingsScanBase64) { showToast('이미지를 먼저 선택하세요'); return; }
  if (!getApiKey()) { showToast('API 키를 먼저 등록하세요 (AI 탭)'); return; }
  const btn = document.getElementById('settingsScanAnalyzeBtn');
  const loading = document.getElementById('settingsScanLoading');
  btn.style.display = 'none';
  loading.style.display = 'flex';
  document.getElementById('settingsScanResultForm').style.display = 'none';
  const EMPTY = {name:null,serving:null,cal:null,ca:null,f:null,p:null,fiber:null,sugar:null,sodium:null,saturatedFat:null,transFat:null,cholesterol:null,calcium:null,iron:null,vitaminD:null,vitaminC:null};
  try {
    const raw = await callGPT([
      { role: 'system', content: SCAN_SYSTEM_EXT },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${_settingsScanBase64}` } },
        { type: 'text', text: SCAN_USER_EXT },
      ]},
    ], 400, 'gpt-4o');
    let data;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim();
      data = JSON.parse(clean);
    } catch {
      showToast('파싱 실패 — 수동으로 입력하세요');
      data = EMPTY;
    }
    renderScanResult(data);
  } catch(e) {
    showToast('분석 실패: ' + e.message);
    renderScanResult(EMPTY);
  } finally {
    loading.style.display = 'none';
    btn.style.display = '';
  }
}

function renderScanResult(data) {
  const inp = (key, type, val) => {
    const meta = _SCAN_FIELDS.find(f => f.key === key);
    const isText = type === 'text';
    const v = val !== null && val !== undefined ? escapeHtml(String(val)) : '';
    return `<div class="input-group">
      <div class="input-lbl">${meta.label}</div>
      <input class="inp" id="ssf_${key}" type="${type}" value="${v}"${isText?' style="text-align:left;padding:7px 8px"':''}>
    </div>`;
  };
  const OPT = ['fiber','sugar','sodium','saturatedFat','transFat','cholesterol','calcium','iron','vitaminD','vitaminC'];
  const visibleOpt = OPT.filter(k => data[k] !== null && data[k] !== undefined);
  let html = `<div style="display:grid;grid-template-columns:2fr 1fr;gap:6px;margin-bottom:6px">
    ${inp('name','text',data.name)}${inp('serving','text',data.serving)}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:6px">
    ${inp('cal','number',data.cal)}${inp('ca','number',data.ca)}${inp('f','number',data.f)}${inp('p','number',data.p)}</div>`;
  if (visibleOpt.length > 0) {
    html += `<div class="scan-opt-grid">${visibleOpt.map(k => inp(k,'number',data[k])).join('')}</div>`;
  }
  document.getElementById('settingsScanFields').innerHTML = html;
  document.getElementById('settingsScanResultForm').style.display = 'block';
}

function saveSettingsScan() {
  const name = document.getElementById('ssf_name')?.value.trim();
  if (!name) { showToast('제품명을 입력하세요'); return; }
  const getN = id => { const el = document.getElementById(id); if (!el) return null; const v = el.value.trim(); return v === '' ? null : parseFloat(v); };
  const getS = id => { const el = document.getElementById(id); if (!el) return null; return el.value.trim() || null; };
  const food = {
    id: 'scan_' + Date.now(), nk: name.toLowerCase(), name,
    cal: getN('ssf_cal') ?? 0, ca: getN('ssf_ca') ?? 0, f: getN('ssf_f') ?? 0, p: getN('ssf_p') ?? 0,
    fiber: getN('ssf_fiber'), sugar: getN('ssf_sugar'), sodium: getN('ssf_sodium'),
    saturatedFat: getN('ssf_saturatedFat'), transFat: getN('ssf_transFat'), cholesterol: getN('ssf_cholesterol'),
    calcium: getN('ssf_calcium'), iron: getN('ssf_iron'), vitaminD: getN('ssf_vitaminD'), vitaminC: getN('ssf_vitaminC'),
    sk: getS('ssf_serving') || '1회 제공량',
  };
  const fs = gcf(); fs.push(food); scf(fs);
  showToast(`"${name}" 저장 완료 ✅`);
  document.getElementById('settingsScanResultForm').style.display = 'none';
  document.getElementById('settingsScanImg').style.display = 'none';
  document.getElementById('settingsScanPlaceholder').style.display = '';
  document.getElementById('settingsScanAnalyzeBtn').style.display = 'none';
  document.getElementById('settingsScanInput').value = '';
  _settingsScanBase64 = null;
  renderCFL();
}
