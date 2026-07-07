<template>
  <el-container class="app-shell">
    <el-aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">效</div>
        <div>
          <strong>产品效能分析平台</strong>
          <span>订单全生命周期监控</span>
        </div>
      </div>
      <el-menu :default-active="route.path" router class="nav-menu">
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
      <div class="tech-info">
        <el-tag effect="plain">Vue3 + TypeScript + ECharts</el-tag>
      </div>
    </el-aside>
    <el-main class="main-view">
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
