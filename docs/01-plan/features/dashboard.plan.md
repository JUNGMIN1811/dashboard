# dashboard Planning Document

> **Summary**: 팀 주간 성과를 실시간으로 모니터링하는 사내 성과 대시보드
>
> **Project**: 사내 성과 대시보드
> **Version**: 0.1.0
> **Author**: JUNGMIN
> **Date**: 2026-05-08
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 팀 주간 성과 지표(매출·방문자·전환율·신규고객)를 한눈에 파악할 수 없어 의사결정이 지연됨 |
| **Solution** | Supabase 실시간 연동 + Chart.js 시각화로 KPI 카드 4개와 매출 추이 차트를 단일 페이지에 제공 |
| **Function/UX Effect** | 기간 필터(7일·30일·90일·커스텀)로 원하는 기간의 성과를 즉시 조회, 오프라인 시 sample.json 폴백으로 항상 데이터 노출 |
| **Core Value** | 별도 로그인 없이 URL 접속만으로 팀 성과를 실시간 모니터링 |

---

## Context Anchor

> Auto-generated from Executive Summary. Propagated to Design/Do documents for context continuity.

| Key | Value |
|-----|-------|
| **WHY** | 팀 성과 지표를 실시간으로 한눈에 파악하여 의사결정 속도 향상 |
| **WHO** | 팀 리더 및 팀원 — 별도 인증 없이 대시보드 URL에 접근하는 내부 사용자 |
| **RISK** | Supabase 연결 불안정 시 데이터 미표시 → sample.json 폴백으로 완화 |
| **SUCCESS** | KPI 4종 정상 표시, 기간 필터 전환 시 차트 즉시 업데이트, 오프라인 폴백 배너 표시 |
| **SCOPE** | Phase 1: KPI 카드 + 차트 + 기간 필터 + Supabase 연동 + 오프라인 폴백 (인증·데이터입력 제외) |

---

## 1. Overview

### 1.1 Purpose

팀 주간 성과 지표(매출·방문자·전환율·신규고객)를 실시간으로 모니터링할 수 있는 단일 페이지 대시보드를 제공한다. 기간 필터를 통해 원하는 구간의 데이터를 즉시 조회할 수 있다.

### 1.2 Background

팀 성과 데이터가 Supabase에 축적되고 있으나 별도 시각화 도구가 없어 스프레드시트를 수동으로 확인해야 하는 비효율이 존재한다. 실시간 대시보드를 통해 의사결정 속도를 높이고 팀 전체가 동일한 데이터를 공유할 수 있도록 한다.

### 1.3 Related Documents

- CLAUDE.md: 프로젝트 구조 및 개발 가이드
- Supabase dashboard_data 테이블 스키마 (별도 정의 필요)

---

## 2. Scope

### 2.1 In Scope

- [x] KPI 카드 4개: 매출(₩), 방문자(명), 전환율(%), 신규고객(명)
- [x] 매출 추이 라인 차트 (Chart.js 4)
- [x] 기간 필터: 7일 / 30일 / 90일 / 커스텀(날짜 피커 2개)
- [x] Supabase `dashboard_data` 테이블 실시간 연동
- [x] 오프라인 폴백: 연결 실패 시 `data/sample.json` + 조용한 배너 표시
- [x] Vercel 배포

### 2.2 Out of Scope

- 사용자 인증 / 로그인 기능
- 데이터 입력 / 수정 / 삭제 (읽기 전용)
- 모바일 전용 레이아웃 (기본 반응형만)
- 알림 / 이메일 리포트
- 다국어 지원

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | KPI 카드 4개(매출·방문자·전환율·신규고객)를 페이지 상단에 표시한다 | High | Pending |
| FR-02 | 각 KPI 카드는 수치와 단위(₩·명·%·명)를 함께 표시한다 | High | Pending |
| FR-03 | 매출 추이 라인 차트를 KPI 카드 하단에 표시한다 | High | Pending |
| FR-04 | 기간 필터(7일·30일·90일) 버튼 클릭 시 차트와 KPI가 즉시 업데이트된다 | High | Pending |
| FR-05 | 커스텀 기간 선택 시 시작일·종료일 날짜 피커 2개를 제공한다 | Medium | Pending |
| FR-06 | Supabase `dashboard_data` 테이블에서 데이터를 조회한다 | High | Pending |
| FR-07 | Supabase 연결 실패 시 `data/sample.json`으로 폴백하고 배너를 표시한다 | High | Pending |
| FR-08 | 오프라인 배너는 화면 상단에 조용하게 표시하며 정상 데이터와 구분된다 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 기간 필터 전환 후 차트 업데이트 < 300ms | 브라우저 DevTools |
| Reliability | Supabase 연결 실패 시 폴백 데이터 100% 노출 | 수동 네트워크 차단 테스트 |
| Compatibility | Chrome·Edge·Safari 최신 버전 지원 | 브라우저 직접 확인 |
| Build | Vite 프로덕션 빌드 성공, Vercel 배포 성공 | CI 빌드 로그 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01 ~ FR-08 전체 구현 완료
- [ ] 브라우저(Chrome)에서 KPI 카드 4개 정상 표시 확인
- [ ] 기간 필터 전환 시 차트 데이터 즉시 업데이트 확인
- [ ] 네트워크 차단 상태에서 sample.json 폴백 + 배너 표시 확인
- [ ] Vercel 배포 후 URL 접속 정상 확인

