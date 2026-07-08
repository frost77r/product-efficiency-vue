import { fetchGet, postJson } from './http'
import type {
  AiAnalysisPayload,
  AiAnalysisRequest,
  AiTroubleshootPayload,
  AiTroubleshootRequest,
  PageResult,
  ProductClassNode,
  ProductClassTreeRequest,
  ProductListRequest,
  ProductOrderRecordPayload,
  ProductStatisticsPayload,
  ProductStatisticsRequest,
  AnalysisReportHistoryItem,
  TroubleshootSessionHistoryItem,
  PromptsPayload,
  PromptsRequest
} from './types'

export const productEfficiencyApi = {
  productClassTree(payload: ProductClassTreeRequest = {}) {
    return postJson<ProductClassNode[], ProductClassTreeRequest>('/productClassTree', payload)
  },

  productStatistics(payload: ProductStatisticsRequest) {
    return postJson<ProductStatisticsPayload, ProductStatisticsRequest>('/productStatistics', payload)
  },

  productList(payload: ProductListRequest) {
    return postJson<PageResult<ProductOrderRecordPayload>, ProductListRequest>('/productList', payload)
  },

  aiAnalysis(payload: AiAnalysisRequest) {
    return postJson<AiAnalysisPayload, AiAnalysisRequest>('/ai/analysis', payload)
  },

  aiTroubleshoot(payload: AiTroubleshootRequest) {
    return postJson<AiTroubleshootPayload, AiTroubleshootRequest>('/ai/troubleshoot', payload)
  },

  getHistoryAnalysis() {
    return fetchGet<AnalysisReportHistoryItem[]>('/ai/history/analysis')
  },

  getHistoryTroubleshoot() {
    return fetchGet<TroubleshootSessionHistoryItem[]>('/ai/history/troubleshoot')
  },

  getPrompts() {
    return fetchGet<PromptsPayload>('/ai/prompts')
  },

  updatePrompts(payload: PromptsRequest) {
    return postJson<PromptsPayload, PromptsRequest>('/ai/prompts', payload)
  }
}

export * from './types'
