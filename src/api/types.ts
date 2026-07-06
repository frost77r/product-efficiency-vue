import type { BarSeriesKey, MetricKey, TimeType } from '@/types'

export type ApiStatusGroup = '' | BarSeriesKey | MetricKey
export type AiWarningLevel = 'severe' | 'medium' | 'info'
export type TroubleshootStepType = 'data' | 'config' | 'code'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

export interface PageRequest {
  pageNum: number
  pageSize: 10 | 20 | 50 | 100
}

export interface PageResult<T> {
  total: number
  pageNum: number
  pageSize: number
  pages: number
  records: T[]
}

export interface ProductClassTreeRequest {
  statusCd?: string
}

export interface ProductClassNode {
  id: string
  prodName: string
  prodCode: string
  prodLevel: 1 | 2 | 3
  parentProdCode: string
  children: ProductClassNode[]
}

export interface ProductStatisticsRequest {
  latnId?: string
  productCodes?: string[]
  orderState?: string
  timeType: TimeType
}

export interface TimeRangePayload {
  startTime: string
  endTime: string
}

export interface CompareMetricPayload {
  key: MetricKey
  title: string
  current: number
  previous: number
  rate: number
  desc: string
  currentRange: TimeRangePayload
  previousRange: TimeRangePayload
}

export interface ProductOrderBarPayload {
  productName: string
  productCode: string
  handling: number
  completed: number
  exception: number
  canceled: number
  deleted: number
  total: number
}

export interface TrendPayload {
  key: MetricKey
  title: string
  granularity: 'hour' | 'day'
  labels: string[]
  values: number[]
}

export interface ProductStatisticsPayload {
  query: ProductStatisticsRequest
  currentRange: TimeRangePayload
  previousRange: TimeRangePayload
  compareCards: CompareMetricPayload[]
  productBars: ProductOrderBarPayload[]
  trends: TrendPayload[]
  generatedAt: string
}

export interface ProductListRequest extends PageRequest {
  latnId?: string
  productCodes?: string[]
  productName?: string
  orderState?: string
  linkState?: string
  statusGroup?: ApiStatusGroup
  startTime: string
  endTime: string
  trendTime?: string
}

export interface ProductOrderRecordPayload {
  index?: number
  acceptDate: string
  orderItemId: string
  custOrderId: string
  latnId: string
  latnName: string
  prodId: string
  prodName: string
  statusCd: string
  orderStateName: string
  channelType: string
  finishTime?: string
  serviceOfferName?: string
  accNbr?: string
  linkThreeName?: string
  linkState: string
  statement?: string
  thirdProdName?: string
}

export interface AiAnalysisRequest {
  query: ProductStatisticsRequest
  currentRange: TimeRangePayload
  previousRange: TimeRangePayload
  compareCards: CompareMetricPayload[]
  productBars: ProductOrderBarPayload[]
  trends: TrendPayload[]
}

export interface AiAnalysisPayload {
  markdown: string
  html: string
  sections: Array<{
    title: string
    content: string
  }>
  warnings: Array<{
    level: AiWarningLevel
    title: string
    suggestion: string
  }>
  generatedAt: string
}

export interface AiTroubleshootRequest {
  question: string
  context?: {
    route?: string
    requestParams?: Record<string, unknown>
    errorMessage?: string
  }
}

export interface TroubleshootStepPayload {
  type: TroubleshootStepType
  title: string
  sql: string
  params: string
  expect: string
  abnormal: string
  tables: string[]
  source: string
}

export interface AiTroubleshootPayload {
  summary: string
  steps: TroubleshootStepPayload[]
  generatedAt: string
}
