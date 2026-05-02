// ===== 앱 상태 =====
let cDate=new Date(),cSlot='';
let selFoods=new Map();

// ===== 음식 모달 =====
function allF(){return[...gcf().map(f=>({...f,star:true})),...presets];}
function openM(sl){
  cSlot=sl;selFoods=new Map();
  document.getElementById('fSrch').value='';
  document.getElementById('manualForm').classList.remove('on');
  document.getElementById('fModal').classList.add('on');
  filterF();renderTemplates();
  setTimeout(()=>document.getElementById('fSrch').focus(),100);
}
function closeM(){document.getElementById('fModal').classList.remove('on');}
function filterF(){
  const q=document.getElementById('fSrch').value.toLowerCase();
  const all=allF();
  const fil=q?all.filter(f=>(f.nk||f.name||'').toLowerCase().includes(q)):all;
  document.getElementById('fList').innerHTML=fil.map(f=>{
    const id=f.id,nm=f.nk||f.name,sv=f.sk||'',checked=selFoods.has(id),qty=selFoods.get(id)||1;
    return`<div class="food-item${checked?' checked':''}" data-fid="${id}" onclick="toggleFood('${id}')">
      <div class="food-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div class="food-info"><div class="food-name">${f.star?'★ ':''}${nm}</div><div class="food-sub">${sv}</div></div>
      <div class="food-macro">${f.cal}kcal · ${f.ca||0}c ${f.f||0}f ${f.p||0}p</div>
      <div class="fqty" style="display:${checked?'flex':'none'};align-items:center;gap:4px;margin-left:6px" onclick="event.stopPropagation()">
        <button class="fqty-btn" onclick="changeQty('${id}',-1)">－</button>
        <span class="fqty-val" style="font-family:monospace;font-size:11px;font-weight:700;min-width:28px;text-align:center">${qty}</span>
        <button class="fqty-btn" onclick="changeQty('${id}',1)">＋</button>
      </div>
    </div>`;
  }).join('');
  updateSelCount();
}
function toggleFood(id){
  if(selFoods.has(id)){selFoods.delete(id);}else{selFoods.set(id,1);}
  const el=document.querySelector(`[data-fid="${id}"]`);
  if(el){
    if(selFoods.has(id)){el.classList.add('checked');el.querySelector('.fqty').style.display='flex';}
    else{el.classList.remove('checked');el.querySelector('.fqty').style.display='none';}
  }
  updateSelCount();
}
function changeQty(id,delta){
  if(!selFoods.has(id))return;
  const f=allF().find(x=>x.id===id);
  const step=f&&f.sk&&f.sk.includes('g')?50:0.5;
  const cur=selFoods.get(id)||1;
  const nv=Math.max(0.5,Math.round((cur+delta*step)*10)/10);
  selFoods.set(id,nv);
  const el=document.querySelector(`[data-fid="${id}"]`);
  if(el){el.querySelector('.fqty-val').textContent=nv;}
  updateSelCount();
}
function updateSelCount(){
  const c=document.getElementById('selCount');
  if(selFoods.size>0){
    const total=Array.from(selFoods.entries()).reduce((s,[id,qty])=>{const f=allF().find(x=>x.id===id);return s+(f?f.cal*qty:0);},0);
    c.textContent=`${selFoods.size}개 선택 · ${Math.round(total)} kcal`;
  }else{c.textContent='';}
}
function clearSel(){selFoods=new Map();filterF();}
function confirmMulti(){
  if(selFoods.size===0){showToast('음식을 선택하세요');return;}
  const k=localDK(),d=gd(k);
  selFoods.forEach((qty,id)=>{
    const f=allF().find(x=>x.id===id);if(!f)return;
    const nm=qty!==1?`${f.nk||f.name} x${qty}`:(f.nk||f.name);
    const sc=v=>v!=null?Math.round(v*qty*10)/10:null;
    d.meals[cSlot].push({
      name:nm,cal:f.cal*qty,ca:(f.ca||0)*qty,f:(f.f||0)*qty,p:(f.p||0)*qty,
      fiber:sc(f.fiber),sugar:sc(f.sugar),sodium:sc(f.sodium),
      saturatedFat:sc(f.saturatedFat),transFat:sc(f.transFat),cholesterol:sc(f.cholesterol),
      calcium:sc(f.calcium),iron:sc(f.iron),vitaminD:sc(f.vitaminD),vitaminC:sc(f.vitaminC),
    });
  });
  sd(k,d);closeM();render();showToast(`${selFoods.size}개 추가 ✅`);
}
function toggleManual(){document.getElementById('manualForm').classList.toggle('on');}
function addCFM(){const n=document.getElementById('cfNM').value.trim();if(!n)return;const k=localDK(),d=gd(k);d.meals[cSlot].push({name:n,cal:parseFloat(document.getElementById('cfCM').value)||0,ca:parseFloat(document.getElementById('cfCaM').value)||0,f:parseFloat(document.getElementById('cfFM2').value)||0,p:parseFloat(document.getElementById('cfPM').value)||0});sd(k,d);closeM();render();}

