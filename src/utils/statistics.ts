import { mapCodes, orderRecords, productSorts } from '@/data/generatedData'
import type { BarRow, BarSeriesKey, CompareCard, ListFilters, MetricKey, OrderRecord, ProductOption, QueryFilters, TimeType, TrendSeries } from '@/types'
import { formatDateTime, getAlignedRanges, inRange, parseDate, trendBucket, trendLabels } from './date'

export const demoAnchor = orderRecords.reduce((latest, row) => {
  const current = parseDate(row.acceptDate)
  return current > latest ? current : latest
}, parseDate(orderRecords[0]?.acceptDate ?? '2024-01-01 00:00:00'))

export const latnOptions = mapCodes.filter((item) => item.type === 'latn_id')
export const statusOptions = mapCodes.filter((item) => item.type === 'status_cd')

export const metricMeta: Record<MetricKey, { title: string; desc: string }> = {
  total: { title: '订单量环比', desc: '本期订单总量' },
  completed: { title: '竣工量环比', desc: 'status_cd = 300000' },
  handling: { title: '在途单量环比', desc: '未竣工且未撤删' },
  deleted: { title: '删单量环比', desc: '作废/删单状态' },
  canceled: { title: '撤单量环比', desc: 'status_cd = 401300' }
}

export const barMeta: Record<BarSeriesKey, { name: string; color: string }> = {
  handling: { name: '在途', color: '#409EFF' },
  completed: { name: '竣工', color: '#67C23A' },
  exception: { name: '异常', color: '#E6A23C' },
  canceled: { name: '撤单', color: '#F56C6C' },
  deleted: { name: '删单', color: '#909399' }
}

export function buildProductOptions(): ProductOption[] {
  const byCode = new Map(productSorts.map((item) => [item.prodCode, item]))
  const firstLevels = productSorts.filter((item) => item.prodLevel === 1 && item.parentProdCode === '-1')
  const groups = firstLevels.map<ProductOption>((first) => ({ code: first.prodCode, name: first.prodName, children: [] }))
  const groupByCode = new Map(groups.map((group) => [group.code, group]))

  productSorts
    .filter((item) => item.prodLevel >= 3)
    .forEach((item) => {
      let cursor = byCode.get(item.parentProdCode)
      while (cursor && cursor.parentProdCode !== '-1') cursor = byCode.get(cursor.parentProdCode)
      const group = cursor ? groupByCode.get(cursor.prodCode) : undefined
      if (group) group.children.push({ code: item.prodCode, name: item.prodName })
    })

  return groups.filter((group) => group.children.length > 0)
}

export function categoryOf(order: OrderRecord): BarSeriesKey {
  if (order.linkState === '9') return 'exception'
  if (order.statusCd === '300000') return 'completed'
  if (order.statusCd === '401300') return 'canceled'
  if (['100004', '401397', '401398', '401400', '401700'].includes(order.statusCd)) return 'deleted'
  return 'handling'
}

function metricMatch(order: OrderRecord, key: MetricKey) {
  if (key === 'total') return true
  if (key === 'completed') return order.statusCd === '300000'
  if (key === 'canceled') return order.statusCd === '401300'
  if (key === 'deleted') return ['100004', '401397', '401398', '401400', '401700'].includes(order.statusCd)
  return categoryOf(order) === 'handling'
}

export function applyBaseFilters(orders: OrderRecord[], filters: QueryFilters) {
  return orders.filter((order) => {
    if (filters.latnId && filters.latnId !== '888' && order.latnId !== filters.latnId) return false
    if (filters.orderState && order.statusCd !== filters.orderState) return false
    if (filters.productCodes.length && !filters.productCodes.includes(order.prodId)) return false
    return true
  })
}

export function filterByTime(orders: OrderRecord[], timeType: TimeType, previous = false) {
  const ranges = getAlignedRanges(timeType, demoAnchor)
  const start = previous ? ranges.previousStart : ranges.currentStart
  const end = previous ? ranges.previousEnd : ranges.currentEnd
  return orders.filter((order) => inRange(order.acceptDate, start, end))
}

