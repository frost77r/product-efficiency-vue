<template>
  <div>
    <div class="filter-panel">
      <el-form :model="filters" label-width="72px" size="default">
        <el-row :gutter="16" align="middle">
          <el-col :span="4">
            <el-form-item label="本地网">
              <el-select v-model="filters.latnId" clearable size="default">
                <el-option label="全省" value="888" />
                <el-option v-for="item in latnOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="产品分类">
              <ProductSelector v-model="filters.productCodes" :options="productOptions" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="订单状态">
              <el-select v-model="filters.orderState" clearable size="default">
                <el-option label="全部" value="" />
                <el-option v-for="item in statusOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="统计时间">
              <el-select v-model="filters.timeType" size="default">
                <el-option label="当天" value="TODAY" />
                <el-option label="本周" value="THIS_WEEK" />
                <el-option label="当月" value="THIS_MONTH" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label-width="0">
              <el-button type="primary" :icon="Search" size="default" @click="fetchStatistics">查询</el-button>
              <el-button type="success" :icon="MagicStick" :loading="aiLoading" @click="openReport" size="default">AI综合分析</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="metric-grid">
      <div v-for="card in cards" :key="card.key" class="metric-card" @click="goListByMetric(card.key)">
        <div class="metric-title">{{ card.title }}</div>
        <div class="metric-value">
          <strong>{{ card.current }}</strong>
          <span :class="card.rate >= 0 ? 'rate-up' : 'rate-down'">{{ card.rate >= 0 ? '↑' : '↓' }}{{ Math.abs(card.rate).toFixed(1) }}%</span>
        </div>
        <div class="muted">{{ card.desc }}，上期 {{ card.previous }}</div>
      </div>
    </div>

    <ChartPanel title="产品订单统计" :option="barOption" tag="点击柱子钻取清单" @chart-click="onBarClick" />

    <div class="trend-grid">
      <ChartPanel
        v-for="(trend, index) in trends"
        :key="trend.key"
        :class="{ center: index === trends.length - 1 }"
        :title="trend.title"
        :option="trendOption(trend)"
        tag="点击数据点钻取"
        :areaClick="true"
        @chart-click="(params) => onTrendClick(trend.key, params)"
      />
    </div>

    <el-dialog v-model="reportVisible" title="AI综合分析报告" width="920px" top="24px">
      <div class="muted" style="margin-bottom: 12px">统计范围：{{ rangeText }}，已汇总 5 个环比指标、1 个柱状图和 5 个趋势图。</div>
      <div class="report-body" v-html="reportHtml"></div>
      <template #footer>
        <el-button :icon="CopyDocument" @click="copyReport">复制报告</el-button>
        <el-button :icon="Download" @click="exportHtml">导出 HTML</el-button>
        <el-button type="primary" :icon="Printer" @click="printReport">导出 PDF</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ChartPanel from '@/components/ChartPanel.vue'
import ProductSelector from '@/components/ProductSelector.vue'
import type { BarSeriesKey, MetricKey, QueryFilters } from '@/types'
import { formatDateTime, getAlignedRanges, getRangeFromTimeType, getRangeFromTrendLabel } from '@/utils/date'
import { barMeta, buildProductOptions, getTimeRangeText, latnOptions, statusOptions } from '@/utils/statistics'
import { productEfficiencyApi } from '@/api'
import type { CompareMetricPayload, ProductOrderBarPayload, TrendPayload } from '@/api/types'

import { CopyDocument, Download, MagicStick, Printer, Search } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const productOptions = buildProductOptions()
const filters = reactive<QueryFilters>({
  latnId: '888',
  productCodes: [],
  orderState: '',
  timeType: 'THIS_MONTH'
})

const cards = ref<CompareMetricPayload[]>([])
const bars = ref<ProductOrderBarPayload[]>([])
const trends = ref<TrendPayload[]>([])
const rangeText = ref(getTimeRangeText(filters.timeType))

async function fetchStatistics() {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } = getAlignedRanges(filters.timeType, new Date())
    const currentRangeObj = { startTime: formatDateTime(currentStart), endTime: formatDateTime(currentEnd) }
    const previousRangeObj = { startTime: formatDateTime(previousStart), endTime: formatDateTime(previousEnd) }
    
    const res = await productEfficiencyApi.productStatistics({
      latnId: filters.latnId,
      productCodes: filters.productCodes,
      orderState: filters.orderState,
      timeType: filters.timeType
    })
    
    cards.value = res.compareCards
    bars.value = res.productBars
    trends.value = res.trends
    rangeText.value = `${currentRangeObj.startTime} ~ ${currentRangeObj.endTime}`
  } catch (e: any) {
    ElMessage.error(e.message || '获取统计数据失败')
  }
}

onMounted(() => {
  fetchStatistics()
})
const reportVisible = ref(false)
const reportHtml = ref('')

