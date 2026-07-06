import type { BarRow, CompareCard, TrendSeries } from '@/types'

export function buildAnalysisReport(cards: CompareCard[], bars: BarRow[], trends: TrendSeries[]) {
  const total = cards.find((card) => card.key === 'total')?.current ?? 0
  const completed = cards.find((card) => card.key === 'completed')?.current ?? 0
  const handling = cards.find((card) => card.key === 'handling')?.current ?? 0
  const canceled = cards.find((card) => card.key === 'canceled')?.current ?? 0
  const deleted = cards.find((card) => card.key === 'deleted')?.current ?? 0
  const topProduct = bars[0]
  const completionRate = total ? ((completed / total) * 100).toFixed(1) : '0.0'
  const riskRate = total ? (((canceled + deleted) / total) * 100).toFixed(1) : '0.0'
  const peakTrend = trends
    .flatMap((trend) => trend.labels.map((label, index) => ({ title: trend.title, label, value: trend.values[index] })))
    .sort((a, b) => b.value - a.value)[0]

  return `
    <h2>1. 整体运营概览</h2>
    <p>本期共统计 <strong>${total}</strong> 笔订单，竣工 <strong>${completed}</strong> 笔，在途 <strong>${handling}</strong> 笔，竣工率为 <strong>${completionRate}%</strong>。</p>
    <h2>2. 订单状态健康度分析</h2>
    <p class="${Number(riskRate) > 20 ? 'danger' : 'ok'}">撤单与删单合计 ${canceled + deleted} 笔，占比 ${riskRate}%。${Number(riskRate) > 20 ? '需要关注撤删单原因。' : '整体异常压力可控。'}</p>
    <h2>3. 产品结构分析</h2>
    <p>${topProduct ? `当前订单量最高的产品是 <strong>${topProduct.productName}</strong>，建议优先观察其在途和撤删单变化。` : '当前筛选条件下暂无产品统计数据。'}</p>
    <h2>4. 时间趋势研判</h2>
    <p>${peakTrend ? `${peakTrend.title} 在 <strong>${peakTrend.label}</strong> 达到峰值 ${peakTrend.value}，可结合渠道和本地网进一步定位。` : '暂无趋势峰值。'}</p>
    <h2>5. 环比变化解读</h2>
    <p>${cards.map((card) => `${card.title}：${card.current}（${card.rate >= 0 ? '+' : ''}${card.rate.toFixed(1)}%）`).join('；')}。</p>
    <h2>6. 综合预警与建议</h2>
    <p class="${handling > completed ? 'warn' : 'ok'}">${handling > completed ? '在途积压高于竣工量，建议检查开通中、待确认等状态的处理链路。' : '竣工处理能力高于当前在途压力，运行状态较平稳。'}</p>
  `
}
