<template>
  <div class="ai-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>AI 记录与提示词管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="分析报告记录" name="analysis">
          <el-table :data="analysisRecords" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="report_no" label="报告编号" width="180" />
            <el-table-column prop="title" label="报告标题" />
            <el-table-column prop="time_type" label="时间维度" width="120">
              <template #default="{ row }">
                {{ formatTimeType(row.time_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="生成状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="排障会话记录" name="troubleshoot">
          <el-table :data="troubleshootRecords" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="session_no" label="会话编号" width="180" />
            <el-table-column prop="question" label="用户提问" show-overflow-tooltip />
            <el-table-column prop="summary" label="AI 摘要" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : (row.status === 'FALLBACK' ? 'warning' : 'danger')">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="AI 提示词配置" name="prompts">
          <div class="prompts-container" v-loading="loading">
            <el-form label-position="top">
              <el-form-item label="综合分析提示词 (Analysis Prompt)">
                <el-input
                  v-model="promptsForm.analysis_prompt"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入综合分析功能的系统提示词..."
                />
              </el-form-item>
              
              <el-form-item label="智能排障提示词 (Troubleshoot Prompt)">
                <el-input
                  v-model="promptsForm.troubleshoot_prompt"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入智能排障功能的系统提示词..."
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="savePrompts" :loading="saving">保存配置</el-button>
                <el-button @click="loadPrompts">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { productEfficiencyApi } from '@/api/productEfficiency'
import type { AnalysisReportHistoryItem, TroubleshootSessionHistoryItem, PromptsPayload } from '@/api/types'

const activeTab = ref('analysis')
const loading = ref(false)
const saving = ref(false)

const analysisRecords = ref<AnalysisReportHistoryItem[]>([])
const troubleshootRecords = ref<TroubleshootSessionHistoryItem[]>([])
const promptsForm = ref<PromptsPayload>({
  analysis_prompt: '',
  troubleshoot_prompt: ''
})

const formatTimeType = (type: string) => {
  const map: Record<string, string> = {
    'TODAY': '今日',
    'THIS_WEEK': '本周',
    'THIS_MONTH': '本月'
  }
  return map[type] || type
}

const loadAnalysis = async () => {
  loading.value = true
  try {
    analysisRecords.value = await productEfficiencyApi.getHistoryAnalysis()
  } catch (error: any) {
    ElMessage.error(error.message || '加载分析记录失败')
  } finally {
    loading.value = false
  }
}

const loadTroubleshoot = async () => {
  loading.value = true
  try {
    troubleshootRecords.value = await productEfficiencyApi.getHistoryTroubleshoot()
  } catch (error: any) {
    ElMessage.error(error.message || '加载排障记录失败')
  } finally {
    loading.value = false
  }
}

const loadPrompts = async () => {
  loading.value = true
  try {
    const data = await productEfficiencyApi.getPrompts()
    promptsForm.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '加载提示词失败')
  } finally {
    loading.value = false
  }
}

const savePrompts = async () => {
  saving.value = true
  try {
    const data = await productEfficiencyApi.updatePrompts({
      analysis_prompt: promptsForm.value.analysis_prompt,
      troubleshoot_prompt: promptsForm.value.troubleshoot_prompt
    })
    promptsForm.value = data
    ElMessage.success('提示词保存成功')
  } catch (error: any) {
    ElMessage.error(error.message || '保存提示词失败')
  } finally {
    saving.value = false
  }
}

const handleTabClick = (tab: any) => {
  const name = tab.paneName
  if (name === 'analysis' && analysisRecords.value.length === 0) {
    loadAnalysis()
  } else if (name === 'troubleshoot' && troubleshootRecords.value.length === 0) {
    loadTroubleshoot()
  } else if (name === 'prompts' && !promptsForm.value.analysis_prompt) {
    loadPrompts()
  }
}

onMounted(() => {
  loadAnalysis()
})
</script>

<style scoped>
.ai-management {
  padding: 20px;
}
.card-header {
  font-weight: bold;
  font-size: 16px;
}
.prompts-container {
  max-width: 800px;
  margin-top: 20px;
}
</style>
