# 产品效能分析接口文档

本文档根据 `AI实践作业.docx` 的接口设计预留前后端契约。所有接口均使用 `POST`，请求体和响应体均为 `application/json`。

## 1. 通用约定

### 1.1 基础路径

前端通过 `VITE_API_BASE_URL` 配置后端地址，例如：

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
```

### 1.2 通用响应结构

后端所有接口建议统一返回：

```ts
interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
}
```

成功示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "traceId": "b7c9b1fd8c6e4f36"
}
```

失败示例：

```json
{
  "code": 40001,
  "message": "startTime 不能为空",
  "data": null,
  "traceId": "b7c9b1fd8c6e4f36"
}
```

### 1.3 枚举约定

```ts
type TimeType = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'
type MetricKey = 'total' | 'completed' | 'handling' | 'deleted' | 'canceled'
type BarSeriesKey = 'handling' | 'completed' | 'exception' | 'canceled' | 'deleted'
type StatusGroup = '' | MetricKey | BarSeriesKey
```

关键状态码：

| 含义 | 字段 | 值 |
| --- | --- | --- |
| 竣工 | `statusCd` | `300000` |
| 撤单 | `statusCd` | `401300` |
| 删单/作废 | `statusCd` | `100004`，可扩展 `401397`、`401398`、`401400`、`401700` |
| 在途 | `linkState` | `0` |
| 正常 | `linkState` | `1` |
| 异常 | `linkState` | `9` |

## 2. 产品分类树查询

### `POST /productClassTree`

用途：查询 `edo_product_sort` 产品分类树，供两级联动多选组件使用。

### 前端请求结构

```ts
interface ProductClassTreeRequest {
  statusCd?: string
}
```

请求示例：

