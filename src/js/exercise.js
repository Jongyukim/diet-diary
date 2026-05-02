// ===== 운동 상태 =====
let selCardio=null,selIntensity='low',selMuscle='가슴',selStrEx=null;

// ===== MET 칼로리 계산 =====
function calcCardioCalMET(exId,minutes,intensity,bw){const met=MET_CARDIO[exId]?MET_CARDIO[exId][intensity]:8;return Math.round(met*(bw||75)*(minutes/60));}
function calcStrengthCalMET(sets,reps,bw){return Math.round(MET_STRENGTH*(bw||75)*((sets*reps*0.04)/60));}

// ===== 유산소 UI =====
function initExUI(){
  const cg=document.getElementById('cardioGrid');
  const allC=[...cardioPresets,...getCE().filter(e=>e.type==='cardio').map(e=>({id:'ce_'+e.id,name:e.name,emoji:'⚡',cpm:{low:e.cpm,mid:Math.round(e.cpm*1.3),hi:Math.round(e.cpm*1.6)}}))];
  cg.innerHTML=allC.map(p=>`<div class="cardio-item${selCardio===p.id?' sel':''}" onclick="selCardioEx('${p.id}')" id="ci_${p.id}"><span class="cardio-emoji">${p.emoji}</span><div class="cardio-name">${p.name}</div></div>`).join('');
  const mt=document.getElementById('muscleTabs');
  mt.innerHTML=Object.keys(muscleGroups).map(g=>`<button class="mtab${g===selMuscle?' on':''}" onclick="selMuscleGrp('${g}',this)">${g}</button>`).join('');
  renderStrList();
}
function selCardioEx(id){selCardio=id;document.querySelectorAll('.cardio-item').forEach(e=>e.classList.remove('sel'));const el=document.getElementById('ci_'+id);if(el)el.classList.add('sel');updateCardioResult();}
function setIntensity(lvl,btn){selIntensity=lvl;document.querySelectorAll('.int-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');updateCardioResult();}
function updateCardioResult(){
  const min=parseFloat(document.getElementById('cardioMin').value)||0,dist=parseFloat(document.getElementById('cardioDist').value)||0,res=document.getElementById('cardioResult');
  if(!selCardio){res.innerHTML=`<span style="color:var(--t3);font-size:10px">운동을 선택하세요</span>`;return;}
  const allC=[...cardioPresets,...getCE().filter(e=>e.type==='cardio').map(e=>({id:'ce_'+e.id,cpm:{low:e.cpm,mid:Math.round(e.cpm*1.3),hi:Math.round(e.cpm*1.6)}}))];
  const p=allC.find(x=>x.id===selCardio);const cpm=p?p.cpm[selIntensity]:0;const cal=Math.round(cpm*(min||1));
  let pace='-';if(min>0&&dist>0){const pm=Math.floor(min/dist);const ps=Math.round((min/dist%1)*60);pace=`${pm}'${String(ps).padStart(2,'0')}""`;}
  document.getElementById('cardioPace').textContent=pace;
  res.innerHTML=`<span style="color:var(--t2);font-size:10px">${min?min+'분':''} ${dist?'· '+dist+'km':''}</span><span style="color:var(--red);font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px">-${cal} kcal</span>`;
}

