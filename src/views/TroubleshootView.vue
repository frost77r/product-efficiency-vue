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
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

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

const templates: Record<string, Result> = {
  zeroCloudPc: {
    summary: '初步判断：云电脑产品数据可能未同步到效能表，或产品编码映射不完整。',
    time: '本地模拟分析',
    steps: [
      {
        type: 'data',
        title: '检查订单效能表中云电脑近3天是否有数据',
        sql: "SELECT COUNT(1) AS cnt, MIN(accept_date) AS earliest, MAX(accept_date) AS latest\nFROM dwd_order_prod_inst_efficiency\nWHERE prod_name LIKE '%云电脑%'\n  AND accept_date >= DATE_SUB(NOW(), INTERVAL 3 DAY);",
        params: '产品名从问题中提取；时间范围取近3天。',
        expect: 'COUNT > 0，且 earliest/latest 应在近3天内。',
        abnormal: '如果 COUNT = 0，说明近3天数据未入库，继续检查产品编码和 ETL 同步。',
        tables: ['dwd_order_prod_inst_efficiency.prod_name', 'dwd_order_prod_inst_efficiency.accept_date'],
        source: 'ProductStatisticsMapper.xml -> selectProductOrderStats()'
      },
      {
        type: 'config',
        title: '检查云电脑产品编码是否完整映射',
        sql: "SELECT id, prod_name, prod_code, prod_level, parent_prod_code\nFROM edo_product_sort\nWHERE prod_name LIKE '%云电脑%'\n  AND status_cd = '1';",
        params: '从产品分类表读取全部云电脑相关三级产品编码。',
        expect: '应能查到云电脑、云电脑数据盘、天翼云电脑等产品。',
        abnormal: '如果分类表缺失，先维护产品分类；如果分类表存在但效能表无数据，检查 ETL。',
        tables: ['edo_product_sort.prod_name', 'edo_product_sort.prod_code'],
        source: 'OdsOrderProdInstServiceImpl.java -> loadProductClassTree()'
      },
      {
        type: 'code',
        title: '核对统计 SQL 是否传入正确产品编码',
        sql: "SELECT prod_name, COUNT(1) AS totalCnt\nFROM dwd_order_prod_inst_efficiency\nWHERE prod_id IN ('794524928','794524929','794526674')\nGROUP BY prod_name\nORDER BY totalCnt DESC;",
        params: 'prod_id 数组来自前端产品选择器。',
        expect: '传参正确时应返回云电脑相关统计数据。',
        abnormal: '如果 SQL 有数据但页面为 0，检查 Network 中 /productStatistics 的 productClassIds。',
        tables: ['dwd_order_prod_inst_efficiency.prod_id'],
        source: 'ProductStatisticsServiceImpl.java -> queryProductOrderStats()'
      }
    ]
  },
  default: {
    summary: '初步判断：优先核对入参、时间范围和统计 SQL 的过滤条件是否一致。',
    time: '本地模拟分析',
    steps: [
      {
        type: 'code',
        title: '定位报错堆栈或异常发生位置',
        sql: 'grep -A 30 "BusinessException" /path/to/logs/application.log | tail -50',
        params: '用报错发生时间前后5分钟过滤日志。',
        expect: '日志中能看到 Controller / Service / Mapper 的完整调用链。',
        abnormal: '如果看不到完整堆栈，临时提高日志级别后复现。',
        source: 'ProductStatisticsServiceImpl.java -> CommonUtil.checkCommonParams()'
      },
      {
        type: 'data',
        title: '手工验证当前筛选条件下是否有数据',
        sql: "SELECT COUNT(1) AS totalCnt\nFROM dwd_order_prod_inst_efficiency\nWHERE accept_date >= '开始时间'\n  AND accept_date <= '结束时间';",
        params: '开始和结束时间来自统计页或清单页查询条件。',
        expect: 'totalCnt 大于 0 时，页面统计应能展示对应数据。',
        abnormal: '如果 SQL 有数据但页面无数据，检查前端状态码或产品编码过滤。',
        tables: ['dwd_order_prod_inst_efficiency'],
        source: 'ProductStatisticsMapper.xml -> commonWhereClause'
      },
      {
        type: 'config',
        title: '检查码表与产品树是否正常加载',
        sql: "SELECT code, code_name FROM map_code WHERE code_type IN ('latn_id','status_cd');\nSELECT prod_code, prod_name FROM edo_product_sort WHERE status_cd = '1';",
        params: '无特殊入参。',
        expect: '码表包含本地网和订单状态，产品树包含一级与三级产品。',
        abnormal: '缺失时需要先修复初始化数据或缓存刷新逻辑。',
        tables: ['map_code', 'edo_product_sort'],
        source: 'DictController.java / ProductClassController.java'
      }
    ]
  }
}

function ask(value: string) {
  question.value = value
  analyze()
}

function analyze() {
  loading.value = true
  window.setTimeout(() => {
    result.value = question.value.includes('云电脑') ? templates.zeroCloudPc : templates.default
    activeSteps.value = result.value.steps.map((_, index) => String(index))
    loading.value = false
  }, 360)
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
  padding: 22px 24px;
  margin-bottom: 14px;
  color: #fff;
  background: #17202c;
  border-radius: 8px;
}

.assistant-head h2 {
  margin: 0;
  font-size: 22px;
}

.assistant-head p {
  margin: 8px 0 0;
  color: #cbd5e1;
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
  border-radius: 50%;
  color: #fff;
  background: #409eff;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
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