```json
{
  "statusCd": "1"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `statusCd` | `string` | 否 | 产品分类状态，默认查询有效状态 `1` |

### 后端返回结构

```ts
interface ProductClassNode {
  id: string
  prodName: string
  prodCode: string
  prodLevel: 1 | 2 | 3
  parentProdCode: string
  children: ProductClassNode[]
}
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "1",
      "prodName": "云",
      "prodCode": "cloud",
      "prodLevel": 1,
      "parentProdCode": "-1",
      "children": [
        {
          "id": "11",
          "prodName": "云",
          "prodCode": "cloud_2",
          "prodLevel": 2,
          "parentProdCode": "cloud",
          "children": [
            {
              "id": "111",
              "prodName": "天翼云盘-免费版",
              "prodCode": "794524928",
              "prodLevel": 3,
              "parentProdCode": "cloud_2",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

## 3. 统计页全部数据查询

### `POST /productStatistics`

用途：统计分析页一次性查询 11 个统计视图，包括 5 个环比卡片、产品订单堆叠柱状图、5 个趋势折线图。

### 前端请求结构

```ts
interface ProductStatisticsRequest {
  latnId?: string
  productCodes?: string[]
  orderState?: string
  timeType: TimeType
}
```

请求示例：

```json
{
  "latnId": "888",
  "productCodes": ["794524928", "794526674"],
  "orderState": "",
  "timeType": "THIS_MONTH"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `latnId` | `string` | 否 | 本地网编码，`888` 或空表示全省 |
| `productCodes` | `string[]` | 否 | 三级产品编码数组，空数组表示全部产品 |
| `orderState` | `string` | 否 | 订单状态码，空表示全部 |
| `timeType` | `TimeType` | 是 | 统计时间：当天、本周、当月 |

后端必须按 `timeType` 做时间对齐：

| `timeType` | 本期 | 上期 |
| --- | --- | --- |
| `TODAY` | 今日 00:00 到当前时间 | 昨日 00:00 到昨日同一时间点 |
| `THIS_WEEK` | 本周一 00:00 到当前时间 | 上周一 00:00 到上周同星期同时间点 |
| `THIS_MONTH` | 本月 1 日 00:00 到当前时间 | 上月 1 日 00:00 到上月同日同时间点 |

### 后端返回结构

```ts
interface TimeRangePayload {
  startTime: string
  endTime: string
}

interface CompareMetricPayload {
  key: MetricKey
  title: string
  current: number
  previous: number
  rate: number
  desc: string
  currentRange: TimeRangePayload
  previousRange: TimeRangePayload
}

interface ProductOrderBarPayload {
  productName: string
  productCode: string
  handling: number
  completed: number
  exception: number
  canceled: number
  deleted: number
  total: number
}

interface TrendPayload {
  key: MetricKey
  title: string
  granularity: 'hour' | 'day'
  labels: string[]
  values: number[]
}

interface ProductStatisticsPayload {
  query: ProductStatisticsRequest
  currentRange: TimeRangePayload
  previousRange: TimeRangePayload
  compareCards: CompareMetricPayload[]
  productBars: ProductOrderBarPayload[]
  trends: TrendPayload[]
  generatedAt: string
}
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "query": {
      "latnId": "888",
      "productCodes": [],
      "orderState": "",
      "timeType": "THIS_MONTH"
    },
    "currentRange": {
      "startTime": "2026-07-01 00:00:00",
      "endTime": "2026-07-06 14:30:00"
    },
    "previousRange": {
      "startTime": "2026-06-01 00:00:00",
      "endTime": "2026-06-06 14:30:00"
    },
    "compareCards": [
      {
        "key": "total",
        "title": "订单量环比",
        "current": 12580,
        "previous": 11182,
        "rate": 12.5,
        "desc": "本期订单总量",
        "currentRange": {
          "startTime": "2026-07-01 00:00:00",
          "endTime": "2026-07-06 14:30:00"
        },
        "previousRange": {
          "startTime": "2026-06-01 00:00:00",
          "endTime": "2026-06-06 14:30:00"
        }
      }
    ],
    "productBars": [
      {
        "productName": "天翼云盘-免费版",
        "productCode": "794524928",
        "handling": 520,
        "completed": 1860,
        "exception": 42,
        "canceled": 18,
        "deleted": 26,
        "total": 2466
      }
    ],
    "trends": [
      {
        "key": "total",
        "title": "订单总量趋势图",
        "granularity": "day",
        "labels": ["07-01", "07-02", "07-03", "07-04", "07-05", "07-06"],
        "values": [1200, 1600, 1420, 1800, 2010, 1320]
      }
    ],
    "generatedAt": "2026-07-06 14:30:00"
  }
}
```

趋势图要求：

- `timeType = TODAY` 时，`granularity = hour`，`labels` 使用 `00:00` 到当前小时。
- `timeType != TODAY` 时，`granularity = day`，`labels` 使用 `MM-dd`。
- 无数据时段必须补 `0`，保证 `labels.length === values.length`。

## 4. 清单分页列表查询

### `POST /productList`

用途：清单详情页按查询条件分页查询订单明细，支持从统计页钻取时的条件回显。

### 前端请求结构

```ts
interface ProductListRequest {
  pageNum: number
  pageSize: 10 | 20 | 50 | 100
  latnId?: string
  productCodes?: string[]
  productName?: string
  orderState?: string
  linkState?: string
  statusGroup?: StatusGroup
  startTime: string
  endTime: string
  trendTime?: string
}
```

请求示例：

```json
{
  "pageNum": 1,
  "pageSize": 10,
  "latnId": "888",
  "productCodes": ["794524928"],
  "productName": "天翼云盘-免费版",
  "orderState": "300000",
  "linkState": "",
  "statusGroup": "completed",
  "startTime": "2026-07-01 00:00:00",
  "endTime": "2026-07-06 14:30:00",
  "trendTime": ""
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNum` | `number` | 是 | 当前页，从 `1` 开始 |
| `pageSize` | `10 \| 20 \| 50 \| 100` | 是 | 每页条数 |
| `latnId` | `string` | 否 | 本地网编码，`888` 或空表示全省 |
| `productCodes` | `string[]` | 否 | 三级产品编码数组 |
| `productName` | `string` | 否 | 产品名称模糊匹配，柱状图钻取时传入 |
| `orderState` | `string` | 否 | 精确订单状态码 |
| `linkState` | `string` | 否 | 环节状态，`0` 在途、`9` 异常 |
| `statusGroup` | `StatusGroup` | 否 | 前端抽象状态组，后端可转成 SQL 条件 |
| `startTime` | `string` | 是 | 查询开始时间，格式 `yyyy-MM-dd HH:mm:ss` |
| `endTime` | `string` | 是 | 查询结束时间，格式 `yyyy-MM-dd HH:mm:ss` |
| `trendTime` | `string` | 否 | 趋势图点击时间点，例如 `08:00` 或 `07-06` |

状态组建议映射：

| `statusGroup` | 后端过滤条件 |
| --- | --- |
| `total` | 不额外过滤状态 |
| `completed` | `status_cd = '300000'` |
| `handling` | `status_cd NOT IN ('300000','100004','401300')` 且非删单扩展码 |
| `exception` | `link_state = '9'` |
| `deleted` | `status_cd IN ('100004','401397','401398','401400','401700')` |
| `canceled` | `status_cd = '401300'` |

### 后端返回结构

```ts
interface PageResult<T> {
  total: number
  pageNum: number
  pageSize: number
  pages: number
  records: T[]
}

interface ProductOrderRecordPayload {
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
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 358,
    "pageNum": 1,
    "pageSize": 10,
    "pages": 36,
    "records": [
      {
        "index": 1,
        "acceptDate": "2026-07-06 10:20:00",
        "orderItemId": "900000001",
        "custOrderId": "202607060001",
        "latnId": "550",
        "latnName": "合肥",
        "prodId": "794524928",
        "prodName": "天翼云盘-免费版",
        "statusCd": "300000",
        "orderStateName": "竣工",
        "channelType": "APP",
        "finishTime": "2026-07-06 10:45:18",
        "serviceOfferName": "线上受理",
        "accNbr": "189****0001",
        "linkThreeName": "归档完成",
        "linkState": "1",
        "statement": "您的订单已竣工",
        "thirdProdName": "天翼云盘-免费版"
      }
    ]
  }
}
```

空值展示约定：

- `accNbr`、`serviceOfferName`、`channelType`、`linkThreeName`、`statement`、`finishTime` 允许返回空字符串或 `null`。
- 前端展示时统一转为 `--`。

## 5. AI 综合分析

### `POST /ai/analysis`

用途：统计页点击“AI 综合分析”后，将当前页面 11 个视图数据传给后端，由后端组装 Prompt 并调用大模型，返回 6 章节报告。

### 前端请求结构

```ts
interface AiAnalysisRequest {
  query: ProductStatisticsRequest
  currentRange: TimeRangePayload
  previousRange: TimeRangePayload
  compareCards: CompareMetricPayload[]
  productBars: ProductOrderBarPayload[]
  trends: TrendPayload[]
}
```

请求示例：

```json
{
  "query": {
    "latnId": "888",
    "productCodes": [],
    "orderState": "",
    "timeType": "THIS_MONTH"
  },
  "currentRange": {
    "startTime": "2026-07-01 00:00:00",
    "endTime": "2026-07-06 14:30:00"
  },
  "previousRange": {
    "startTime": "2026-06-01 00:00:00",
    "endTime": "2026-06-06 14:30:00"
  },
  "compareCards": [],
  "productBars": [],
  "trends": []
}
```

### 后端返回结构

```ts
interface AiAnalysisPayload {
  markdown: string
  html: string
  sections: Array<{
    title: string
    content: string
  }>
  warnings: Array<{
    level: 'severe' | 'medium' | 'info'
    title: string
    suggestion: string
  }>
  generatedAt: string
}
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "markdown": "## 1. 整体运营概览\n...",
    "html": "<h2>1. 整体运营概览</h2><p>...</p>",
    "sections": [
      {
        "title": "整体运营概览",
        "content": "本期订单总量稳定增长，竣工处理能力整体平稳。"
      }
    ],
    "warnings": [
      {
        "level": "medium",
        "title": "在途单量偏高",
        "suggestion": "建议核查资源配置和开通环节耗时。"
      }
    ],
    "generatedAt": "2026-07-06 14:30:00"
  }
}
```

报告章节必须包含：

1. 整体运营概览
2. 订单状态健康度分析
3. 产品结构分析
4. 时间趋势研判
5. 环比变化解读
6. 综合预警与建议

## 6. AI 运维排障

### `POST /ai/troubleshoot`

用途：运维智能助手页面提交自然语言问题，后端结合源码上下文和业务表结构生成排障步骤。

### 前端请求结构

```ts
interface AiTroubleshootRequest {
  question: string
  context?: {
    route?: string
    requestParams?: Record<string, unknown>
    errorMessage?: string
  }
}
```

请求示例：

```json
{
  "question": "统计页点击查询后，趋势图没有数据，但清单页可以查到订单，请帮忙分析原因。",
  "context": {
    "route": "/statistics",
    "requestParams": {
      "latnId": "888",
      "timeType": "TODAY"
    },
    "errorMessage": ""
  }
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `question` | `string` | 是 | 用户自然语言问题或报错信息 |
| `context.route` | `string` | 否 | 当前页面路由 |
| `context.requestParams` | `object` | 否 | 相关接口请求参数 |
| `context.errorMessage` | `string` | 否 | 控制台、Network 或后端日志中的错误信息 |

### 后端返回结构

```ts
interface AiTroubleshootPayload {
  summary: string
  steps: TroubleshootStepPayload[]
  generatedAt: string
}

interface TroubleshootStepPayload {
  type: 'data' | 'config' | 'code'
  title: string
  sql: string
  params: string
  expect: string
  abnormal: string
  tables: string[]
  source: string
}
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "summary": "初步判断可能与趋势 SQL 时间分组、时间范围或补 0 逻辑有关。",
    "steps": [
      {
        "type": "data",
        "title": "核查订单主表是否存在当前时间范围数据",
        "sql": "SELECT COUNT(1) FROM dwd_order_prod_inst_efficiency WHERE accept_date BETWEEN #{startTime} AND #{endTime};",
        "params": "startTime/endTime 取统计页查询条件转换后的实际时间范围。",
        "expect": "COUNT > 0。",
        "abnormal": "如果 COUNT = 0，优先检查前端 timeType 到时间范围的转换。",
        "tables": ["dwd_order_prod_inst_efficiency.accept_date"],
        "source": "ProductStatisticsService / ProductStatisticsMapper.xml"
      }
    ],
    "generatedAt": "2026-07-06 14:30:00"
  }
}
```

排障步骤必须按“先查数据 -> 再查配置 -> 再查代码逻辑”排序，每步必须包含 7 个要素：步骤标题、执行 SQL/命令、入参说明、预期结果、异常处理、涉及表/字段、关联源码。

## 7. 前端预留代码位置

前端已预留 API 调用入口：

```ts
import { productEfficiencyApi } from '@/api'

await productEfficiencyApi.productClassTree()
await productEfficiencyApi.productStatistics(payload)
await productEfficiencyApi.productList(payload)
await productEfficiencyApi.aiAnalysis(payload)
await productEfficiencyApi.aiTroubleshoot(payload)
```

对应文件：

- `src/api/http.ts`：统一 `POST JSON` 请求封装。
- `src/api/types.ts`：前后端接口契约类型。
- `src/api/productEfficiency.ts`：5 个业务接口方法。

当前项目仍保留本地样例数据演示逻辑；接入真实后端时，将页面中 `src/utils/statistics.ts`、`src/utils/report.ts` 的本地计算替换为上述 API 调用即可。
