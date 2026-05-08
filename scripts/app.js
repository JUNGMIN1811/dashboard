import { fetchDashboardData } from './db.js'
import { initChart, updateChart } from './chart.js'

// 오늘 기준 N일 전 날짜를 YYYY-MM-DD 형식으로 반환
function getDateOffset(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// 필터 값 → {startDate, endDate} 변환
function getDateRange(rangeValue) {
  const today = new Date().toISOString().slice(0, 10)
  const offsetMap = { '7': 6, '30': 29, '90': 89 }
  const offset = offsetMap[rangeValue]
  return { startDate: getDateOffset(offset), endDate: today }
}

// KPI 카드 DOM 업데이트 — XSS 방지를 위해 textContent 사용
function updateKpiCards(kpi) {
  document.getElementById('kpi-revenue').textContent =
    kpi.revenue.toLocaleString('ko-KR')
  document.getElementById('kpi-visitors').textContent =
    kpi.visitors.toLocaleString('ko-KR')
  document.getElementById('kpi-conversion').textContent =
    kpi.conversionRate.toFixed(1)
  document.getElementById('kpi-new-customers').textContent =
    kpi.newCustomers.toLocaleString('ko-KR')
}

// 오프라인 배너 토글
function setOfflineBanner(isOffline) {
  document.getElementById('offline-banner').style.display = isOffline ? 'block' : 'none'
}

// 데이터 조회 → KPI 업데이트 → 차트 업데이트
async function loadData(startDate, endDate) {
  const result = await fetchDashboardData(startDate, endDate)
  setOfflineBanner(result.isOffline)
  updateKpiCards(result.kpi)
  updateChart(result.timeSeries)
}

// 커스텀 날짜 피커 활성화/비활성화
function toggleCustomDateSection(show) {
  document.getElementById('custom-date-section').style.display = show ? 'block' : 'none'
}

// 커스텀 날짜 유효성 검사 → 적용 버튼 활성화 제어
function validateCustomDates() {
  const start = document.getElementById('date-start').value
  const end = document.getElementById('date-end').value
  const applyBtn = document.getElementById('apply-custom')
  // 시작일 > 종료일이면 disabled
  applyBtn.disabled = !(start && end && start <= end)
}

function init() {
  initChart()

  // 기본 필터(30일) 로드
  const { startDate, endDate } = getDateRange('30')
  loadData(startDate, endDate)

  // 라디오 필터 이벤트
  document.querySelectorAll('input[name="range"]').forEach(radio => {
    radio.addEventListener('change', e => {
      const val = e.target.value
      if (val === 'custom') {
        toggleCustomDateSection(true)
      } else {
        toggleCustomDateSection(false)
        const range = getDateRange(val)
        loadData(range.startDate, range.endDate)
      }
    })
  })

  // 날짜 피커 변경 시 유효성 재검사
  document.getElementById('date-start').addEventListener('input', validateCustomDates)
  document.getElementById('date-end').addEventListener('input', validateCustomDates)

  // 커스텀 날짜 적용 버튼
  document.getElementById('apply-custom').addEventListener('click', () => {
    const start = document.getElementById('date-start').value
    const end = document.getElementById('date-end').value
    if (start && end && start <= end) {
      loadData(start, end)
    }
  })
}

init()