// ===== 템플릿 =====
function saveTemplate(){
  const name=document.getElementById('tplName').value.trim();
  if(!name){showToast('템플릿 이름을 입력하세요');return;}
  if(selFoods.size===0){showToast('음식을 먼저 선택하세요');return;}
  const items=Array.from(selFoods.entries()).map(([id,qty])=>{const f=allF().find(x=>x.id===id);return f?{...f,qty}:null;}).filter(Boolean);
  const ts=getTemplates();ts.push({id:'t'+Date.now(),name,items:items.map(f=>({id:f.id,nk:f.nk||f.name,cal:f.cal,ca:f.ca||0,f:f.f||0,p:f.p||0}))});
  saveTemplates(ts);document.getElementById('tplName').value='';renderTemplates();showToast(`"${name}" 템플릿 저장 ✅`);
}
function applyTemplate(id){
  const t=getTemplates().find(x=>x.id===id);if(!t)return;
  const k=localDK(),d=gd(k);
  t.items.forEach(f=>d.meals[cSlot].push({name:f.nk,cal:f.cal,ca:f.ca,f:f.f,p:f.p}));
  sd(k,d);closeM();render();showToast(`"${t.name}" 적용 ✅`);
}
function delTemplate(id,e){e.stopPropagation();const ts=getTemplates().filter(x=>x.id!==id);saveTemplates(ts);renderTemplates();showToast('템플릿 삭제');}
function renderTemplates(){
  const ts=getTemplates();
  const el=document.getElementById('templateList');
  el.innerHTML=ts.length?ts.map(t=>`<div class="template-chip" onclick="applyTemplate('${t.id}')"><span>${t.name}</span><span class="chip-del" onclick="delTemplate('${t.id}',event)">✕</span></div>`).join(''):`<span style="font-size:10px;color:var(--t3)">저장된 템플릿 없음</span>`;
}

