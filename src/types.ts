export type TimeType = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'
export type MetricKey = 'total' | 'completed' | 'handling' | 'deleted' | 'canceled'
export type BarSeriesKey = 'handling' | 'completed' | 'exception' | 'canceled' | 'deleted'

export interface ProductSort {
  id: string
  prodName: string
  prodCode: string
  prodLevel: number
  parentProdCode: string
  statusCd: string
}

export interface MapCode {
  code: string
  name: string
  type: string
}

export interface OrderRecord {
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
  finishTime: string
  serviceOfferName: string
  accNbr: string
  linkThreeName: string
  linkState: string
  statement: string
  thirdProdName: string
}

export interface ProductOption {
  code: string
  name: string
  children: Array<{ code: string; name: string }>
}

export interface QueryFilters {
  latnId: string
  productCodes: string[]
  orderState: string
  timeType: TimeType
}

export interface ListFilters {
  latnId: string
  productCodes: string[]
  productName: string
  orderState: string
  linkState: string
  statusGroup: '' | BarSeriesKey | MetricKey
  startTime: string
  endTime: string
  trendTime: string
}

export interface CompareCard {
  key: MetricKey
  title: string
  current: number
  previous: number
  rate: number
  desc: string
}

export interface BarRow {
  productName: string
  productCode: string
  handling: number
  completed: number
  exception: number
  canceled: number
  deleted: number
}

export interface TrendSeries {
  key: MetricKey
  title: string
  labels: string[]
  values: number[]
}
