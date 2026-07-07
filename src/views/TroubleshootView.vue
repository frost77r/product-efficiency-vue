<template>
  <div>
    <div class="assistant-head">
      <div>
        <h2>运维智能助手</h2>
        <p>输入报错或异常现象，生成“先查数据 → 再查配置 → 再查代码”的核查指引。</p>
      </div>
      <el-tag effect="plain">选做模块</el-tag>
    </div>

    <div class="filter-panel">
      <div class="quick-questions">
        <span>快捷问题：</span>
        <el-button v-for="item in questions" :key="item" link type="primary" @click="ask(item)">{{ item }}</el-button>
      </div>
      <div class="question-row">
        <el-input v-model="question" type="textarea" :rows="4" placeholder="请描述问题：报错信息 / 异常现象 / 数据疑问，越具体越好" />
        <el-button type="primary" size="large" :icon="Search" :loading="loading" @click="analyze">智能分析</el-button>
      </div>
    </div>

    <div v-if="result" class="section-panel">
      <div class="section-title">
        <span>{{ result.summary }}</span>
        <span class="muted">分析时间：{{ result.time }}</span>
      </div>
      <el-collapse v-model="activeSteps">
        <el-collapse-item v-for="(step, index) in result.steps" :key="step.title" :name="String(index)">
          <template #title>
            <div class="step-title">
              <span class="step-num">{{ index + 1 }}</span>
              <strong>{{ step.title }}</strong>
              <el-tag size="small" :type="step.type === 'data' ? 'primary' : step.type === 'config' ? 'warning' : 'success'">
                {{ step.type === 'data' ? '查数据' : step.type === 'config' ? '查配置' : '查代码' }}
              </el-tag>
            </div>
          </template>
          <div class="step-body">
            <div v-if="step.sql" class="step-block">
              <div class="block-label">执行 SQL / 命令</div>
              <pre><button type="button" @click="copy(step.sql)">复制</button><code>{{ step.sql }}</code></pre>
            </div>
            <div class="step-grid">
              <div v-if="step.params"><strong>入参说明</strong><p>{{ step.params }}</p></div>
              <div v-if="step.expect"><strong>预期结果</strong><p>{{ step.expect }}</p></div>
              <div v-if="step.abnormal"><strong>异常处理</strong><p>{{ step.abnormal }}</p></div>
              <div v-if="step.source"><strong>关联源码</strong><p>{{ step.source }}</p></div>
            </div>
            <div v-if="step.tables?.length" class="table-tags">
              <el-tag v-for="item in step.tables" :key="item" effect="plain">{{ item }}</el-tag>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { productEfficiencyApi } from '@/api'
import { useRoute } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const route = useRoute()

interface Step {
  type: 'data' | 'config' | 'code'
  title: string
  sql: string
  params: string
  expect: string
  abnormal: string
  tables?: string[]
  source: string
}

interface Result {
  summary: string
  time: string
  steps: Step[]
}

const questions = [
  '云电脑近3天订单量为什么都是0',
  '统计页竣工率一直显示100%数据不对',
  '撤单量趋势图和环比卡片数据不一致',
  '统计页报错 输入参数为空 BusinessException'
]

const question = ref('')
const loading = ref(false)
const result = ref<Result | null>(null)
const activeSteps = ref(['0', '1', '2'])

function ask(value: string) {
  question.value = value
  analyze()
}

async function analyze() {
  if (!question.value.trim()) {
    ElMessage.warning('请输入问题描述')
    return
  }
  loading.value = true
  try {
    const payload = {
      question: question.value,
      context: {
        route: route.path,
        requestParams: route.query,
        errorMessage: ''
      }
    }
    const res = await productEfficiencyApi.aiTroubleshoot(payload)
    result.value = {
      summary: res.summary,
      time: res.generatedAt,
      steps: res.steps as Step[]
    }
    activeSteps.value = result.value.steps.map((_, index) => String(index))
  } catch (e: any) {
    ElMessage.error(e.message || '智能分析请求失败')
  } finally {
    loading.value = false
  }
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}
</script>

<style scoped>
.assistant-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  margin-bottom: 16px;
  color: #1f2937;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
}

.assistant-head h2 {
  margin: 0;
  font-size: 22px;
}

.assistant-head p {
  margin: 8px 0 0;
  color: #64748b;
}

.quick-questions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.question-row {
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 12px;
  align-items: stretch;
}

.question-row .el-button {
  height: 100%;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-num {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  color: #fff;
  background: #1677ff;
}

.step-body {
  padding: 2px 10px 18px 36px;
}

.step-block {
  margin-bottom: 14px;
}

.block-label {
  margin-bottom: 6px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}

pre {
  position: relative;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  color: #d7e2ef;
  background: #111827;
  border-radius: 6px;
  line-height: 1.65;
}

pre button {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #d7e2ef;
  background: #243244;
  border: 1px solid #465568;
  border-radius: 4px;
  cursor: pointer;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.step-grid > div {
  padding: 12px;
  background: #f8fbff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.step-grid p {
  margin: 6px 0 0;
  color: #526070;
  line-height: 1.7;
}

.table-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