### 4.2 Quality Criteria

- [ ] 빌드 오류 없음 (`npm run build` 성공)
- [ ] 브라우저 콘솔 에러 없음
- [ ] `.env` 파일 Git 미포함 확인

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase `dashboard_data` 스키마 미확정 | High | Medium | sample.json으로 스키마 선정의(先定義) 후 테이블 생성 |
| 커스텀 날짜 범위 엣지케이스 (시작 > 종료) | Medium | Medium | 종료일이 시작일보다 이전이면 필터 적용 비활성화 처리 |
| Chart.js 4 와 Vite ESM 호환 이슈 | Low | Low | 공식 ESM 빌드(`chart.js/auto`) 사용 |
| Vercel 환경변수 미설정 | High | Low | 배포 전 Vercel 대시보드에서 `VITE_` 접두사 변수 등록 체크리스트 확보 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| Supabase `dashboard_data` 테이블 | DB 테이블 | 신규 생성 — date, revenue, visitors, conversion_rate, new_customers 컬럼 |
| `scripts/supabase.js` | JS 모듈 | 신규 생성 — Supabase 클라이언트 초기화 |
| `scripts/db.js` | JS 모듈 | 신규 생성 — 기간별 데이터 조회 함수 |
| `scripts/chart.js` | JS 모듈 | 신규 생성 — Chart.js 인스턴스 관리 |
| `scripts/app.js` | JS 모듈 | 신규 생성 — 진입점, 필터 이벤트 처리 |

### 6.2 Current Consumers

신규 프로젝트로 기존 소비자 없음.

### 6.3 Verification

- [ ] 신규 테이블 생성 후 RLS 정책 확인 (읽기 공개 또는 anon key 허용)
- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 환경변수 로컬 및 Vercel 설정 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, 랜딩 페이지 | ☑ |
| **Dynamic** | Feature-based modules, BaaS 연동 | Web apps, SaaS MVPs | ☐ |
| **Enterprise** | Strict layer separation | 대규모 시스템 | ☐ |

> **Starter 선택 이유**: 인증 없는 단일 페이지 읽기 전용 앱. 복잡한 상태 관리나 레이어 분리가 불필요하며, 4개의 JS 모듈(`app.js`, `supabase.js`, `db.js`, `chart.js`)로 충분히 표현 가능.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Vanilla JS / React / Vue | Vanilla JS (ES modules) | 요구사항에 명시, 빌드 경량화 |
| 상태 관리 | 전역 변수 / 모듈 상태 | 모듈 내 변수 | 단일 페이지, 상태 최소화 |
| API Client | fetch / supabase-js | supabase-js | Supabase 공식 클라이언트 |
| 차트 | Chart.js / D3 | Chart.js 4 | 요구사항에 명시 |
| 스타일링 | CSS / Tailwind | 순수 CSS (main.css) | 외부 의존성 최소화 |
| 빌드 | Vite 5 | Vite 5 | 요구사항에 명시 |

### 7.3 모듈 구조

```
scripts/
├── app.js        # 진입점: DOM 초기화, 필터 이벤트 바인딩, 오케스트레이션
├── supabase.js   # Supabase 클라이언트 단일 인스턴스 export
├── db.js         # fetchDashboardData(startDate, endDate) — 조회 전용
└── chart.js      # initChart(), updateChart(data) — Chart.js 인스턴스 관리

데이터 흐름:
app.js (필터 변경)
  → db.js (fetchDashboardData)
    → supabase.js (쿼리 실행) or sample.json (폴백)
  → app.js (KPI 카드 DOM 업데이트)
  → chart.js (updateChart)
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions (CLAUDE.md 기준)

- [x] `CLAUDE.md` 코딩 컨벤션 존재 (함수명 camelCase, 파일명 kebab-case, 들여쓰기 2칸, 주석 한국어)
- [ ] ESLint 설정 없음 (Starter 수준에서 생략)
- [ ] Prettier 설정 없음 (Starter 수준에서 생략)

### 8.2 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | Client |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key | Client |

---

## 9. Next Steps

1. [ ] `dashboard_data` 테이블 스키마 확정 및 Supabase에 생성
2. [ ] `data/sample.json` 목 데이터 작성 (스키마 기반)
3. [ ] Design 문서 작성 (`/pdca design dashboard`)
4. [ ] 구현 시작 (`/pdca do dashboard`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-08 | Initial draft | JUNGMIN |
