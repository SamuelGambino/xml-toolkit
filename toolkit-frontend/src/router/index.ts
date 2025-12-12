import { createRouter, createWebHistory } from 'vue-router'
import BaseLayoutView from '../views/BaseLayoutView/BaseLayoutView.vue'
import ProfileView from '../views/ProfileView/ProfileView.vue'

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
          component: ProfileView,
          props: true
        },
        // {
        //   path: 'nomenclature',
        //   name: 'Номенклатура',
        //   component: import('../views/NomenclatureView/NomenclatureView.vue')
        // },
        // {
        //   path: 'order-status',
        //   name: 'Статус заказа',
        //   component: import('../views/OrderStatusView/OrderStatusView.vue')
        // }
      ]
    },
  ],
})

export default router
