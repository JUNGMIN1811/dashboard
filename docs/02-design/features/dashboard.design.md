# dashboard Design Document

> **Summary**: 팀 주간 성과 실시간 모니터링 대시보드 설계
>
> **Project**: 사내 성과 대시보드
> **Version**: 0.1.0
> **Author**: JUNGMIN
> **Date**: 2026-05-08
> **Status**: Draft
> **Planning Doc**: [dashboard.plan.md](../../01-plan/features/dashboard.plan.md)

---

## Context Anchor

> Plan 문서에서 복사. Design→Do 핸드오프 시 전략적 컨텍스트 유지.

| Key | Value |
|-----|-------|
| **WHY** | 팀 성과 지표를 실시간으로 한눈에 파악하여 의사결정 속도 향상 |
| **WHO** | 팀 리더 및 팀원 — 별도 인증 없이 대시보드 URL에 접근하는 내부 사용자 |
| **RISK** | Supabase 연결 불안정 시 데이터 미표시 → sample.json 폴백으로 완화 |
| **SUCCESS** | KPI 4종 정상 표시, 기간 필터 전환 시 차트 즉시 업데이트, 오프라인 폴백 배너 표시 |
| **SCOPE** | Phase 1: KPI 카드 + 차트 + 기간 필터 + Supabase 연동 + 오프라인 폴백 (인증·데이터입력 제외) |

---

## 1. Overview

### 1.1 Design Goals

- 4개의 JS 모듈이 명확한 단일 책임을 갖도록 설계
- Supabase 의존성을 `supabase.js` + `db.js`에 격리하여 폴백 로직을 단순하게 유지
- Chart.js 인스턴스를 `chart.js`에 캡슐화하여 외부에서 데이터만 전달하면 차트가 갱신되는 인터페이스 제공

### 1.2 Design Principles

- **단일 책임**: 각 모듈은 하나의 역할만 수행 (연결·조회·렌더링·오케스트레이션)
- **외부 의존성 최소화**: 순수 CSS, Vanilla JS, 지정된 라이브러리 외 추가 의존성 없음
- **폴백 투명성**: 오프라인 폴백 전환은 `db.js` 내부에서 처리, `app.js`는 결과만 수신

---

## 2. Architecture

### 2.0 Architecture Comparison

| 기준 | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|------|:-:|:-:|:-:|
| **접근 방식** | app.js에 모든 로직 집중 | 타입·유틸 추가 분리 | 4모듈 책임 분리 |
| **신규 파일** | 1개 | 6개 | 4개 |
| **복잡도** | 낮음 | 높음 | 중간 |
| **유지보수성** | 낮음 | 높음 | 높음 |
| **Effort** | 낮음 | 높음 | 중간 |

**Selected**: Option C (Pragmatic) — **Rationale**: 단일 페이지 읽기 전용 앱에 딱 맞는 모듈 수. 불필요한 추상화 없이 책임이 명확함.

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────┐
│  Browser (index.html)                                │
│                                                      │
│  ┌──────────┐   필터 이벤트    ┌──────────────────┐  │
│  │  Filter  │ ─────────────▶ │    app.js        │  │
│  │  Buttons │                │  (오케스트레이션)  │  │
│  └──────────┘                └────────┬─────────┘  │
│                                       │             │
│                          ┌────────────▼──────────┐  │
│                          │       db.js           │  │
│                          │  fetchDashboardData() │  │
│                          └──────┬────────────────┘  │
│                                 │                   │
│              ┌──────────────────▼──┐  연결 실패 시   │
│              │    supabase.js      │ ──▶ sample.json│
│              │  (Supabase Client)  │                │
│              └─────────────────────┘                │
│                                                      │
│  ┌──────────────────────┐  ┌───────────────────────┐ │
│  │  KPI Cards (DOM)     │  │      chart.js         │ │
│  │  updateKpiCards()    │  │  initChart()          │ │
│  └──────────────────────┘  │  updateChart(data)    │ │
│                             └───────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
사용자 필터 클릭 (7일/30일/90일/커스텀)
  → app.js: getDateRange(filter) → {startDate, endDate}
  → db.js: fetchDashboardData(startDate, endDate)
    → 시도: supabase.js 쿼리 실행
    → 실패: data/sample.json fetch + isOffline = true 반환
  → app.js: renderKpiCards(data) — KPI 카드 DOM 업데이트
  → app.js: updateChart(data.timeSeries) — 차트 갱신
  → isOffline 시: 오프라인 배너 표시
