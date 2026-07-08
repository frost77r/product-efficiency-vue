<template>
  <el-container class="app-shell">
    <el-aside :class="['sidebar', { 'sidebar-collapsed': isCollapsed }]">
      <div class="brand">
        <div class="brand-mark">效</div>
        <div class="brand-text">
          <strong>产品效能分析平台</strong>
          <span>订单全生命周期监控</span>
        </div>
      </div>
      <el-menu :default-active="route.path" router class="nav-menu">
        <el-tooltip v-if="isCollapsed" :content="'统计分析'" placement="right">
          <el-menu-item index="/statistics">
            <el-icon><DataAnalysis /></el-icon>
            <span class="menu-text">统计分析</span>
          </el-menu-item>
        </el-tooltip>
        <el-menu-item v-else index="/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <span>统计分析</span>
        </el-menu-item>
        
        <el-tooltip v-if="isCollapsed" :content="'订单清单'" placement="right">
          <el-menu-item index="/list">
            <el-icon><Tickets /></el-icon>
            <span class="menu-text">订单清单</span>
          </el-menu-item>
        </el-tooltip>
        <el-menu-item v-else index="/list">
          <el-icon><Tickets /></el-icon>
          <span>订单清单</span>
        </el-menu-item>
        
        <el-tooltip v-if="isCollapsed" :content="'运维助手'" placement="right">
          <el-menu-item index="/troubleshoot">
            <el-icon><Tools /></el-icon>
            <span class="menu-text">运维助手</span>
          </el-menu-item>
        </el-tooltip>
        <el-menu-item v-else index="/troubleshoot">
          <el-icon><Tools /></el-icon>
          <span>运维助手</span>
        </el-menu-item>

        <el-tooltip v-if="isCollapsed" :content="'AI记录管理'" placement="right">
          <el-menu-item index="/ai-management">
            <el-icon><Setting /></el-icon>
            <span class="menu-text">AI记录管理</span>
          </el-menu-item>
        </el-tooltip>
        <el-menu-item v-else index="/ai-management">
          <el-icon><Setting /></el-icon>
          <span>AI记录管理</span>
        </el-menu-item>
      </el-menu>
      <div class="collapse-btn">
        <el-button 
          type="text" 
          :icon="isCollapsed ? ArrowRight : ArrowLeft"
          @click="toggleCollapse"
          class="collapse-toggle"
        />
      </div>
    </el-aside>
    <el-main :class="['main-view', { 'main-view-collapsed': isCollapsed }]">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()

// 从 localStorage 读取折叠状态，默认展开
const isCollapsed = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', String(isCollapsed.value))
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/list')) return '订单清单详情'
  if (route.path.startsWith('/troubleshoot')) return '运维智能助手'
  if (route.path.startsWith('/ai-management')) return 'AI记录管理'
  return '产品效能统计分析'
})
</script>
