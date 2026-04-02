import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('../views/login/index.vue'),
      name: 'login',
    },

    {
      path: '/',
      component: ()=> import('../layout/index.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',            // 首页 
          component: () => import('../views/dashboard/index.vue')
        },
        {
          path: 'driver/list',        // 司机信息列表
          component: () => import('../views/driver/list.vue')
        },
        {
          path: 'driver/work-status',   // 司机工作状态
          component: () => import('../views/driver/work-status.vue')
        },
        {
          path: 'car/list',             // 车辆信息列表
          component: () => import('../views/car/list.vue')
        },
        {
          path: 'car/certificate',        // 车辆证件信息
          component: () => import('../views/car/certificate.vue')
        },
        {
          path: 'binding',             // 绑定车辆
          component: () => import('../views/binding/index.vue')
        },
        {
          path: 'order/list',             // 订单列表
          component: () => import('../views/order/list.vue')
        },
        {
          path: 'order/track',             // 订单地图轨迹
          component: () => import('../views/order/track.vue')
        },
        {
          path: 'finance/income',             // 司机收入统计
          component: () => import('../views/finance/income.vue')
        },
        {
          path: 'finance/payment',             // 收入发放管理
          component: () => import('../views/finance/payment.vue')
        },
        {
          path: 'finance/commission',             // 平台抽成统计
          component: () => import('../views/finance/commission.vue')
        },
        {
          path: 'monitor/map',             // 司机地图监控
          component: () => import('../views/monitor/map.vue')
        },
        {
          path: 'monitor/online',             // 司机在线监控
          component: () => import('../views/monitor/online.vue')
        },
        {
          path: 'monitor/city',             // 运营城市统计
          component: () => import('../views/monitor/city.vue')
        },
        {
          path: 'monitor/fare',             // 运费规则
          component: () => import('../views/monitor/fare.vue')
        },
        {
          path: 'android',             // 安卓端展示
          component: () => import('../views/android/index.vue')
        }
        
      ]
    },
  ],
})

import { ElMessage } from 'element-plus'
import NProgress from 'nprogress' // 进度条
import 'nprogress/nprogress.css' // 进度条样式
import { getToken,removeToken } from '../utils/auth' // 从localStorage中获取token

NProgress.configure({ showSpinner: false }) // N进度配置
const whiteList = ['/login'] // 无重定向白名单

router.beforeEach(async(to, from, next) => {
  // 开始进度条
  NProgress.start()

  // 设置页面标题
  document.title = '讯家出行'

  // 确定用户是否已登录
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // 如果已登录，则重定向至主页
      next({ path: '/' })
      NProgress.done()
    } else {
      next()
      NProgress.done()
    }
  } else {
    // 未登录：如果在白名单中，直接放行；否则重定向到登录页
    if (whiteList.includes(to.path)) {
      next()
     } else {
      next('/login')
    }
    NProgress.done()
  }
})

router.afterEach(() => {
  // 完成进度条
  NProgress.done()
})
export default router
