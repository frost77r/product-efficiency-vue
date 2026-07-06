<template>
  <div>
    <div class="filter-panel">
      <el-form :model="filters" label-width="78px">
        <el-row :gutter="14" align="middle">
          <el-col :span="4">
            <el-form-item label="本地网">
              <el-select v-model="filters.latnId" clearable>
                <el-option label="全省" value="888" />
                <el-option v-for="item in latnOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="产品分类">
              <ProductSelector v-model="filters.productCodes" :options="productOptions" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="订单状态">
              <el-select v-model="filters.orderState" clearable>
                <el-option label="全部" value="" />
                <el-option v-for="item in statusOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="统计时间">
              <el-select v-model="filters.timeType">
                <el-option label="当天" value="TODAY" />
                <el-option label="本周" value="THIS_WEEK" />
                <el-option label="当月" value="THIS_MONTH" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label-width="0">
              <el-button type="primary" :icon="Search">查询</el-button>
              <el-button type="success" :icon="MagicStick" @click="openReport">AI综合分析</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div class="muted">演示数据时间锚点：{{ rangeText }}。当天/本周/当月均按样例数据中的最新受理时间对齐。</div>
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
import type { BarSeriesKey, MetricKey, QueryFilters, TrendSeries } from '@/types'
import { getRangeFromTimeType } from '@/utils/date'
import { barMeta, buildProductOptions, demoAnchor, getTimeRangeText, latnOptions, makeBarRows, makeCompareCards, makeTrendSeries, statusOptions } from '@/utils/statistics'
import { buildAnalysisReport } from '@/utils/report'
import { CopyDocument, Download, MagicStick, Printer, Search } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { computed, reactive, ref } from 'vue'
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

const cards = computed(() => makeCompareCards(filters))
const bars = computed(() => makeBarRows(filters))
const trends = computed(() => makeTrendSeries(filters))
const rangeText = computed(() => getTimeRangeText(filters.timeType))
const reportVisible = ref(false)
const reportHtml = computed(() => buildAnalysisReport(cards.value, bars.value, trends.value))

const barOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { top: 0 },
  grid: { left: 42, right: 20, top: 42, bottom: 78 },
  xAxis: {
    type: 'category',
    data: bars.value.map((item) => item.productName),
    axisLabel: { interval: 0, rotate: 30, width: 92, overflow: 'truncate' }
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: (Object.keys(barMeta) as BarSeriesKey[]).map((key) => ({
    name: barMeta[key].name,
    type: 'bar',
    stack: 'orders',
    data: bars.value.map((item) => item[key]),
    itemStyle: { color: barMeta[key].color },
    label: { show: key === 'completed', position: 'insideTop', formatter: '{c}' }
  }))
}))

function trendOption(trend: TrendSeries): EChartsOption {
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

function listBaseQuery() {
  const range = getRangeFromTimeType(filters.timeType, demoAnchor)
  return {
    latnId: filters.latnId,
    productCodes: filters.productCodes.join(','),
    startTime: range.startTime,
    endTime: range.endTime
  }
}

function goListByMetric(key: MetricKey) {
  router.push({ path: '/list', query: { ...listBaseQuery(), statusGroup: key } })
}

function onBarClick(params: unknown) {
  const item = params as { name?: string; seriesName?: string }
  const seriesKey = (Object.keys(barMeta) as BarSeriesKey[]).find((key) => barMeta[key].name === item.seriesName) ?? ''
  router.push({ path: '/list', query: { ...listBaseQuery(), productName: item.name ?? '', statusGroup: seriesKey } })
}

function onTrendClick(key: MetricKey, params: unknown) {
  const item = params as { name?: string }
  router.push({ path: '/list', query: { ...listBaseQuery(), statusGroup: key, trendTime: item.name ?? '' } })
}

function openReport() {
  reportVisible.value = true
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
