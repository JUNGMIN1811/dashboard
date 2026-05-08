# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

사내 팀 주간 성과를 실시간으로 모니터링하는 대시보드. Vercel에 배포.

## 개발 명령어

```powershell
npm install       # 의존성 설치
npm run dev       # 개발 서버 실행 (Vite, 기본 포트 5173)
npm run build     # 프로덕션 빌드 → dist/
npm run preview   # 빌드 결과물 로컬 미리보기
```

## 아키텍처

Vite 5 기반 Vanilla JS(ES modules) 단일 페이지 앱.

**데이터 흐름**: `app.js` (진입점) → `db.js` (Supabase 쿼리) → `chart.js` (Chart.js 4 렌더링)

- `scripts/supabase.js` — Supabase 클라이언트를 한 번만 초기화하고 export. 다른 모듈은 여기서 import해서 사용.
- `scripts/db.js` — 모든 DB 쿼리 함수 집중. UI 로직 없음.
- `scripts/chart.js` — Chart.js 인스턴스 생성·업데이트만 담당. 데이터 페칭 없음.
- `data/sample.json` — Supabase 연결 없이 로컬 개발 시 사용하는 목 데이터.

## 환경 변수

`.env` 파일은 수정하거나 Git에 추가하지 말 것. Supabase 키는 반드시 `VITE_` 접두사 필요 (Vite 클라이언트 노출 조건).

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 코딩 컨벤션

- 함수명 camelCase, 파일명 kebab-case, 들여쓰기 2칸
- 주석은 한국어
- 커밋: Conventional Commit (`feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`)
