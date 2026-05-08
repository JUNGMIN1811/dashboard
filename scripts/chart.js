import Chart from 'chart.js/auto'

let chartInstance = null

// Chart.js 인스턴스 생성 — 이미 생성된 경우 재사용
export function initChart() {
  const canvas = document.getElementById('revenue-chart')
  if (chartInstance) {
    chartInstance.destroy()
  }
  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: '매출 (₩)',
          data: [],
          borderColor: '#4A90D9',
          backgroundColor: 'rgba(74, 144, 217, 0.08)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // 툴팁 금액 포맷
            label: ctx => '₩ ' + ctx.parsed.y.toLocaleString('ko-KR')
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { maxTicksLimit: 10, maxRotation: 0 }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: val => '₩' + (val / 10000).toFixed(0) + '만'
          }
        }
      }
    }
  })
}

// 시계열 데이터로 차트 업데이트 — 데이터 페칭 없이 외부에서 전달받음
export function updateChart(timeSeries) {
  if (!chartInstance) return
  chartInstance.data.labels = timeSeries.map(d => d.date)
  chartInstance.data.datasets[0].data = timeSeries.map(d => d.revenue)
  chartInstance.update()
}