// ===== 무산소 UI =====
function selMuscleGrp(g,btn){selMuscle=g;selStrEx=null;document.querySelectorAll('.mtab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');renderStrList();}
function getPrevRec(){const a=load();if(!a.days)return{};const r={};for(const k of Object.keys(a.days).sort().reverse()){if(k===localDK())continue;(a.days[k].exercises||[]).forEach(e=>{if(e.type==='strength'&&!r[e.name])r[e.name]={weight:e.weight,reps:e.reps,sets:e.sets};});}return r;}
function renderStrList(){const c=document.getElementById('strengthList');const exs=[...(muscleGroups[selMuscle]||[]),...getCE().filter(e=>e.type==='strength').map(e=>e.name)];const prev=getPrevRec();c.innerHTML=exs.map(name=>{const p=prev[name];return`<button class="str-btn${selStrEx===name?' sel':''}" onclick="selStrEx2('${name}',this)"><span>${name}</span><span class="str-prev">${p?`${p.weight}kg×${p.reps}×${p.sets}`:'첫 기록'}</span></button>`;}).join('');}
function selStrEx2(name,btn){selStrEx=name;document.querySelectorAll('.str-btn').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');const p=getPrevRec();if(p[name]){document.getElementById('strSets').value=p[name].sets||3;document.getElementById('strReps').value=p[name].reps||10;document.getElementById('strWeight').value=p[name].weight||0;}updateStrResult();}
function updateStrResult(){const sets=parseInt(document.getElementById('strSets').value)||0,reps=parseInt(document.getElementById('strReps').value)||0,weight=parseFloat(document.getElementById('strWeight').value)||0,res=document.getElementById('strengthResult');if(!selStrEx){res.innerHTML=`<span style="color:var(--t3);font-size:10px">운동을 선택하세요</span>`;return;}const vol=sets*reps*weight;const cal=Math.round(sets*reps*0.5);res.innerHTML=`<span style="color:var(--t2);font-size:10px">${sets}×${reps}×${weight}kg</span><div style="display:flex;gap:8px"><span style="color:var(--orange);font-family:'JetBrains Mono',monospace;font-weight:700">볼륨 ${vol}kg</span><span style="color:var(--red);font-family:'JetBrains Mono',monospace;font-weight:700">-${cal}kcal</span></div>`;}

// ===== 운동 추가 =====
function addCardio(){if(!selCardio){showToast('운동을 선택하세요');return;}const min=parseFloat(document.getElementById('cardioMin').value)||0;if(!min){showToast('시간을 입력하세요');return;}const dist=parseFloat(document.getElementById('cardioDist').value)||0;const allC=[...cardioPresets,...getCE().filter(e=>e.type==='cardio').map(e=>({id:'ce_'+e.id,name:e.name,cpm:{low:e.cpm,mid:Math.round(e.cpm*1.3),hi:Math.round(e.cpm*1.6)}}))];const p=allC.find(x=>x.id===selCardio);const bw=gd(localDK()).weight||latestW()||75;const cal=MET_CARDIO[selCardio]?calcCardioCalMET(selCardio,min,selIntensity,bw):Math.round((p?p.cpm[selIntensity]:8)*min);const k=localDK(),d=gd(k);d.exercises.push({type:'cardio',name:p?p.name:'커스텀',minutes:min,distance:dist,intensity:selIntensity,cal});sd(k,d);render();document.getElementById('cardioMin').value='';document.getElementById('cardioDist').value='';showToast(`${p?p.name:'운동'} 추가 ✅`);}
function addStrength(){if(!selStrEx){showToast('운동을 선택하세요');return;}const sets=parseInt(document.getElementById('strSets').value)||0,reps=parseInt(document.getElementById('strReps').value)||0,weight=parseFloat(document.getElementById('strWeight').value)||0;if(!sets||!reps){showToast('세트/횟수를 입력하세요');return;}const vol=sets*reps*weight;const bw2=gd(localDK()).weight||latestW()||75;const cal=calcStrengthCalMET(sets,reps,bw2);const k=localDK(),d=gd(k);d.exercises.push({type:'strength',name:selStrEx,sets,reps,weight,volume:vol,cal});sd(k,d);render();showToast(`${selStrEx} 추가 ✅`);}
function switchExTab(tab,btn){document.querySelectorAll('.ex-tab').forEach(b=>b.classList.remove('on'));document.querySelectorAll('.ex-section').forEach(s=>s.classList.remove('on'));btn.classList.add('on');document.getElementById('ex'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('on');}
function remEx(i){const k=localDK(),d=gd(k);d.exercises.splice(i,1);sd(k,d);render();}

// ===== 커스텀 운동 =====
function addCustomEx(){const n=document.getElementById('ceN').value.trim(),type=document.getElementById('ceType').value,cpm=parseFloat(document.getElementById('ceCpm').value);if(!n||!cpm)return;const ce=getCE();ce.push({id:'ce'+Date.now(),name:n,type,cpm});saveCE(ce);document.getElementById('ceN').value='';document.getElementById('ceCpm').value='';initExUI();renderCEL();showToast(`${n} 추가 ✅`);}
function remCE(i){const ce=getCE();ce.splice(i,1);saveCE(ce);initExUI();renderCEL();}
function renderCEL(){const ce=getCE();document.getElementById('ceList').innerHTML=ce.length?ce.map((e,i)=>`<div class="meal-item"><span class="meal-item-name">${e.name}</span><span class="badge ${e.type==='cardio'?'badge-cardio':'badge-strength'}">${e.type==='cardio'?'유산소':'무산소'}</span><span class="badge badge-cal">${e.cpm}cal/분</span><button class="del-btn" style="opacity:1" onclick="remCE(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join(''):`<div style="font-size:10px;color:var(--t3);padding:5px">없음</div>`;}

// ===== 체중 빠른입력 =====
function updateWeightBar(){
  const k=localDK(),d=gd(k);
  const cw=d.weight||null;
  const prev=getPrevWeight();
  document.getElementById('wbVal').textContent=cw?cw.toFixed(1):'--';
  if(cw)document.getElementById('wbInp').value=cw;
  const trend=document.getElementById('wbTrend');
  if(cw&&prev&&cw!==prev){const diff=(cw-prev).toFixed(1);const up=cw>prev;trend.className='weight-trend '+(up?'up':'down');trend.textContent=(up?'▲ +':'▼ ')+diff+'kg';}
  else if(prev){trend.className='weight-trend same';trend.textContent='이전 '+prev.toFixed(1)+'kg';}
  else{trend.textContent='';}
}
function saveWeightQuick(){const v=parseFloat(document.getElementById('wbInp').value);if(!v||v<30||v>200){showToast('체중을 확인하세요');return;}const k=localDK(),d=gd(k);d.weight=v;sd(k,d);updateWeightBar();render();showToast(v+'kg 저장 ✅');}