const displayBars = computed(() => {
  const MAX_BARS = 12

  const source = filters.productCodes.length === 0
    ? bars.value.filter(b => PRIORITY_PRODUCTS.includes(b.productName))
    : bars.value

  if (source.length <= MAX_BARS) return source

  const topBars = source.slice(0, MAX_BARS - 1)
  const restBars = source.slice(MAX_BARS - 1)

  const otherBar: ProductOrderBarPayload = {
    productName: '...',
    productCode: '',
    handling: 0,
    completed: 0,
    exception: 0,
    canceled: 0,
    deleted: 0,
    total: 0
  }

  for (const bar of restBars) {
    otherBar.handling += bar.handling || 0
    otherBar.completed += bar.completed || 0
    otherBar.exception += bar.exception || 0
    otherBar.canceled += bar.canceled || 0
    otherBar.deleted += bar.deleted || 0
    otherBar.total += bar.total || 0
  }

  return [...topBars, otherBar]
})

const barOption = computed<EChartsOption>(() => {
  const dataList = displayBars.value
  const categoryCount = dataList.length
  const baseBarWidth = Math.max(20, Math.min(40, 300 / categoryCount))

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0 },
    grid: { left: 42, right: 20, top: 42, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dataList.map((item) => item.productName),
      axisLabel: { show: true, interval: 0, rotate: 0, fontSize: 10 }
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: (Object.keys(barMeta) as BarSeriesKey[]).map((key) => ({
      name: barMeta[key].name,
      type: 'bar',
      stack: 'orders',
      barWidth: baseBarWidth,
      data: dataList.map((item) => item[key]),
      itemStyle: { color: barMeta[key].color }
    }))
  }
})

function trendOption(trend: TrendPayload): EChartsOption {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 18, top: 22, bottom: 38 },
    xAxis: { type: 'category', boundaryGap: false, data: trend.labels },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: trend.title,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        areaStyle: { opacity: 0.16 },
        data: trend.values
      }
    ]
  }
}

const PRIORITY_PRODUCTS = ['天翼宽带有线', '手机', 'iTV', '全屋WIFI', '智能家居', '天翼云盘（个人版）', '智能应答', '翼支付']

function listBaseQuery() {
  const range = getRangeFromTimeType(filters.timeType, new Date())
  return {
    latnId: filters.latnId,
    productCodes: filters.productCodes.join(','),
    orderState: filters.orderState,
    startTime: range.startTime,
    endTime: range.endTime
  }
}

function goListByMetric(key: MetricKey) {
  router.push({ path: '/list', query: { ...listBaseQuery(), statusGroup: key } })
}

function onBarClick(params: unknown) {
  const item = params as { name?: string; seriesName?: string }
  if (item.name === '...') return
  const seriesKey = (Object.keys(barMeta) as BarSeriesKey[]).find((key) => barMeta[key].name === item.seriesName) ?? ''
  router.push({ path: '/list', query: { ...listBaseQuery(), productName: item.name ?? '', statusGroup: seriesKey } })
}

function onTrendClick(key: MetricKey, params: unknown) {
  const item = params as { name?: string }
  if (!item.name) return
  const exact = getRangeFromTrendLabel(item.name, filters.timeType, new Date())
  router.push({ path: '/list', query: { ...listBaseQuery(), statusGroup: key, startTime: exact.startTime, endTime: exact.endTime } })
}

const aiLoading = ref(false)

async function openReport() {
  aiLoading.value = true
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } = getAlignedRanges(filters.timeType, new Date())
    const currentRangeObj = { startTime: formatDateTime(currentStart), endTime: formatDateTime(currentEnd) }
    const previousRangeObj = { startTime: formatDateTime(previousStart), endTime: formatDateTime(previousEnd) }
    
    const payload = {
      query: {
        latnId: filters.latnId,
        productCodes: filters.productCodes,
        orderState: filters.orderState,
        timeType: filters.timeType
      },
      currentRange: currentRangeObj,
      previousRange: previousRangeObj,
      compareCards: cards.value.map(c => ({
        ...c,
        currentRange: currentRangeObj,
        previousRange: previousRangeObj
      })),
      productBars: bars.value.map(b => ({
        ...b,
        total: b.total ?? (b.handling + b.completed + b.exception + b.canceled + b.deleted)
      })),
      trends: trends.value.map(t => ({
        ...t,
        granularity: (filters.timeType === 'TODAY' ? 'hour' : 'day') as 'hour' | 'day'
      }))
    }
    const res = await productEfficiencyApi.aiAnalysis(payload)
    reportHtml.value = res.html
    reportVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || 'AI 分析失败')
  } finally {
    aiLoading.value = false
  }
}

async function copyReport() {
  await navigator.clipboard.writeText(reportHtml.value.replace(/<[^>]+>/g, ''))
  ElMessage.success('报告已复制')
}

function exportHtml() {
  const blob = new Blob([`<!doctype html><meta charset="utf-8"><title>AI综合分析报告</title>${reportHtml.value}`], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ai-analysis-report.html'
  link.click()
  URL.revokeObjectURL(url)
}

function printReport() {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!doctype html><meta charset="utf-8"><title>AI综合分析报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.8;padding:28px}</style>${reportHtml.value}`)
  win.document.close()
  win.print()
}
</script>