```

### 2.3 Dependencies

| 모듈 | 의존 대상 | 목적 |
|------|-----------|------|
| `app.js` | `db.js`, `chart.js` | 데이터 조회 + 차트 업데이트 |
| `db.js` | `supabase.js`, `data/sample.json` | 쿼리 실행 + 폴백 |
| `chart.js` | Chart.js 4 (`chart.js/auto`) | 차트 인스턴스 관리 |
| `supabase.js` | `@supabase/supabase-js` | 클라이언트 초기화 |

---

## 3. Data Model

### 3.1 dashboard_data 테이블 스키마

```sql
CREATE TABLE dashboard_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  revenue     NUMERIC(15, 2) NOT NULL,
  visitors    INTEGER NOT NULL,
  conversion_rate NUMERIC(5, 2) NOT NULL,  -- 0.00 ~ 100.00 (%)
  new_customers   INTEGER NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 JavaScript 데이터 계약

```js
// db.js fetchDashboardData() 반환 타입
{
  isOffline: boolean,           // true = sample.json 폴백 사용 중
  kpi: {
    revenue: number,            // 기간 합계 (₩)
    visitors: number,           // 기간 합계 (명)
    conversionRate: number,     // 기간 평균 (%)
    newCustomers: number        // 기간 합계 (명)
  },
  timeSeries: [
    { date: string, revenue: number }  // Chart.js용 시계열
  ]
}
```

### 3.3 sample.json 구조

```json
{
  "rows": [
    {
      "date": "2026-04-01",
      "revenue": 1200000,
      "visitors": 340,
      "conversion_rate": 3.2,
      "new_customers": 11
    }
  ]
}
```

---

## 4. API Specification

Supabase JS 클라이언트를 직접 사용. 별도 REST API 서버 없음.

### 4.1 db.js 함수 명세

#### `fetchDashboardData(startDate, endDate)`

**파라미터**:
- `startDate`: `string` — ISO 날짜 (`YYYY-MM-DD`)
- `endDate`: `string` — ISO 날짜 (`YYYY-MM-DD`)

**Supabase 쿼리**:
```js
supabase
  .from('dashboard_data')
  .select('date, revenue, visitors, conversion_rate, new_customers')
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: true })
```

**반환**: `{ isOffline, kpi, timeSeries }` (§3.2 참고)

**에러 처리**: Supabase 오류 발생 시 `catch`에서 `sample.json` fetch → `isOffline: true` 반환

---

## 5. UI/UX Design

> **디자인 레퍼런스**: `design.png` (Tableau 스타일 분석 대시보드)
> 참고 요소: 좌측 컨트롤 패널 + 메인 차트 중심 레이아웃 + 카테고리 컬러 코딩 + 우측 범례

### 5.0 Design Tokens (design.png 참고)

| 항목 | 값 | 참고 |
|------|-----|------|
| 배경색 | `#F7F8FA` (연한 회색) | Tableau 배경과 유사한 밝은 중립 톤 |
| 사이드 패널 배경 | `#FFFFFF` | 좌측 컨트롤 영역 흰색 카드 |
| 메인 영역 배경 | `#FFFFFF` | 차트 캔버스 흰색 |
| KPI 카드 배경 | `#FFFFFF` | 그림자 있는 흰색 카드 |
| 강조색 (매출) | `#4A90D9` | Tableau 파란색 계열 |
| 강조색 (방문자) | `#50C878` | 초록색 계열 |
| 강조색 (전환율) | `#F5A623` | 주황색 계열 |
| 강조색 (신규고객) | `#9B59B6` | 보라색 계열 |
| 오프라인 배너 | `#FFF3CD` + 테두리 `#FFC107` | 경고 황색 (조용한 톤) |
| 필터 버튼 active | `#4A90D9` 배경 + 흰색 텍스트 | |
| 필터 버튼 inactive | `#F0F2F5` 배경 + `#555` 텍스트 | |
| 폰트 | `'Pretendard', 'Noto Sans KR', sans-serif` | |
| 카드 radius | `8px` | |
| 카드 shadow | `0 2px 8px rgba(0,0,0,0.08)` | |

