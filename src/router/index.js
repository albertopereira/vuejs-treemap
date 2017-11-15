import Vue from 'vue'
import Router from 'vue-router'
import Treemap from '@/components/Treemap'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Treemap',
      component: Treemap
    }
  ]
})
