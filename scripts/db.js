import { supabase } from './supabase.js'

// 행 배열을 KPI 집계 + 시계열로 변환
function transformRows(rows) {
  const kpi = rows.reduce(
    (acc, row) => {
      acc.revenue += row.revenue
      acc.visitors += row.visitors
      acc.conversionRate += row.conversion_rate
      acc.newCustomers += row.new_customers
      return acc
    },
    { revenue: 0, visitors: 0, conversionRate: 0, newCustomers: 0 }
  )

  // 전환율은 기간 평균
  if (rows.length > 0) {
    kpi.conversionRate = kpi.conversionRate / rows.length
  }

  const timeSeries = rows.map(row => ({
    date: row.date,
    revenue: row.revenue
  }))

  return { kpi, timeSeries }
}

// 기간 내 sample.json 데이터 필터링
async function fetchSampleData(startDate, endDate) {
  const res = await fetch('/data/sample.json')
  const json = await res.json()
  const rows = json.rows.filter(row => row.date >= startDate && row.date <= endDate)
  return rows
}

/**
 * 기간별 대시보드 데이터 조회
 * Supabase 실패 시 sample.json 폴백 → isOffline: true 반환
 */
export async function fetchDashboardData(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('date, revenue, visitors, conversion_rate, new_customers')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error

    const { kpi, timeSeries } = transformRows(data)
    return { isOffline: false, kpi, timeSeries }
  } catch {
    // Supabase 연결 실패 시 sample.json 폴백
    try {
      const rows = await fetchSampleData(startDate, endDate)
      const { kpi, timeSeries } = transformRows(rows)
      return { isOffline: true, kpi, timeSeries }
    } catch (fallbackErr) {
      console.error('sample.json 로드 실패:', fallbackErr)
      return {
        isOffline: true,
        kpi: { revenue: 0, visitors: 0, conversionRate: 0, newCustomers: 0 },
        timeSeries: []
      }
    }
  }
}