// ===== 커스텀 식품 =====
function addCF(){const n=document.getElementById('ncfN').value.trim();if(!n)return;const fs=gcf();fs.push({id:'c'+Date.now(),nk:n,name:n,cal:parseFloat(document.getElementById('ncfC').value)||0,ca:parseFloat(document.getElementById('ncfCa').value)||0,f:parseFloat(document.getElementById('ncfFa').value)||0,p:parseFloat(document.getElementById('ncfP').value)||0,sk:document.getElementById('ncfS').value||'1인분'});scf(fs);['ncfN','ncfC','ncfCa','ncfFa','ncfP','ncfS'].forEach(id=>document.getElementById(id).value='');render();}
function remCF(i){const f=gcf();f.splice(i,1);scf(f);render();}
function renderCFL(){
  const fs=gcf();
  document.getElementById('cfList').innerHTML=fs.length?fs.map((f,i)=>{
    const ext=[
      f.fiber!=null?`섬유 ${f.fiber}g`:'',
      f.sodium!=null?`나트륨 ${f.sodium}mg`:'',
      f.sugar!=null?`당 ${f.sugar}g`:'',
      f.saturatedFat!=null?`포화지방 ${f.saturatedFat}g`:'',
    ].filter(Boolean).map(t=>`<span class="badge badge-c">${t}</span>`).join('');
    return`<div class="meal-item"><span class="meal-item-name">${f.nk||f.name}</span><div class="meal-badges"><span class="badge badge-cal">${f.cal}</span>${ext}</div><button class="del-btn" style="opacity:1" onclick="remCF(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;
  }).join(''):`<div style="font-size:10px;color:var(--t3);padding:5px">없음</div>`;
}

// ===== 메인 렌더 =====
function render(){
  const k=localDK(),d=gd(k),s=gs();
  document.getElementById('dateMain').textContent=`${cDate.getFullYear()}.${String(cDate.getMonth()+1).padStart(2,'0')}.${String(cDate.getDate()).padStart(2,'0')}`;
  document.getElementById('dateSub').textContent=dNames[cDate.getDay()]+'요일';
  let tc=0,tca=0,tf=0,tp=0;slots.forEach(sl=>(d.meals[sl]||[]).forEach(i=>{tc+=i.cal||0;tca+=i.ca||i.carb||0;tf+=i.f||i.fat||0;tp+=i.p||i.protein||0;}));
  const exCal=(d.exercises||[]).reduce((s,e)=>s+e.cal,0);
  document.getElementById('rCalV').textContent=Math.round(tc);
  document.getElementById('ringCal').style.strokeDashoffset=circ*(1-Math.min(1,tc/s.targetCal));
  document.getElementById('mC').textContent=Math.round(tca)+'g';document.getElementById('mF').textContent=Math.round(tf)+'g';document.getElementById('mP').textContent=Math.round(tp)+'g';
  document.getElementById('bC').style.width=Math.min(100,Math.round(tca/s.targetCarb*100))+'%';document.getElementById('bF').style.width=Math.min(100,Math.round(tf/s.targetFat*100))+'%';document.getElementById('bP').style.width=Math.min(100,Math.round(tp/s.targetPro*100))+'%';
  const totG=tca+tf+tp;let ra='';
  if(totG>0){const cP=Math.round(tca/totG*100),fP=Math.round(tf/totG*100),pP=Math.round(tp/totG*100);const sc=Math.abs(cP-50)+Math.abs(pP-30)+Math.abs(fP-20);const cls=sc<=15?'good':sc<=30?'warn':'bad';ra=`<div class="ratio-bar"><div style="width:${cP}%;background:var(--blue)"></div><div style="width:${pP}%;background:var(--purple)"></div><div style="width:${fP}%;background:var(--orange)"></div></div><div class="ratio-labels"><span style="color:var(--blue)">탄 ${cP}%</span><span style="color:var(--purple)">단 ${pP}%</span><span style="color:var(--orange)">지 ${fP}%</span></div><div class="ratio-msg ${cls}">${sc<=15?'매크로 비율 좋아요 👍':'비율 조정이 필요해요'}</div>`;}
  document.getElementById('ratioArea').innerHTML=ra;
  const cw=d.weight||latestW()||75;const bmr=calcBMR(s,cw);const todayDef=bmr-Math.round(tc)+exCal;const cumDef=calcCumDef();const theoLoss=(cumDef/7700).toFixed(2);
  document.getElementById('deficitRow').innerHTML=`<div class="def-cell"><div class="def-val" style="color:var(--t2)">${bmr}</div><div class="def-lbl">기초대사량</div></div><div class="def-cell"><div class="def-val ${todayDef>=0?'pos':'neg'}">${todayDef>=0?'+':''}${todayDef}</div><div class="def-lbl">오늘 경감</div></div><div class="def-cell"><div class="def-val pos">-${theoLoss}</div><div class="def-lbl">이론 감량(kg)</div></div>`;
  const w=d.water||0;document.getElementById('waterSlider').value=w;document.getElementById('waterN').textContent=w;document.getElementById('waterFill').style.width=Math.min(100,(w/2000)*100)+'%';
  const vb=document.getElementById('vitBtn');d.vitamin?vb.classList.add('on'):vb.classList.remove('on');
  let mh='';slots.forEach(sl=>{const items=d.meals[sl]||[];const slC=items.reduce((s,i)=>s+(i.cal||0),0);
  mh+=`<div class="meal-slot"><div class="meal-slot-head"><div class="meal-slot-name"><span class="meal-slot-icon">${slotIcons[sl]}</span>${sN[sl]}</div><span class="meal-slot-cal">${Math.round(slC)}</span></div>${items.map((it,idx)=>`<div class="meal-item"><span class="meal-item-name">${it.name}</span><div class="meal-badges"><span class="badge badge-cal">${Math.round(it.cal)}</span><span class="badge badge-c">${Math.round(it.ca||it.carb||0)}c</span><span class="badge badge-f">${Math.round(it.f||it.fat||0)}f</span><span class="badge badge-p">${Math.round(it.p||it.protein||0)}p</span></div><button class="del-btn" onclick="remMI('${sl}',${idx})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('')}<button class="add-btn" onclick="openM('${sl}')">+ 추가</button></div>`;});
  document.getElementById('mealArea').innerHTML=mh;
  document.getElementById('exLogList').innerHTML=(d.exercises||[]).map((e,i)=>{let b='';if(e.type==='cardio'){b+=`<span class="badge badge-cardio">${e.minutes}분${e.distance?' · '+e.distance+'km':''}</span>`;}else{b+=`<span class="badge badge-strength">${e.sets}×${e.reps}×${e.weight}kg</span><span class="badge badge-vol">${e.volume||0}kg</span>`;}b+=`<span class="badge badge-kcal">-${e.cal}kcal</span>`;return`<div class="ex-log-item"><span class="ex-log-name">${e.type==='cardio'?'🏃':'🏋️'} ${e.name}</span><div class="ex-log-badges">${b}</div><button class="del-btn" onclick="remEx(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;}).join('');
  document.getElementById('exTotalCal').textContent=exCal;
  document.getElementById('commentTA').value=d.comment||'';
  document.getElementById('iH').value=s.height||'';document.getElementById('iW').value=d.weight||'';document.getElementById('iG').value=s.goalWeight||'';document.getElementById('iAge').value=s.age||'';
  if(cw&&s.goalWeight){const rem=Math.max(0,cw-s.goalWeight);document.getElementById('gR').textContent=rem.toFixed(1);const sw=startW(),tot=sw?(sw-s.goalWeight):(cw-s.goalWeight),lost=sw?(sw-cw):0,wp=tot>0?Math.min(100,Math.round(lost/tot*100)):0;document.getElementById('gFi').style.width=Math.max(0,wp)+'%';document.getElementById('gPct').textContent=Math.max(0,wp);}
  if(cw&&s.height)document.getElementById('gBMI').textContent=(cw/((s.height/100)**2)).toFixed(1);
  document.getElementById('sCal').value=s.targetCal;document.getElementById('sCarb').value=s.targetCarb;document.getElementById('sFat').value=s.targetFat;document.getElementById('sPro').value=s.targetPro;
  document.getElementById('streakN').textContent=streak();
  renderCFL();renderCEL();updateDriveUI();initExUI();updateWeightBar();
}

// ===== 액션 =====
function moveDate(n){cDate.setDate(cDate.getDate()+n);render();}
function setWater(v){const k=localDK(),d=gd(k);d.water=parseInt(v);sd(k,d);document.getElementById('waterN').textContent=v;document.getElementById('waterFill').style.width=Math.min(100,(v/2000)*100)+'%';}
function toggleVit(){const k=localDK(),d=gd(k);d.vitamin=!d.vitamin;sd(k,d);render();}
function remMI(sl,i){const k=localDK(),d=gd(k);d.meals[sl].splice(i,1);sd(k,d);render();}
function saveComment(){const k=localDK(),d=gd(k);d.comment=document.getElementById('commentTA').value;sd(k,d);}
function saveBS(){const s=gs();s.height=parseFloat(document.getElementById('iH').value)||s.height;s.goalWeight=parseFloat(document.getElementById('iG').value)||s.goalWeight;s.age=parseInt(document.getElementById('iAge').value)||s.age;ss(s);const k=localDK(),d=gd(k),w=parseFloat(document.getElementById('iW').value);if(w)d.weight=w;sd(k,d);render();}
function saveTgt(){const s=gs();s.targetCal=parseInt(document.getElementById('sCal').value)||1500;s.targetCarb=parseInt(document.getElementById('sCarb').value)||150;s.targetFat=parseInt(document.getElementById('sFat').value)||50;s.targetPro=parseInt(document.getElementById('sPro').value)||140;ss(s);render();}
function go(p,btn){document.querySelectorAll('.page').forEach(e=>e.classList.remove('on'));document.getElementById(p).classList.add('on');document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('on'));if(btn)btn.classList.add('on');if(p==='pCharts'){renderCharts();renderHeatmap();}if(p==='pAI'){initAITab();}}
function cycleTheme(){
  themeIdx=(themeIdx+1)%THEMES.length;
  const t=THEMES[themeIdx];
  document.body.setAttribute('data-theme',t);
  localStorage.setItem('dd_theme',t);
  const labels={dark:'🌙 다크',light:'☀️ 라이트'};
  showToast(labels[t]);
}
