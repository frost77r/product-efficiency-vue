<template>
  <el-container class="app-shell" direction="vertical">
    <el-header class="top-shell">
      <div class="brand">
        <div class="brand-mark">效</div>
        <div>
          <strong>产品效能分析平台</strong>
          <span>订单全生命周期监控</span>
        </div>
      </div>
      <el-menu :default-active="route.path" router mode="horizontal" class="nav-menu">
        <el-menu-item index="/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <span>统计分析</span>
        </el-menu-item>
        <el-menu-item index="/list">
          <el-icon><Tickets /></el-icon>
          <span>订单清单</span>
        </el-menu-item>
        <el-menu-item index="/troubleshoot">
          <el-icon><Tools /></el-icon>
          <span>运维助手</span>
        </el-menu-item>
      </el-menu>
      <el-tag class="tech-tag" effect="plain">Vue3 + TypeScript + ECharts</el-tag>
    </el-header>
    <el-main class="main-view">
      <div class="page-heading">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>基于作业样例数据，本地完成统计、钻取、趋势和报告演示。</p>
        </div>
      </div>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => {
  if (route.path.startsWith('/list')) return '订单清单详情'
  if (route.path.startsWith('/troubleshoot')) return '运维智能助手'
  return '产品效能统计分析'
})
</script>
