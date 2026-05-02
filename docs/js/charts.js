// ===== 통계 상태 =====
let cPer=7,charts={};

// ===== 기간 선택 =====
function setPer(n,btn){cPer=n;document.querySelectorAll('.period-tab').forEach(b=>b.classList.remove('on'));if(btn)btn.classList.add('on');renderCharts();}

// ===== 차트 렌더 =====
function renderCharts(){
  const a=load(),s=gs();if(!a.days)return;
  const labs=[],cals=[],cas=[],fts=[],ps=[],ws=[],defs=[];
  const t=new Date();let cumD=0;
  const pStart=new Date(t);pStart.setDate(pStart.getDate()-(cPer-1));const psK=localDK(pStart);
  Object.keys(a.days||{}).sort().forEach(k=>{if(k>=psK)return;const dy=a.days[k];if(!hasRecord(dy))return;let tc=0;slots.forEach(sl=>(dy.meals[sl]||[]).forEach(i=>tc+=i.cal||0));const exC=(dy.exercises||[]).reduce((s,e)=>s+e.cal,0);cumD+=calcBMR(s,dy.weight||75)-tc+exC;});
  for(let i=cPer-1;i>=0;i--){
    const d=new Date(t);d.setDate(d.getDate()-i);const k=localDK(d);
    const dy=a.days[k];
    if(dy&&hasRecord(dy)){
      let tc=0,tca=0,tf=0,tp=0;
      slots.forEach(sl=>(dy.meals[sl]||[]).forEach(it=>{tc+=it.cal||0;tca+=it.ca||it.carb||0;tf+=it.f||it.fat||0;tp+=it.p||it.protein||0;}));
      const exC=(dy.exercises||[]).reduce((s,e)=>s+e.cal,0);
      cumD+=calcBMR(s,dy.weight||75)-tc+exC;
      labs.push(k.slice(5));cals.push(Math.round(tc));cas.push(Math.round(tca));fts.push(Math.round(tf));ps.push(Math.round(tp));ws.push(dy.weight||null);defs.push(Math.round(cumD));
    }else{
      labs.push(k.slice(5));cals.push(null);cas.push(null);fts.push(null);ps.push(null);ws.push(null);defs.push(Math.round(cumD));
    }
  }
  const co={responsive:true,plugins:{legend:{labels:{color:'#777',font:{size:9,family:'Outfit'}}}},scales:{x:{ticks:{color:'#555',font:{size:8}},grid:{color:'rgba(128,128,128,.05)'}},y:{ticks:{color:'#555',font:{size:8}},grid:{color:'rgba(128,128,128,.05)'}}}};
  Object.values(charts).forEach(c=>c.destroy());charts={};
  charts.cal=new Chart(document.getElementById('cCal'),{type:'bar',data:{labels:labs,datasets:[{label:'kcal',data:cals,backgroundColor:cals.map(c=>c===null?'rgba(128,128,128,.1)':c>s.targetCal?'rgba(251,113,133,.3)':'rgba(110,231,183,.3)'),borderColor:cals.map(c=>c===null?'transparent':c>s.targetCal?'#fb7185':'#6ee7b7'),borderWidth:1,borderRadius:5}]},options:co});
  charts.mac=new Chart(document.getElementById('cMac'),{type:'line',data:{labels:labs,datasets:[{label:'탄',data:cas,borderColor:'#7dd3fc',backgroundColor:'rgba(125,211,252,.05)',tension:.4,fill:true,pointRadius:2,spanGaps:false},{label:'지',data:fts,borderColor:'#fdba74',backgroundColor:'rgba(253,186,116,.05)',tension:.4,fill:true,pointRadius:2,spanGaps:false},{label:'단',data:ps,borderColor:'#c4b5fd',backgroundColor:'rgba(196,181,253,.05)',tension:.4,fill:true,pointRadius:2,spanGaps:false}]},options:co});
  const vw=ws.filter(w=>w!==null);if(vw.length)charts.wt=new Chart(document.getElementById('cWt'),{type:'line',data:{labels:labs,datasets:[{label:'kg',data:ws,borderColor:'#6ee7b7',backgroundColor:'rgba(110,231,183,.06)',tension:.4,fill:true,spanGaps:true,pointRadius:2.5,pointBackgroundColor:'#6ee7b7'}]},options:{...co,scales:{...co.scales,y:{...co.scales.y,suggestedMin:Math.min(...vw)-2,suggestedMax:Math.max(...vw)+2}}}});
  charts.def=new Chart(document.getElementById('cDef'),{type:'line',data:{labels:labs,datasets:[{label:'누적경감(kcal)',data:defs,borderColor:'#6ee7b7',backgroundColor:'rgba(110,231,183,.07)',tension:.35,fill:true,pointRadius:2},{label:'감량(kg)',data:defs.map(d=>(d/7700).toFixed(2)),borderColor:'#c4b5fd',backgroundColor:'rgba(196,181,253,.04)',tension:.35,fill:false,pointRadius:2,yAxisID:'y1'}]},options:{...co,scales:{...co.scales,y1:{position:'right',ticks:{color:'#555',font:{size:8}},grid:{display:false}}}}});
}

