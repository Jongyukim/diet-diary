// ===== 날짜/슬롯 상수 =====
const slots = ['breakfast','lunch','snack','dinner','preworkout','postworkout'];
const sN = {breakfast:'아침',lunch:'점심',snack:'간식',dinner:'저녁',preworkout:'운동 전',postworkout:'운동 후'};
const slotIcons = {
  breakfast:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>',
  lunch:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>',
  snack:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8v4l3 3"/></svg>',
  dinner:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
  preworkout:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  postworkout:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
};
const dNames = ['일','월','화','수','목','금','토'];
const circ = 2*Math.PI*37;

// ===== 운동 프리셋 =====
const cardioPresets = [
  {id:'run',name:'달리기',emoji:'🏃',cpm:{low:7,mid:10,hi:13}},
  {id:'walk',name:'걷기',emoji:'🚶',cpm:{low:3,mid:4,hi:5}},
  {id:'cycle',name:'사이클',emoji:'🚴',cpm:{low:5,mid:7,hi:10}},
  {id:'swim',name:'수영',emoji:'🏊',cpm:{low:6,mid:8,hi:11}},
  {id:'jump',name:'줄넘기',emoji:'🪢',cpm:{low:8,mid:10,hi:13}},
  {id:'tread',name:'트레드밀',emoji:'⚡',cpm:{low:6,mid:9,hi:12}}
];

const muscleGroups = {
  '가슴':['벤치프레스','인클라인 벤치','덤벨 플라이','체스트 프레스','푸쉬업'],
  '등':['풀업','바벨 로우','시티드 로우','랫풀다운','원암 덤벨 로우'],
  '어깨':['숄더프레스','사이드 레이즈','프론트 레이즈','페이스풀','업라이트 로우'],
  '하체':['스쿼트','레그프레스','런지','레그 익스텐션','레그 컬'],
  '팔':['바이셉 컬','해머 컬','트라이셉 푸쉬다운','오버헤드 익스텐션','딥스'],
  '복근':['크런치','플랭크','레그레이즈','러시안 트위스트']
};

// ===== 식품 프리셋 =====
const presets = [
  {id:'hg1',nk:'홀그레인 빵',cal:85,ca:16,f:1,p:3.5,sk:'1조각'},
  {id:'ww1',nk:'통밀빵',cal:135,ca:23.5,f:1.5,p:4.5,sk:'1조각'},
  {id:'egg',nk:'삶은 계란',cal:60,ca:.5,f:4,p:6,sk:'1개'},
  {id:'cq',nk:'코티지 치즈 1/4컵',cal:45,ca:1.5,f:2,p:8,sk:'1/4컵'},
  {id:'ch',nk:'코티지 치즈 1/2컵',cal:90,ca:3,f:4,p:16,sk:'1/2컵'},
  {id:'gy',nk:'그릭 요거트 1/2컵',cal:90,ca:7,f:5,p:10,sk:'1/2컵'},
  {id:'cb',nk:'닭가슴살 100g',cal:125,ca:0,f:1.5,p:24,sk:'100g'},
  {id:'ps',nk:'프로틴 1스쿱',cal:190,ca:7,f:2,p:30,sk:'1스쿱'},
  {id:'pq',nk:'프로틴 1/4스쿱',cal:42.5,ca:1,f:.5,p:7.5,sk:'1/4스쿱'},
  {id:'bb',nk:'블루베리 한 줌',cal:25,ca:6,f:0,p:.5,sk:'1줌'},
  {id:'bbh',nk:'블루베리 반 줌',cal:12.5,ca:3,f:0,p:.3,sk:'반줌'},
  {id:'ct9',nk:'방울토마토 9개',cal:27,ca:5.8,f:.3,p:1.3,sk:'9개'},
  {id:'cth',nk:'방울토마토 반 줌',cal:15,ca:3,f:.2,p:.7,sk:'반줌'},
  {id:'sb',nk:'딸기',cal:4,ca:1,f:0,p:.1,sk:'1개'},
  {id:'rs',nk:'로메인 샐러드',cal:10,ca:1,f:0,p:1,sk:'1인분'},
  {id:'oo',nk:'올리브유 1큰술',cal:119,ca:0,f:14,p:0,sk:'1큰술'},
  {id:'ga',nk:'마늘 1쪽',cal:5,ca:1,f:0,p:.2,sk:'1쪽'},
  {id:'ri',nk:'쌀밥 210g',cal:318,ca:72,f:.5,p:6,sk:'210g'},
  {id:'eb',nk:'에너지바',cal:90,ca:17,f:2,p:1,sk:'1개'},
  {id:'cm',nk:'초코우유 500ml',cal:420,ca:56,f:14,p:18,sk:'500ml'},
  {id:'mc',nk:'맥치킨',cal:520,ca:39,f:26,p:14,sk:'1개'},
  {id:'cd',nk:'구운 닭다리',cal:370,ca:0,f:18,p:28,sk:'1개'},
  {id:'tp',nk:'토마토 파스타',cal:450,ca:65,f:12,p:15,sk:'1인분'},
  {id:'ser',nk:'간장계란밥',cal:440,ca:72,f:10,p:18,sk:'1인분'},
  {id:'jy',nk:'제육덮밥',cal:800,ca:90,f:30,p:35,sk:'1인분'},
  {id:'beer',nk:'맥주 500ml',cal:210,ca:16,f:0,p:2,sk:'500ml'},
  {id:'sp',nk:'삼겹살 120g',cal:380,ca:0,f:32,p:22,sk:'120g'},
  {id:'bh',nk:'뼈해장국 고기',cal:180,ca:0,f:12,p:18,sk:'80g'},
];

// ===== MET 기반 칼로리 계수 =====
const MET_CARDIO = {
  run:{low:7,mid:9.8,hi:12},
  walk:{low:2.8,mid:3.8,hi:5},
  cycle:{low:4,mid:6.8,hi:10},
  swim:{low:5.8,mid:7,hi:10},
  jump:{low:8,mid:10,hi:12},
  tread:{low:6,mid:9,hi:11}
};
const MET_STRENGTH = 3.5;
