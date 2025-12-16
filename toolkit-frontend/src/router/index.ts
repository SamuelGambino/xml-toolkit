import { createRouter, createWebHistory } from 'vue-router'
import BaseLayoutView from '../views/BaseLayoutView/BaseLayoutView.vue'
import IntroView from '@/views/IntroView/IntroView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: BaseLayoutView,
      children: [
        {
          path: '',
          name: 'intro',
          component: IntroView,
        },
        {
          path: 'convert',
          name: 'convert',
          component: import('../views/ConvertView/ConvertView.vue')
        },
        {
          path: 'xml-editor',
          name: 'xml-editor',
          component: import('../views/EditorView/EditorView.vue')
        },
        {
          path: 'merge-xmls',
          name: 'merge-xmls',
          component: import('../views/MergerView/MergerView.vue')
        },
        {
          path: 'export-imgs',
          name: 'export-imgs',
          component: import('../views/ExporterView/ExporterView.vue')
        },
      ]
    },
  ],
})

export default router