// ===== 히트맵 =====
function renderHeatmap(){
  const a=load();const days=a.days||{};
  const WEEKS=16;const S=13;const G=3;const W=S+G;
  const COLS=WEEKS;const ROWS=7;
  const PAD_LEFT=24;const PAD_TOP=20;
  const svgW=PAD_LEFT+COLS*W;const svgH=PAD_TOP+ROWS*W;
  const svg=document.getElementById('heatmapSvg');
  svg.setAttribute('width',svgW);svg.setAttribute('height',svgH);
  svg.setAttribute('viewBox','0 0 '+svgW+' '+svgH);

  const today=new Date();today.setHours(0,0,0,0);
  const todayDay=today.getDay();
  const start=new Date(today);
  start.setDate(today.getDate()-todayDay-(WEEKS-1)*7);

  let html='';
  let recordDays=0,cur=0,maxStreak=0,streakCnt=0;
  let prevMonth=-1;

  const dayLabels=['일','','화','','목','','토'];
  dayLabels.forEach((d,i)=>{
    if(!d)return;
    html+='<text x="'+(PAD_LEFT-4)+'" y="'+(PAD_TOP+i*W+S*0.75)+'" text-anchor="end" font-size="9" fill="var(--t3)" font-family="JetBrains Mono, monospace">'+d+'</text>';
  });

  for(let w=0;w<WEEKS;w++){
    for(let dw=0;dw<7;dw++){
      const d=new Date(start);d.setDate(start.getDate()+w*7+dw);
      const isFuture=d>today;
      const ky=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      const isToday=ky===localDK();
      const dy=days[ky];const rec=!isFuture&&hasRecord(dy);

      if(dw===0&&d.getMonth()!==prevMonth){
        prevMonth=d.getMonth();
        const mLabel=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'][d.getMonth()];
        html+='<text x="'+(PAD_LEFT+w*W)+'" y="'+(PAD_TOP-5)+'" font-size="9" fill="var(--t3)" font-family="JetBrains Mono, monospace">'+mLabel+'</text>';
      }

      let fill='var(--s3)';
      if(isFuture){fill='transparent';}
      else if(rec){
        recordDays++;cur++;
        let tc=0;slots.forEach(sl=>(dy.meals[sl]||[]).forEach(i=>tc+=i.cal||0));
        if(tc>1500)fill='var(--accent)';
        else if(tc>1200)fill='rgba(110,231,183,.75)';
        else if(tc>800)fill='rgba(110,231,183,.45)';
        else fill='rgba(110,231,183,.2)';
      }else{if(cur>maxStreak)maxStreak=cur;cur=0;}

      const x=PAD_LEFT+w*W;const y=PAD_TOP+dw*W;
      const stroke=isToday?'var(--accent)':'none';
      const sw=isToday?'1.5':'0';
      if(!isFuture){
        html+='<rect x="'+x+'" y="'+y+'" width="'+S+'" height="'+S+'" rx="3" ry="3" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"><title>'+ky+(rec?' ✓':'')+'</title></rect>';
      }
    }
  }
  if(cur>maxStreak)maxStreak=cur;
  for(let i=0;i<365;i++){const d=new Date(today);d.setDate(d.getDate()-i);const ky=localDK(d);if(hasRecord(days[ky]))streakCnt++;else if(i>0)break;}

  svg.innerHTML=html;
  document.getElementById('hmStats').innerHTML=
    '<div class="heatmap-stat">연속 <strong>'+streakCnt+'일</strong></div>'+
    '<div class="heatmap-stat">최장 <strong>'+maxStreak+'일</strong></div>'+
    '<div class="heatmap-stat">총 기록 <strong>'+recordDays+'일</strong></div>'+
    '<div class="heatmap-legend"><span>적음</span>'+
    ['transparent','rgba(110,231,183,.2)','rgba(110,231,183,.45)','rgba(110,231,183,.75)','var(--accent)'].map(c=>'<svg width="11" height="11"><rect width="11" height="11" rx="2" fill="'+c+'" stroke="var(--border)"/></svg>').join('')+
    '<span>많음</span></div>';
}
