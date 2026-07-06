<template>
  <el-popover placement="bottom-start" :width="560" trigger="click">
    <div class="product-select">
      <div class="first-column">
        <button
          v-for="group in options"
          :key="group.code"
          class="product-group"
          :class="{ active: group.code === activeCode }"
          type="button"
          @click="activeCode = group.code"
        >
          <span>{{ group.name }}</span>
          <small>{{ group.children.length }}</small>
        </button>
      </div>
      <div class="product-list">
        <div class="product-actions">
          <el-button size="small" @click="checkActive(true)">全选</el-button>
          <el-button size="small" @click="checkActive(false)">清空</el-button>
        </div>
        <el-checkbox-group v-model="innerValue">
          <el-checkbox v-for="item in activeProducts" :key="item.code" :label="item.code">
            {{ item.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
    <template #reference>
      <el-input :model-value="displayText" placeholder="请选择产品" readonly clearable @clear="innerValue = []">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import type { ProductOption } from '@/types'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string[]
  options: ProductOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const activeCode = ref(props.options[0]?.code ?? '')
const innerValue = ref<string[]>([...props.modelValue])

const activeProducts = computed(() => props.options.find((item) => item.code === activeCode.value)?.children ?? [])
const productNameByCode = computed(() => new Map(props.options.flatMap((group) => group.children.map((child) => [child.code, child.name] as const))))
const displayText = computed(() => {
  const selected = innerValue.value.map((code) => productNameByCode.value.get(code)).filter(Boolean)
  if (!selected.length) return ''
  if (selected.length <= 3) return selected.join('、')
  return `${selected.slice(0, 2).join('、')} 等 ${selected.length} 个产品`
})

function checkActive(checked: boolean) {
  const activeCodes = activeProducts.value.map((item) => item.code)
  innerValue.value = checked ? Array.from(new Set([...innerValue.value, ...activeCodes])) : innerValue.value.filter((code) => !activeCodes.includes(code))
}

watch(
  () => props.modelValue,
  (value) => {
    innerValue.value = [...value]
  }
)

watch(innerValue, (value) => emit('update:modelValue', value))
</script>

<style scoped>
.product-select {
  display: grid;
  grid-template-columns: 150px 1fr;
  height: 330px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.first-column {
  overflow: auto;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
}

.product-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 38px;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid #edf2f7;
  background: transparent;
  color: #303133;
  cursor: pointer;
  text-align: left;
}

.product-group.active {
  background: #e8f4ff;
  color: #1a73e8;
  font-weight: 600;
}

.product-group small {
  color: #8492a6;
}

.product-list {
  overflow: auto;
  padding: 10px 14px;
}

.product-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.product-list :deep(.el-checkbox) {
  display: flex;
  height: auto;
  min-height: 30px;
  margin-right: 0;
  white-space: normal;
}
</style>
