import { createRouter, createWebHashHistory } from 'vue-router'
import StatisticsView from './views/StatisticsView.vue'
import ProductListView from './views/ProductListView.vue'
import TroubleshootView from './views/TroubleshootView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/statistics' },
    { path: '/statistics', name: 'statistics', component: StatisticsView },
    { path: '/list', name: 'list', component: ProductListView },
    { path: '/troubleshoot', name: 'troubleshoot', component: TroubleshootView }
  ]
})

export default router