export function makeCompareCards(filters: QueryFilters): CompareCard[] {
  const base = applyBaseFilters(orderRecords, filters)
  const current = filterByTime(base, filters.timeType)
  const previous = filterByTime(base, filters.timeType, true)
  const keys: MetricKey[] = ['total', 'completed', 'handling', 'deleted', 'canceled']

  return keys.map((key) => {
    const currentValue = current.filter((order) => metricMatch(order, key)).length
    const previousValue = previous.filter((order) => metricMatch(order, key)).length
    const rate = previousValue === 0 ? (currentValue > 0 ? 100 : 0) : ((currentValue - previousValue) / previousValue) * 100
    return {
      key,
      title: metricMeta[key].title,
      current: currentValue,
      previous: previousValue,
      rate,
      desc: metricMeta[key].desc
    }
  })
}

export function makeBarRows(filters: QueryFilters): BarRow[] {
  const rows = new Map<string, BarRow>()
  filterByTime(applyBaseFilters(orderRecords, filters), filters.timeType).forEach((order) => {
    const key = order.prodName || order.thirdProdName || order.prodId
    const row =
      rows.get(key) ??
      {
        productName: key,
        productCode: order.prodId,
        handling: 0,
        completed: 0,
        exception: 0,
        canceled: 0,
        deleted: 0
      }
    row[categoryOf(order)] += 1
    rows.set(key, row)
  })

  return Array.from(rows.values())
    .sort((a, b) => b.handling + b.completed + b.exception + b.canceled + b.deleted - (a.handling + a.completed + a.exception + a.canceled + a.deleted))
    .slice(0, 12)
}

export function makeTrendSeries(filters: QueryFilters): TrendSeries[] {
  const ranges = getAlignedRanges(filters.timeType, demoAnchor)
  const labels = trendLabels(filters.timeType, ranges.currentStart, ranges.currentEnd)
  const current = filterByTime(applyBaseFilters(orderRecords, filters), filters.timeType)
  const keys: MetricKey[] = ['total', 'completed', 'handling', 'deleted', 'canceled']

  return keys.map((key) => {
    const values = labels.map((label) => current.filter((order) => trendBucket(order.acceptDate, filters.timeType) === label && metricMatch(order, key)).length)
    return { key, title: metricMeta[key].title.replace('环比', '趋势图'), labels, values }
  })
}

export function applyListFilters(filters: ListFilters) {
  return orderRecords.filter((order) => {
    if (filters.latnId && filters.latnId !== '888' && order.latnId !== filters.latnId) return false
    if (filters.productCodes.length && !filters.productCodes.includes(order.prodId)) return false
    if (filters.productName && !order.prodName.includes(filters.productName)) return false
    if (filters.orderState && order.statusCd !== filters.orderState) return false
    if (filters.linkState && order.linkState !== filters.linkState) return false
    if (filters.statusGroup === 'handling' && categoryOf(order) !== 'handling') return false
    if (filters.statusGroup === 'exception' && categoryOf(order) !== 'exception') return false
    if (filters.statusGroup === 'completed' && order.statusCd !== '300000') return false
    if (filters.statusGroup === 'deleted' && !['100004', '401397', '401398', '401400', '401700'].includes(order.statusCd)) return false
    if (filters.statusGroup === 'canceled' && order.statusCd !== '401300') return false
    if (filters.startTime && filters.endTime && !inRange(order.acceptDate, parseDate(filters.startTime), parseDate(filters.endTime))) return false
    if (filters.trendTime) {
      const dayOrHour = filters.trendTime.includes(':') ? order.acceptDate.slice(11, 13) + ':00' : order.acceptDate.slice(5, 10)
      if (dayOrHour !== filters.trendTime) return false
    }
    return true
  })
}

export function getTimeRangeText(timeType: TimeType) {
  const { currentStart, currentEnd } = getAlignedRanges(timeType, demoAnchor)
  return `${formatDateTime(currentStart)} ~ ${formatDateTime(currentEnd)}`
}