### 5.1 Screen Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [오프라인 배너 #offline-banner] ← isOffline 시만, 황색 배너 │
│  "오프라인 모드 — 샘플 데이터 표시 중"                        │
├──────────────────────────────────────────────────────────────┤
│  헤더: "사내 성과 대시보드"   (배경 #FFFFFF, 하단 border)     │
├────────────────┬─────────────────────────────────────────────┤
│  좌측 패널     │  메인 콘텐츠 영역                            │
│  (240px, 흰색) │                                             │
│                │  [기간 필터 바]                              │
│  ─ 기간 선택 ─ │   7일  30일  90일  | 시작일 ~ 종료일        │
│  ● 7일         │                                             │
│  ○ 30일        │  ┌──────┬──────┬──────┬──────┐             │
│  ○ 90일        │  │ 매출 │ 방문 │ 전환 │ 신규 │  KPI 카드    │
│  ○ 커스텀      │  │ ₩    │  명  │  %  │  명  │             │
│                │  └──────┴──────┴──────┴──────┘             │
│  ─ 날짜 범위 ─ │                                             │
│  [시작일 피커] │  ┌──────────────────────────────────────┐   │
│  [종료일 피커] │  │  매출 추이 라인 차트 (Chart.js)       │   │
│  [적용 버튼]   │  │  x축: 날짜, y축: 매출(₩)             │   │
│                │  └──────────────────────────────────────┘   │
│  ─ 범례 ─      │                                             │
│  ■ 매출 #4A90D9│                                             │
└────────────────┴─────────────────────────────────────────────┘
```

> **design.png 반영**: 좌측 컨트롤 패널(필터·범례)을 사이드바로 분리, 메인 영역은 차트 중심으로 구성. Tableau의 좌측 패널 + 우측 대형 차트 레이아웃 패턴 적용.

### 5.2 User Flow

```
페이지 접속
  → 기본 필터(30일) 적용 → Supabase 조회 시도
  → 성공: KPI + 차트 표시
  → 실패: 오프라인 배너 표시 + sample.json KPI + 차트 표시

좌측 패널 필터 변경 (라디오 버튼 7일/30일/90일 또는 커스텀)
  → 커스텀 선택 시: 날짜 피커 2개 + 적용 버튼 활성화
  → 새 날짜 범위로 fetchDashboardData 재호출
  → KPI 카드 DOM 업데이트
  → Chart.js 데이터 업데이트
```

### 5.3 Component List

| 요소 | 위치 | 책임 |
|------|------|------|
| 오프라인 배너 | `index.html` `#offline-banner` | isOffline 시 display:block, 황색 배너 |
| 좌측 사이드 패널 | `index.html` `.sidebar` | 필터 컨트롤 + 범례 |
| 기간 라디오 필터 | `.sidebar` `.filter-radio` | 7일/30일/90일 선택 |
| 커스텀 날짜 피커 | `.sidebar` `#date-start`, `#date-end` | type="date", 커스텀 선택 시 표시 |
| 커스텀 적용 버튼 | `.sidebar` `#apply-custom` | 날짜 유효성 검증 후 조회 |
| KPI 카드 4개 | `index.html` `.kpi-grid` | 수치 + 단위 + 카테고리 컬러 |
| 매출 추이 차트 | `index.html` `#revenue-chart` | Chart.js 캔버스 |
| 범례 | `.sidebar` `.legend` | 차트 색상 설명 |

### 5.4 Page UI Checklist

#### 메인 대시보드 페이지

- [ ] 배너: 오프라인 모드 안내 배너 (isOffline 시 표시, `#offline-banner`, 황색)
- [ ] 사이드바: 좌측 240px 패널 (`.sidebar`)
- [ ] 필터 라디오: 7일 (`data-range="7"`)
- [ ] 필터 라디오: 30일 (`data-range="30"`, 기본 selected)
- [ ] 필터 라디오: 90일 (`data-range="90"`)
- [ ] 필터 라디오: 커스텀 (`data-range="custom"`)
- [ ] 날짜 피커: 시작일 (`#date-start`, `type="date"`, 커스텀 선택 시 표시)
- [ ] 날짜 피커: 종료일 (`#date-end`, `type="date"`, 커스텀 선택 시 표시)
- [ ] 버튼: 커스텀 적용 (`#apply-custom`, 시작 > 종료 시 disabled)
- [ ] KPI 카드: 매출 (수치 ₩ 형식, `#kpi-revenue`, 파란색 `#4A90D9`)
- [ ] KPI 카드: 방문자 (수치 + "명", `#kpi-visitors`, 초록색 `#50C878`)
- [ ] KPI 카드: 전환율 (수치 + "%", `#kpi-conversion`, 주황색 `#F5A623`)
- [ ] KPI 카드: 신규고객 (수치 + "명", `#kpi-new-customers`, 보라색 `#9B59B6`)
- [ ] 차트: 매출 추이 라인 차트 (`#revenue-chart` canvas, 파란색 라인)
- [ ] 범례: 차트 색상 설명 (`.legend`, 사이드바 하단)

---

## 6. Error Handling

### 6.1 에러 케이스 정의

| 상황 | 처리 방식 | 사용자 피드백 |
|------|-----------|---------------|
| Supabase 연결 실패 | sample.json 폴백, `isOffline = true` | 오프라인 배너 표시 |
| sample.json fetch 실패 | KPI 0 표시, 차트 빈 상태 | 콘솔 에러만 (배너 유지) |
| 커스텀 날짜 시작 > 종료 | 적용 버튼 비활성화 | 버튼 disabled 상태 |
| 데이터 행 없음 (빈 기간) | KPI 0 표시, 차트 빈 라인 | 별도 알림 없음 |

---

## 7. Security Considerations

- Supabase anon key는 읽기 전용 RLS 정책 적용 필요 (`dashboard_data` SELECT 허용)
- `VITE_SUPABASE_ANON_KEY`는 `.env`에만 저장, Git 미포함
- XSS: DOM 업데이트 시 `textContent` 사용 (`innerHTML` 사용 금지)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L2: UI Action | 필터 버튼·KPI 카드·차트 표시 | 브라우저 수동 확인 | Do |
| L2: UI Action | 오프라인 폴백 (네트워크 차단) | DevTools Network 오프라인 | Do |
| L2: UI Action | 커스텀 날짜 엣지케이스 | 수동 입력 | Do |

### 8.2 L2: UI Action Test Scenarios

| # | 시나리오 | 액션 | 예상 결과 |
|---|----------|------|-----------|
| 1 | 기본 로드 | 페이지 접속 | KPI 4종 + 차트 표시, 30일 필터 active |
| 2 | 필터 전환 | 7일 버튼 클릭 | KPI + 차트 데이터 변경, 7일 버튼 active |
| 3 | 커스텀 날짜 | 시작일·종료일 입력 후 적용 | 해당 기간 데이터 표시 |
| 4 | 커스텀 날짜 유효성 | 시작일 > 종료일 설정 | 적용 버튼 disabled |
| 5 | 오프라인 폴백 | DevTools 네트워크 오프라인 후 접속 | 오프라인 배너 + sample.json 데이터 표시 |

### 8.3 Seed Data Requirements

| 항목 | 최소 행 수 | 필수 필드 |
|------|:----------:|-----------|
| dashboard_data | 90개 (90일치) | date, revenue, visitors, conversion_rate, new_customers |

---

## 9. Clean Architecture

Starter 레벨 — 레이어 분리 대신 모듈 책임 분리 적용.

### 9.1 모듈 책임 분리

| 모듈 | 역할 | 외부 의존 |
|------|------|-----------|
| `app.js` | DOM 이벤트 바인딩, 오케스트레이션, KPI DOM 업데이트 | `db.js`, `chart.js` |
| `supabase.js` | Supabase 클라이언트 단일 인스턴스 생성·export | `@supabase/supabase-js` |
| `db.js` | 기간별 데이터 조회, 집계, 폴백 처리 | `supabase.js`, `sample.json` |
| `chart.js` | Chart.js 인스턴스 생성·업데이트 | `chart.js/auto` |

### 9.2 의존 방향 규칙

```
app.js → db.js → supabase.js
app.js → chart.js → Chart.js

규칙: supabase.js·chart.js는 app.js를 import하지 않는다
```

---

## 10. Coding Convention Reference

CLAUDE.md 기준 적용.

### 10.1 이 기능의 컨벤션

| 항목 | 적용 규칙 |
|------|-----------|
| 함수명 | camelCase — `fetchDashboardData`, `updateKpiCards`, `initChart` |
| 파일명 | kebab-case — `supabase.js`, `chart.js` (이미 kebab-case) |
| 들여쓰기 | 2칸 스페이스 |
| 주석 | 한국어 |
| DOM 업데이트 | `textContent` 사용 (`innerHTML` 금지) |
| 환경변수 | `VITE_` 접두사 필수 |

---

## 11. Implementation Guide

### 11.1 File Structure

```
dashboard-project/
├── index.html                  # KPI 카드·필터·차트 마크업
├── styles/
│   └── main.css                # 레이아웃·카드·필터·배너 스타일
├── scripts/
│   ├── app.js                  # 진입점 (type="module")
│   ├── supabase.js             # Supabase 클라이언트
│   ├── db.js                   # 데이터 조회 + 폴백
│   └── chart.js                # Chart.js 래퍼
├── data/
│   └── sample.json             # 90일치 목 데이터
├── .env                        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── vite.config.js
```

### 11.2 Implementation Order

1. [ ] `package.json` 생성 및 의존성 설치 (`vite`, `@supabase/supabase-js`, `chart.js`)
2. [ ] `vite.config.js` 설정
3. [ ] `data/sample.json` 90일치 목 데이터 작성
4. [ ] `scripts/supabase.js` — 클라이언트 초기화
5. [ ] `scripts/db.js` — `fetchDashboardData()` 구현 (Supabase + 폴백)
6. [ ] `scripts/chart.js` — `initChart()`, `updateChart()` 구현
7. [ ] `index.html` — 마크업 (KPI 카드 4개, 필터, 차트 캔버스, 오프라인 배너)
8. [ ] `styles/main.css` — 레이아웃 및 스타일
9. [ ] `scripts/app.js` — 이벤트 바인딩 + 오케스트레이션
10. [ ] 브라우저 동작 확인 (정상 + 오프라인 폴백)
11. [ ] `vite build` 확인 후 Vercel 배포

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | 설명 | 예상 턴 |
|--------|-----------|------|:-------:|
| 프로젝트 설정 + 데이터 레이어 | `module-1` | package.json, vite.config.js, sample.json, supabase.js, db.js | 15-20 |
| UI + 차트 + 오케스트레이션 | `module-2` | index.html, main.css, chart.js, app.js | 20-25 |

#### Recommended Session Plan

| Session | Phase | Scope | 예상 턴 |
|---------|-------|-------|:-------:|
| Session 1 | Plan + Design | 전체 | 완료 |
| Session 2 | Do | `--scope module-1` | 15-20 |
| Session 3 | Do | `--scope module-2` | 20-25 |
| Session 4 | Check + Report | 전체 | 20-30 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-08 | Initial draft (Option C — Pragmatic) | JUNGMIN |
| 0.2 | 2026-05-08 | design.png 참고하여 UI/UX 섹션 업데이트 (사이드바 레이아웃, Design Tokens, 컬러 팔레트) | JUNGMIN |
