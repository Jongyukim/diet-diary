// ===== Service Worker =====
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/diet-diary/sw.js').catch(()=>{});
}

// ===== 초기화 =====
window.addEventListener('load', async () => {
  // 모달 외부 클릭 닫기
  document.getElementById('fModal').addEventListener('click', e => {
    if(e.target === document.getElementById('fModal')) closeM();
  });

  // 테마 복원
  const savedTheme = localStorage.getItem('dd_theme') || 'dark';
  themeIdx = THEMES.indexOf(savedTheme);
  if(themeIdx < 0) themeIdx = 0;
  document.body.setAttribute('data-theme', THEMES[themeIdx]);

  // Drive 토큰 복원
  const saved = localStorage.getItem('dd_token');
  if(saved){ accessToken = saved; updateDriveUI(); await syncFromDrive(); }

  render();
});
