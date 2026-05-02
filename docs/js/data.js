// ===== CONFIG =====
const CLIENT_ID = '546059197875-saharo5c9464f6i0ftal8d9sab831rq3.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE_NAME = 'diet-diary-data.json';
const THEMES = ['dark','light'];
let themeIdx = 0;

// ===== 로컬 스토리지 =====
const SK = 'dietDiary_v3';
function load(){try{return JSON.parse(localStorage.getItem(SK))||{};}catch{return{};}}
function save(d){d.lastModified=Date.now();localStorage.setItem(SK,JSON.stringify(d));autoSync();}
function gd(k){const a=load();if(!a.days)a.days={};if(!a.days[k])a.days[k]={meals:{},exercises:[],comment:'',water:0,weight:null,vitamin:false};slots.forEach(s=>{if(!a.days[k].meals[s])a.days[k].meals[s]=[];});return a.days[k];}
function sd(k,d){const a=load();if(!a.days)a.days={};a.days[k]=d;save(a);}
function gs(){const a=load();return a.settings||{targetCal:1500,targetCarb:150,targetFat:50,targetPro:140,height:175,goalWeight:68,age:24};}
function ss(s){const a=load();a.settings=s;save(a);}
function gcf(){return load().customFoods||[];}
function scf(f){const a=load();a.customFoods=f;save(a);}
function getCE(){return load().customExercises||[];}
function saveCE(e){const a=load();a.customExercises=e;save(a);}
function getTemplates(){return load().templates||[];}
function saveTemplates(t){const a=load();a.templates=t;save(a);}

// ===== 날짜 유틸 =====
function localDK(d){const dd=d||cDate;return`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;}

// ===== 분석 유틸 =====
function calcBMR(s,w){return Math.round(10*(w||75)+6.25*(s.height||175)-5*(s.age||24)+5);}
function latestW(){const a=load();if(!a.days)return null;for(const k of Object.keys(a.days).sort().reverse())if(a.days[k].weight)return a.days[k].weight;return null;}
function startW(){const a=load();if(!a.days)return null;for(const k of Object.keys(a.days).sort())if(a.days[k].weight)return a.days[k].weight;return null;}
function streak(){const a=load();if(!a.days)return 0;let s=0;const t=new Date();for(let i=0;i<365;i++){const d=new Date(t);d.setDate(d.getDate()-i);const k=localDK(d);const dy=a.days[k];if(dy&&slots.some(sl=>(dy.meals[sl]||[]).length>0))s++;else if(i>0)break;}return s;}
function hasRecord(dy){if(!dy)return false;return slots.some(sl=>(dy.meals[sl]||[]).length>0);}
function calcCumDef(){const a=load(),s=gs();if(!a.days)return 0;let cum=0;Object.keys(a.days).forEach(k=>{const d=a.days[k];if(!hasRecord(d))return;let tc=0;slots.forEach(sl=>(d.meals[sl]||[]).forEach(i=>tc+=i.cal||0));const exC=(d.exercises||[]).reduce((s,e)=>s+e.cal,0);const w=d.weight||latestW()||75;cum+=calcBMR(s,w)-tc+exC;});return Math.max(0,cum);}
function getPrevWeight(){const a=load();if(!a.days)return null;const today=localDK();for(const k of Object.keys(a.days).sort().reverse()){if(k>=today)continue;if(a.days[k].weight)return a.days[k].weight;}return null;}

// ===== Drive =====
let accessToken=null,driveFileId=null,_syncTimer=null,_autoTimer=null;

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(_syncTimer);_syncTimer=setTimeout(()=>t.classList.remove('show'),2500);}
function updateDriveUI(){const dot=document.getElementById('driveDot'),lbl=document.getElementById('driveLabel'),info=document.getElementById('driveInfo');if(accessToken){dot.className='drive-dot on';lbl.textContent='Drive';if(info)info.textContent='✅ 연결됨 — 변경 시 자동 저장';}else{dot.className='drive-dot off';lbl.textContent='Drive';if(info)info.textContent='❌ 연결 안 됨';}}
function handleDriveClick(){if(accessToken){accessToken=null;driveFileId=null;localStorage.removeItem('dd_token');updateDriveUI();showToast('Drive 연결 해제');}else loginDrive();}
function loginDrive(){const c=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPES,callback:async(r)=>{if(r.error){showToast('로그인 실패 ❌');return;}accessToken=r.access_token;localStorage.setItem('dd_token',accessToken);updateDriveUI();await findDriveFile();if(driveFileId){const ok=confirm('Drive에 저장된 데이터가 있어요. 불러올까요?');if(ok)await syncFromDrive();}else showToast('Drive 연결 완료 ✅');}});c.requestAccessToken();}
async function findDriveFile(){if(!accessToken)return;try{const r=await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false&fields=files(id)`,{headers:{Authorization:`Bearer ${accessToken}`}});const d=await r.json();if(d.files&&d.files.length>0)driveFileId=d.files[0].id;}catch(e){}}
async function syncToDrive(){if(!accessToken){showToast('먼저 Drive에 연결하세요');return;}try{showToast('저장 중...');const c=JSON.stringify(load(),null,2);if(!driveFileId)await findDriveFile();if(driveFileId){await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=media`,{method:'PATCH',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:c});}else{const b='dd_b';const m=`{"name":"${DRIVE_FILE_NAME}","mimeType":"application/json"}`;const body=`--${b}\r\nContent-Type: application/json\r\n\r\n${m}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${c}\r\n--${b}--`;const r=await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':`multipart/related; boundary=${b}`},body});driveFileId=(await r.json()).id;}showToast('Drive 저장 완료 ✅');}catch(e){showToast('저장 실패 ❌');}}
async function syncFromDrive(){if(!accessToken){showToast('먼저 Drive에 연결하세요');return;}try{showToast('불러오는 중...');if(!driveFileId)await findDriveFile();if(!driveFileId){showToast('Drive에 데이터 없음');return;}const r=await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,{headers:{Authorization:`Bearer ${accessToken}`}});const dd=await r.json();const ld=load();if((dd.lastModified||0)>=(ld.lastModified||0)){localStorage.setItem(SK,JSON.stringify(dd));showToast('불러오기 완료 ✅');}else{showToast('로컬이 더 최신 → Drive 업로드');await syncToDrive();return;}render();}catch(e){showToast('불러오기 실패 ❌');}}
function autoSync(){if(!accessToken)return;clearTimeout(_autoTimer);_autoTimer=setTimeout(()=>syncToDrive(),3000);}

// ===== 내보내기/불러오기 =====
function exportJSON(){const b=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`diet-diary-${localDK(new Date())}.json`;a.click();URL.revokeObjectURL(u);}
function importJSON(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{save(JSON.parse(ev.target.result));render();showToast('불러오기 완료 ✅');}catch{showToast('오류 ❌');}};r.readAsText(f);e.target.value='';}
