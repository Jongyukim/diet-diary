# 🔥 DietDiary - Tauri Desktop App

개인용 식단 일기 데스크톱 앱. Glassmorphism 다크 UI.

## 🚀 빌드 방법

### 1. 사전 준비

**Rust 설치:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Windows: https://www.rust-lang.org/tools/install 에서 다운로드
```

**Tauri CLI 설치:**
```bash
cargo install tauri-cli --version "^2.0"
```

**시스템 의존성 (Windows):**
- WebView2 (Windows 10/11에 기본 포함)
- Visual Studio Build Tools 2022 (C++ 빌드 도구)

**시스템 의존성 (macOS):**
- Xcode Command Line Tools: `xcode-select --install`

### 2. 빌드 & 실행

```bash
cd diet-diary-tauri

# 개발 모드 (핫 리로드)
cargo tauri dev

# 프로덕션 빌드 (설치 파일 생성)
cargo tauri build
```

빌드 결과물:
- **Windows**: `src-tauri/target/release/bundle/msi/DietDiary_1.0.0_x64.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/DietDiary_1.0.0_aarch64.dmg`

### 3. 바탕화면 바로가기

빌드 후 생성된 `.msi` (Windows) 또는 `.dmg` (macOS) 실행하면 자동으로 설치되고 바탕화면 아이콘이 생성됩니다.

## 📦 데이터

- 앱 데이터는 `localStorage`에 저장됩니다.
- 설정 > 내보내기로 JSON 백업 가능.
- 기존 `diet-diary-data.json` 파일을 설정 > 불러오기로 임포트하세요.

## 🎨 디자인 특징

- Glassmorphism + 다크 모드
- 애니메이션 그라디언트 배경
- 원형 칼로리 프로그레스 링
- 한국어/영어 토글
- Chart.js 기반 통계 차트
