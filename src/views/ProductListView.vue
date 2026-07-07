<template>
  <div>
    <div class="filter-panel">
      <el-breadcrumb separator="/" style="margin-bottom: 14px">
        <el-breadcrumb-item :to="{ path: '/statistics' }">产品效能分析</el-breadcrumb-item>
        <el-breadcrumb-item>订单清单</el-breadcrumb-item>
      </el-breadcrumb>

      <el-form :model="filters" label-width="78px">
        <el-row :gutter="14">
          <el-col :span="4">
            <el-form-item label="本地网">
              <el-select v-model="filters.latnId" clearable>
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
            <el-form-item label="产品名称">
              <el-input v-model="filters.productName" clearable placeholder="从图表钻取时回显" />
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
          <el-col :span="6">
            <el-form-item label="状态分组">
              <el-select v-model="filters.statusGroup" clearable>
                <el-option label="全部" value="" />
                <el-option label="在途" value="handling" />
                <el-option label="竣工" value="completed" />
                <el-option label="异常" value="exception" />
                <el-option label="撤单" value="canceled" />
                <el-option label="删单" value="deleted" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="14">
          <el-col :span="6">
            <el-form-item label="开始时间">
              <el-date-picker v-model="filters.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="结束时间">
              <el-date-picker v-model="filters.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="趋势点">
              <el-input v-model="filters.trendTime" clearable placeholder="如 08:00 / 08-12" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label-width="0">
              <el-button type="primary" :icon="Search" @click="() => { page = 1; fetchList(); }">查询</el-button>
              <el-button :icon="Refresh" @click="reset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="section-panel">
      <div class="section-title">
        <span>订单明细列表</span>
        <span class="muted">共 {{ totalRows }} 条，当前显示 {{ pageRows.length }} 条</span>
      </div>
      <el-table :data="pageRows" border stripe height="560" :row-class-name="rowClassName">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="custOrderId" label="订单号" min-width="150" />
        <el-table-column prop="acceptDate" label="订购时间" min-width="160" />
        <el-table-column prop="accNbr" label="产品号码" min-width="150">
          <template #default="{ row }">{{ row.accNbr || '--' }}</template>
        </el-table-column>
        <el-table-column prop="serviceOfferName" label="受理场景" min-width="120">
          <template #default="{ row }">{{ row.serviceOfferName || '--' }}</template>
        </el-table-column>
        <el-table-column prop="prodName" label="产品名称" min-width="180" />
        <el-table-column prop="latnName" label="本地网" width="100" />
        <el-table-column prop="channelType" label="渠道类型" width="110">
          <template #default="{ row }">{{ row.channelType || '--' }}</template>
        </el-table-column>
        <el-table-column prop="orderStateName" label="订单状态" width="110" />
        <el-table-column prop="linkThreeName" label="当前环节" min-width="140">
          <template #default="{ row }">{{ row.linkThreeName || '--' }}</template>
        </el-table-column>
        <el-table-column prop="statement" label="环节描述" min-width="160">
          <template #default="{ row }">{{ row.statement || '--' }}</template>
        </el-table-column>
        <el-table-column prop="finishTime" label="完成时间" min-width="160">
          <template #default="{ row }">{{ row.finishTime || '--' }}</template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalRows"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductSelector from '@/components/ProductSelector.vue'
import type { ListFilters } from '@/types'
import { getRangeFromTimeType } from '@/utils/date'
import { buildProductOptions, demoAnchor, latnOptions, statusOptions } from '@/utils/statistics'
import { Refresh, Search } from '@element-plus/icons-vue'
import { reactive, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { productEfficiencyApi } from '@/api'
import type { ProductOrderRecordPayload } from '@/api/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const productOptions = buildProductOptions()
const range = getRangeFromTimeType('THIS_MONTH', demoAnchor)
const filters = reactive<ListFilters>({
  latnId: '888',
  productCodes: [],
  productName: '',
  orderState: '',
  linkState: '',
  statusGroup: '',
  startTime: range.startTime,
  endTime: range.endTime,
  trendTime: ''
})

const page = ref(1)
const pageSize = ref(10)
const highlightProduct = ref('')
const totalRows = ref(0)
const pageRows = ref<ProductOrderRecordPayload[]>([])

async function fetchList() {
  try {
    const res = await productEfficiencyApi.productList({
      ...filters,
      pageNum: page.value,
      pageSize: pageSize.value as 10 | 20 | 50 | 100
    })
    pageRows.value = res.records
    totalRows.value = res.total
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
  }
}

function hydrateFromQuery() {
  const query = route.query
  filters.latnId = String(query.latnId || '888')
  filters.productCodes = String(query.productCodes || '')
    .split(',')
    .filter(Boolean)
  filters.productName = String(query.productName || '')
  filters.orderState = String(query.orderState || '')
  filters.statusGroup = (String(query.statusGroup || '') as ListFilters['statusGroup']) || ''
  filters.startTime = String(query.startTime || range.startTime)
  filters.endTime = String(query.endTime || range.endTime)
  filters.trendTime = String(query.trendTime || '')
  highlightProduct.value = filters.productName
  page.value = 1
  fetchList()
}

function reset() {
  filters.latnId = '888'
  filters.productCodes = []
  filters.productName = ''
  filters.orderState = ''
  filters.linkState = ''
  filters.statusGroup = ''
  filters.startTime = range.startTime
  filters.endTime = range.endTime
  filters.trendTime = ''
  page.value = 1
  fetchList()
}



function rowClassName({ row }: { row: { prodName: string } }) {
  return highlightProduct.value && row.prodName === highlightProduct.value ? 'highlight-row' : ''
}

watch(() => route.query, hydrateFromQuery, { immediate: true })
</script>

<style scoped>
.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

:deep(.highlight-row td) {
  background: #fff8e6 !important;
}
</style>
