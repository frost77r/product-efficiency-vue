<template>
  <div class="section-panel">
    <div class="section-title">
      <span>{{ title }}</span>
      <el-tag v-if="tag" size="small" effect="plain">{{ tag }}</el-tag>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  title: string
  option: EChartsOption
  tag?: string
  areaClick?: boolean
}>()

const emit = defineEmits<{
  chartClick: [params: unknown]
}>()

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
    if (props.areaClick) {
      chart.getZr().on('click', (params: any) => {
        if (!chart) return
        const point = [params.offsetX, params.offsetY]
        if (chart.containPixel('grid', point)) {
          const xIndex = chart.convertFromPixel({ seriesIndex: 0 }, point)[0] as number
          const opt = chart.getOption() as any
          const name = opt.xAxis?.[0]?.data?.[xIndex]
          if (name) emit('chartClick', { name })
        }
      })
    } else {
      chart.on('click', (params) => emit('chartClick', params))
    }
  }
  chart.setOption(props.option, true)
}

const resize = () => chart?.resize()

onMounted(() => {
  render()
  window.addEventListener('resize', resize)
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})
</script>
