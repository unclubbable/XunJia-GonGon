<template>
  <div class="android-showcase">
    <header class="showcase-header">
      <div class="header-badge">Android Showcase</div>
      <h1>讯家出行 · 安卓端展示</h1>
      <p>按 `driver-uniapp` / `passenger-uniapp` 的 pages 目录分层展示，点击截图可放大预览</p>
    </header>

    <!-- 目录总览：快速跳转 -->
    <section class="toc-block">
      <div class="toc-head">
        <h2>功能目录总览</h2>
        <p>对应工程页面结构，点击可跳转到对应模块</p>
      </div>
      <div class="toc-grid">
        <div class="toc-card">
          <div class="toc-card__title">
            <el-icon><Van /></el-icon>
            <span>司机端 driver-uniapp</span>
          </div>
          <ul class="toc-tree">
            <li>
              <button type="button" @click="scrollTo('auth')">pages/auth/login</button>
              <span>统一登录</span>
            </li>
            <li v-for="mod in driverModules" :key="mod.key">
              <button type="button" @click="scrollTo(`driver-${mod.key}`)">{{ mod.path }}</button>
              <span>{{ mod.label }} · {{ mod.shots.length }} 图</span>
              <ul v-if="mod.children?.length" class="toc-tree toc-tree--child">
                <li v-for="child in mod.children" :key="child.path">
                  <code>{{ child.path }}</code>
                  <span>{{ child.label }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div class="toc-card toc-card--passenger">
          <div class="toc-card__title">
            <el-icon><User /></el-icon>
            <span>乘客端 passenger-uniapp</span>
          </div>
          <ul class="toc-tree">
            <li>
              <button type="button" @click="scrollTo('auth')">pages/auth/login</button>
              <span>统一登录</span>
            </li>
            <li v-for="mod in passengerModules" :key="mod.key">
              <button type="button" @click="scrollTo(`passenger-${mod.key}`)">{{ mod.path }}</button>
              <span>{{ mod.label }} · {{ mod.shots.length }} 图</span>
              <ul v-if="mod.children?.length" class="toc-tree toc-tree--child">
                <li v-for="child in mod.children" :key="child.path">
                  <code>{{ child.path }}</code>
                  <span>{{ child.label }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 统一登录 -->
    <section id="auth" class="module-block login-block">
      <div class="module-head">
        <div class="module-tag">Auth</div>
        <div>
          <h2>统一登录</h2>
          <p class="module-desc">pages/auth/login · 司机端 / 乘客端共用登录入口</p>
        </div>
      </div>
      <div class="login-stage">
        <button type="button" class="phone-frame" @click="openPreview(loginImg)">
          <img :src="loginImg" alt="登录界面" />
        </button>
        <div class="login-copy">
          <h3>手机号验证码登录</h3>
          <ul>
            <li>司机端与乘客端共用同一套认证页</li>
            <li>登录成功后分别进入各自业务主页</li>
            <li>支持调试服务端地址配置</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 双端分层展示 -->
    <el-row :gutter="24" class="app-row">
      <el-col :xs="24" :lg="12">
        <section class="app-panel driver-panel">
          <div class="app-panel__head">
            <div class="app-panel__title">
              <el-icon><Van /></el-icon>
              <div>
                <h2>司机端</h2>
                <p>driver-uniapp/src/pages</p>
              </div>
            </div>
            <el-tag type="primary" effect="plain">{{ countShots(driverModules) }} 张截图</el-tag>
          </div>

          <article
            v-for="mod in driverModules"
            :id="`driver-${mod.key}`"
            :key="mod.key"
            class="path-module"
          >
            <div class="path-module__head">
              <div class="path-module__meta">
                <span class="path-badge">{{ mod.label }}</span>
                <code>{{ mod.path }}</code>
              </div>
              <p>{{ mod.desc }}</p>
            </div>

            <div v-if="mod.children?.length" class="child-paths">
              <div v-for="child in mod.children" :key="child.path" class="child-path">
                <code>{{ child.path }}</code>
                <span>{{ child.label }}</span>
              </div>
            </div>

            <div class="shot-grid" :class="{ 'shot-grid--wide': mod.shots.length <= 2 }">
              <button
                v-for="shot in mod.shots"
                :key="shot.title"
                type="button"
                class="shot-card"
                @click="openPreview(shot.img)"
              >
                <div class="shot-card__frame">
                  <img :src="shot.img" :alt="shot.title" loading="lazy" />
                </div>
                <div class="shot-card__body">
                  <strong>{{ shot.title }}</strong>
                  <span class="shot-path">{{ shot.page }}</span>
                  <span class="shot-file">{{ shot.file }}</span>
                </div>
              </button>
            </div>
          </article>
        </section>
      </el-col>

      <el-col :xs="24" :lg="12">
        <section class="app-panel passenger-panel">
          <div class="app-panel__head">
            <div class="app-panel__title">
              <el-icon><User /></el-icon>
              <div>
                <h2>乘客端</h2>
                <p>passenger-uniapp/src/pages</p>
              </div>
            </div>
            <el-tag type="success" effect="plain">{{ countShots(passengerModules) }} 张截图</el-tag>
          </div>

          <article
            v-for="mod in passengerModules"
            :id="`passenger-${mod.key}`"
            :key="mod.key"
            class="path-module"
          >
            <div class="path-module__head">
              <div class="path-module__meta">
                <span class="path-badge path-badge--passenger">{{ mod.label }}</span>
                <code>{{ mod.path }}</code>
              </div>
              <p>{{ mod.desc }}</p>
            </div>

            <div v-if="mod.children?.length" class="child-paths">
              <div v-for="child in mod.children" :key="child.path" class="child-path">
                <code>{{ child.path }}</code>
                <span>{{ child.label }}</span>
              </div>
            </div>

            <div class="shot-grid" :class="{ 'shot-grid--wide': mod.shots.length <= 2 }">
              <button
                v-for="shot in mod.shots"
                :key="shot.title"
                type="button"
                class="shot-card"
                @click="openPreview(shot.img)"
              >
                <div class="shot-card__frame">
                  <img :src="shot.img" :alt="shot.title" loading="lazy" />
                </div>
                <div class="shot-card__body">
                  <strong>{{ shot.title }}</strong>
                  <span class="shot-path">{{ shot.page }}</span>
                  <span class="shot-file">{{ shot.file }}</span>
                </div>
              </button>
            </div>
          </article>
        </section>
      </el-col>
    </el-row>

    <!-- 视频 -->
    <section class="video-section">
      <div class="module-head">
        <div class="module-tag">Demo</div>
        <div>
          <h2>完整打车流程视频</h2>
          <p class="module-desc">司机端 / 乘客端同步演示（测试轨迹点为预置经纬度）</p>
        </div>
      </div>
      <div class="video-tip">因实际路程过长，视频展示为测试版本</div>
      <div class="video-row">
        <div class="video-card">
          <video
            ref="driverVideo"
            :src="driverVideoUrl"
            controls
            preload="metadata"
            class="showcase-video"
          />
          <div class="video-caption">司机端打车流程</div>
        </div>
        <div class="video-card">
          <video
            ref="passengerVideo"
            :src="passengerVideoUrl"
            controls
            preload="metadata"
            class="showcase-video"
          />
          <div class="video-caption">乘客端打车流程</div>
        </div>
      </div>
      <div class="video-controls">
        <el-button type="primary" round @click="playBothVideos">
          <el-icon><VideoPlay /></el-icon> 同步播放
        </el-button>
        <el-button type="info" round @click="pauseBothVideos">
          <el-icon><VideoPause /></el-icon> 同步暂停
        </el-button>
        <el-button type="warning" round @click="resetBothVideos">
          <el-icon><RefreshRight /></el-icon> 重置视频
        </el-button>
      </div>
    </section>

    <section class="contact-section">
      <h3>获取 APK 安装包</h3>
      <p>如需下载体验，请联系我们</p>
      <div class="contact-info">
        <div class="contact-item">
          <el-icon><Phone /></el-icon>
          <span>电话：<strong>15069840419</strong></span>
        </div>
        <div class="contact-item">
          <el-icon><Message /></el-icon>
          <span>邮箱：<strong>2473579923@qq.com</strong></span>
        </div>
      </div>
    </section>

    <el-image-viewer
      v-if="preview.visible"
      :url-list="preview.list"
      :initial-index="preview.index"
      teleported
      @close="preview.visible = false"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElImageViewer } from 'element-plus'
import { Van, User, VideoPlay, VideoPause, RefreshRight, Phone, Message } from '@element-plus/icons-vue'

import loginImg from '@/assets/android/login.jpg'

import driverHome from '@/assets/android/driver/shouye.jpg'
import driverMap from '@/assets/android/driver/map.jpg'
import driverMap3d from '@/assets/android/driver/3Dmap.jpg'
import driverOrder from '@/assets/android/driver/order.jpg'
import driverWallet from '@/assets/android/driver/qianbao.jpg'
import driverProfile from '@/assets/android/driver/zhuye.jpg'
import driverProfileInfo from '@/assets/android/driver/zhuye-gerenxinxi.jpg'
import driverCarInfo from '@/assets/android/driver/zhuye-cheliangxinxi.jpg'
import driverOpinion from '@/assets/android/driver/zhuye-kaifazheyijian.jpg'
import driverAgreement from '@/assets/android/driver/zhuye-xieyi.jpg'
import driverTicket from '@/assets/android/driver/gondan.jpg'
import driverTicketCreate from '@/assets/android/driver/xinjiangondan.jpg'

import passengerHome from '@/assets/android/passenger/shouye.jpg'
import passengerOrder from '@/assets/android/passenger/order.jpg'
import passengerTicketHome from '@/assets/android/passenger/gondanshouye.jpg'
import passengerTicketCreate from '@/assets/android/passenger/xinjiangondan.jpg'
import passengerTicketSelect from '@/assets/android/passenger/xuanzegondan.jpg'
import passengerProfile from '@/assets/android/passenger/zhuye.jpg'
import passengerProfileInfo from '@/assets/android/passenger/zhuye-gerenxinxi.jpg'
import passengerPayment from '@/assets/android/passenger/zhuye-zhifushezhi.jpg'
import passengerFeedback from '@/assets/android/passenger/zhuye-kaifazheyijian.jpg'
import passengerAgreement from '@/assets/android/passenger/zhuye-xieyi.jpg'

import driverVideoUrl from '@/assets/android/driver.mp4'
import passengerVideoUrl from '@/assets/android/passenger.mp4'

// 司机端 pages
const driverModules = [
  {
    key: 'home',
    label: '首页',
    path: 'pages/home',
    desc: '司机工作台，查看接单状态与快捷入口',
    shots: [
      { title: '首页', page: 'pages/home/index', file: 'shouye.jpg', img: driverHome }
    ]
  },
  {
    key: 'map',
    label: '地图',
    path: 'pages/map',
    desc: '实时定位与 3D 地图视角',
    children: [
      { path: 'pages/map/index', label: '地图主界面' }
    ],
    shots: [
      { title: '实时位置', page: 'pages/map/index', file: 'map.jpg', img: driverMap },
      { title: '3D 地图', page: 'pages/map/index · 3D', file: '3Dmap.jpg', img: driverMap3d }
    ]
  },
  {
    key: 'order',
    label: '订单',
    path: 'pages/order',
    desc: '订单列表与行程状态',
    children: [
      { path: 'pages/order/list', label: '订单列表' },
      { path: 'pages/order/detail', label: '订单详情' }
    ],
    shots: [
      { title: '订单列表', page: 'pages/order/list', file: 'order.jpg', img: driverOrder }
    ]
  },
  {
    key: 'finance',
    label: '钱包',
    path: 'pages/finance',
    desc: '司机收入与资金明细',
    children: [
      { path: 'pages/finance/money', label: '钱包明细' }
    ],
    shots: [
      { title: '钱包', page: 'pages/finance/money', file: 'qianbao.jpg', img: driverWallet }
    ]
  },
  {
    key: 'ticket',
    label: '工单',
    path: 'pages/ticket',
    desc: '售后 / 反馈工单',
    children: [
      { path: 'pages/ticket/list', label: '我的工单' },
      { path: 'pages/ticket/create', label: '提交工单' },
      { path: 'pages/ticket/detail', label: '工单详情' }
    ],
    shots: [
      { title: '我的工单', page: 'pages/ticket/list', file: 'gondan.jpg', img: driverTicket },
      { title: '新建工单', page: 'pages/ticket/create', file: 'xinjiangondan.jpg', img: driverTicketCreate }
    ]
  },
  {
    key: 'profile',
    label: '个人中心',
    path: 'pages/profile',
    desc: '资料、车辆、意见与协议',
    children: [
      { path: 'pages/profile/index', label: '个人主页' },
      { path: 'pages/profile/info', label: '个人信息' },
      { path: 'pages/profile/opinion', label: '向开发者提意见' },
      { path: 'pages/profile/terms', label: '平台协议' }
    ],
    shots: [
      { title: '个人主页', page: 'pages/profile/index', file: 'zhuye.jpg', img: driverProfile },
      { title: '个人信息', page: 'pages/profile/info', file: 'zhuye-gerenxinxi.jpg', img: driverProfileInfo },
      { title: '车辆信息', page: 'pages/profile · 车辆', file: 'zhuye-cheliangxinxi.jpg', img: driverCarInfo },
      { title: '向开发者提意见', page: 'pages/profile/opinion', file: 'zhuye-kaifazheyijian.jpg', img: driverOpinion },
      { title: '平台协议', page: 'pages/profile/terms', file: 'zhuye-xieyi.jpg', img: driverAgreement }
    ]
  }
]

// 乘客端 pages
const passengerModules = [
  {
    key: 'home',
    label: '首页',
    path: 'pages/home',
    desc: '地图选点与发起行程',
    children: [
      { path: 'pages/home/index', label: '首页地图' },
      { path: 'pages/home/city', label: '城市选择' }
    ],
    shots: [
      { title: '首页', page: 'pages/home/index', file: 'shouye.jpg', img: passengerHome }
    ]
  },
  {
    key: 'order',
    label: '订单',
    path: 'pages/order',
    desc: '创建单、行程与支付',
    children: [
      { path: 'pages/order/list', label: '订单列表' },
      { path: 'pages/order/create', label: '确认行程' },
      { path: 'pages/order/detail', label: '订单详情' },
      { path: 'pages/order/pay', label: '支付' }
    ],
    shots: [
      { title: '订单列表', page: 'pages/order/list', file: 'order.jpg', img: passengerOrder }
    ]
  },
  {
    key: 'ticket',
    label: '工单',
    path: 'pages/ticket',
    desc: '工单首页、选择类型与新建',
    children: [
      { path: 'pages/ticket/list', label: '工单首页' },
      { path: 'pages/ticket/create', label: '新建工单' },
      { path: 'pages/ticket/detail', label: '工单详情' }
    ],
    shots: [
      { title: '工单首页', page: 'pages/ticket/list', file: 'gondanshouye.jpg', img: passengerTicketHome },
      { title: '选择工单', page: 'pages/ticket/create · 选择', file: 'xuanzegondan.jpg', img: passengerTicketSelect },
      { title: '新建工单', page: 'pages/ticket/create', file: 'xinjiangondan.jpg', img: passengerTicketCreate }
    ]
  },
  {
    key: 'profile',
    label: '个人中心',
    path: 'pages/profile',
    desc: '资料、支付设置、意见与协议',
    children: [
      { path: 'pages/profile/index', label: '个人主页' },
      { path: 'pages/profile/info', label: '个人信息' },
      { path: 'pages/profile/payment', label: '支付设置' },
      { path: 'pages/profile/opinion', label: '向开发者提意见' },
      { path: 'pages/profile/terms', label: '平台协议' }
    ],
    shots: [
      { title: '个人主页', page: 'pages/profile/index', file: 'zhuye.jpg', img: passengerProfile },
      { title: '个人信息', page: 'pages/profile/info', file: 'zhuye-gerenxinxi.jpg', img: passengerProfileInfo },
      { title: '支付设置', page: 'pages/profile/payment', file: 'zhuye-zhifushezhi.jpg', img: passengerPayment },
      { title: '向开发者提意见', page: 'pages/profile/opinion', file: 'zhuye-kaifazheyijian.jpg', img: passengerFeedback },
      { title: '平台协议', page: 'pages/profile/terms', file: 'zhuye-xieyi.jpg', img: passengerAgreement }
    ]
  }
]

const countShots = (modules) => modules.reduce((sum, m) => sum + m.shots.length, 0)

const allPreviewUrls = [
  loginImg,
  ...driverModules.flatMap((m) => m.shots.map((s) => s.img)),
  ...passengerModules.flatMap((m) => m.shots.map((s) => s.img))
]

const preview = reactive({
  visible: false,
  list: allPreviewUrls,
  index: 0
})

const openPreview = (url) => {
  const idx = allPreviewUrls.indexOf(url)
  preview.index = idx >= 0 ? idx : 0
  preview.visible = true
}

const scrollTo = (id) => {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const driverVideo = ref(null)
const passengerVideo = ref(null)

const playBothVideos = () => {
  if (!driverVideo.value || !passengerVideo.value) return
  const p1 = driverVideo.value.play()
  const p2 = passengerVideo.value.play()
  if (p1?.catch) p1.catch((e) => console.log('司机端视频播放失败', e))
  if (p2?.catch) p2.catch((e) => console.log('乘客端视频播放失败', e))
}

const pauseBothVideos = () => {
  driverVideo.value?.pause()
  passengerVideo.value?.pause()
}

const resetBothVideos = () => {
  if (driverVideo.value) {
    driverVideo.value.pause()
    driverVideo.value.currentTime = 0
  }
  if (passengerVideo.value) {
    passengerVideo.value.pause()
    passengerVideo.value.currentTime = 0
  }
}
</script>

<style scoped>
.android-showcase {
  --ink: #1a2b3c;
  --muted: #5f7388;
  --line: #e6edf5;
  --panel: #ffffff;
  --bg: #f3f6fa;
  --driver: #1f6feb;
  --passenger: #0f9f6e;
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px 24px 48px;
  background:
    radial-gradient(1200px 420px at 12% -10%, rgba(31, 111, 235, 0.12), transparent 60%),
    radial-gradient(900px 360px at 88% 0%, rgba(15, 159, 110, 0.1), transparent 55%),
    var(--bg);
  min-height: 100%;
  scroll-behavior: smooth;
}

.showcase-header {
  text-align: center;
  margin-bottom: 28px;
}
.header-badge {
  display: inline-flex;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(31, 111, 235, 0.1);
  color: var(--driver);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}
.showcase-header h1 {
  margin: 0 0 10px;
  font-size: 34px;
  font-weight: 750;
  color: var(--ink);
}
.showcase-header p {
  margin: 0 auto;
  max-width: 680px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.6;
}

.toc-block,
.module-block,
.app-panel,
.video-section {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: 0 10px 28px rgba(20, 40, 70, 0.06);
}

.toc-block {
  padding: 22px 24px;
  margin-bottom: 24px;
}
.toc-head h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: var(--ink);
}
.toc-head p {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 13px;
}
.toc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.toc-card {
  border: 1px solid #dfe8f4;
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f7faff 0%, #fff 100%);
}
.toc-card--passenger {
  border-color: #d9eee4;
  background: linear-gradient(180deg, #f5fbf8 0%, #fff 100%);
}
.toc-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 10px;
}
.toc-card__title .el-icon { color: var(--driver); }
.toc-card--passenger .toc-card__title .el-icon { color: var(--passenger); }

.toc-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc-tree > li {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 8px;
  align-items: start;
  padding: 7px 0;
  border-top: 1px dashed #e5ecf4;
  font-size: 12px;
}
.toc-tree > li:first-child { border-top: 0; }
.toc-tree button {
  border: 0;
  background: transparent;
  color: var(--driver);
  text-align: left;
  padding: 0;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
.toc-card--passenger .toc-tree button { color: var(--passenger); }
.toc-tree button:hover { text-decoration: underline; }
.toc-tree > li > span {
  color: var(--muted);
  text-align: right;
}
.toc-tree--child {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding-left: 12px;
  border-left: 2px solid #e4ebf4;
}
.toc-tree--child li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
  border: 0;
  color: #7a8b9c;
}
.toc-tree--child code {
  font-size: 11px;
  color: #66788a;
}

.module-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}
.module-tag {
  flex: none;
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef4ff;
  color: var(--driver);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.module-head h2,
.app-panel__title h2 {
  margin: 0 0 4px;
  font-size: 22px;
  color: var(--ink);
}
.module-desc {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.login-block {
  padding: 24px;
  margin-bottom: 24px;
  scroll-margin-top: 16px;
}
.login-stage {
  display: grid;
  grid-template-columns: minmax(220px, 280px) 1fr;
  gap: 28px;
  align-items: center;
}
.phone-frame {
  border: 0;
  background: #0f1720;
  border-radius: 28px;
  padding: 12px;
  cursor: zoom-in;
  box-shadow: 0 16px 36px rgba(15, 23, 32, 0.28);
}
.phone-frame img {
  display: block;
  width: 100%;
  border-radius: 18px;
  background: #111;
}
.login-copy h3 {
  margin: 0 0 12px;
  font-size: 20px;
  color: var(--ink);
}
.login-copy ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.9;
}

.app-row { margin-bottom: 8px; }
.app-panel {
  padding: 22px;
  margin-bottom: 24px;
  height: calc(100% - 24px);
}
.app-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.app-panel__title {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.app-panel__title .el-icon {
  font-size: 28px;
  margin-top: 2px;
}
.driver-panel .app-panel__title .el-icon { color: var(--driver); }
.passenger-panel .app-panel__title .el-icon { color: var(--passenger); }
.app-panel__title p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.path-module {
  margin-bottom: 22px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #f7f9fc 100%);
  border: 1px solid #e8eef6;
  scroll-margin-top: 18px;
}
.passenger-panel .path-module {
  background: linear-gradient(180deg, #f5fbf8 0%, #f7f9fc 100%);
  border-color: #e4f2ea;
}
.path-module__head { margin-bottom: 12px; }
.path-module__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.path-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(31, 111, 235, 0.12);
  color: var(--driver);
  font-size: 12px;
  font-weight: 700;
}
.path-badge--passenger {
  background: rgba(15, 159, 110, 0.12);
  color: var(--passenger);
}
.path-module__meta code {
  font-size: 12px;
  color: #6b7c8f;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 3px 8px;
}
.path-module__head p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.child-paths {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.child-path {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--line);
  font-size: 12px;
}
.child-path code {
  color: #5b6f84;
  font-size: 11px;
}
.child-path span { color: var(--muted); }

.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 12px;
}
.shot-grid--wide {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
.shot-card {
  border: 0;
  background: #fff;
  border-radius: 16px;
  padding: 10px;
  text-align: left;
  cursor: zoom-in;
  box-shadow: 0 4px 14px rgba(20, 40, 70, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.shot-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(20, 40, 70, 0.1);
}
.shot-card__frame {
  border-radius: 12px;
  overflow: hidden;
  background: #0f1720;
  aspect-ratio: 9 / 19.5;
}
.shot-card__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.shot-card__body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.shot-card__body strong {
  font-size: 13px;
  color: var(--ink);
}
.shot-path {
  font-size: 11px;
  color: #5f7ea0;
  word-break: break-all;
}
.shot-file {
  font-size: 11px;
  color: #8a9aab;
  word-break: break-all;
}

.video-section {
  padding: 24px;
  margin-bottom: 24px;
}
.video-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin: 8px auto 18px;
  max-width: 980px;
}
.video-card { text-align: center; }
.showcase-video {
  width: 100%;
  max-height: 620px;
  border-radius: 18px;
  background: #000;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}
.video-caption {
  margin-top: 8px;
  font-size: 14px;
  color: var(--muted);
}
.video-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.video-tip {
  text-align: center;
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 12px;
}

.contact-section {
  background: linear-gradient(135deg, #163a66 0%, #1f6feb 100%);
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  color: #fff;
}
.contact-section h3 {
  margin: 0 0 8px;
  font-size: 24px;
}
.contact-section p {
  margin: 0 0 20px;
  opacity: 0.9;
}
.contact-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.14);
  padding: 12px 20px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

@media (max-width: 900px) {
  .toc-grid,
  .login-stage,
  .video-row {
    grid-template-columns: 1fr;
  }
  .login-copy { width: 100%; }
  .toc-tree > li {
    grid-template-columns: 1fr;
  }
  .toc-tree > li > span { text-align: left; }
}

@media (max-width: 640px) {
  .android-showcase { padding: 16px 12px 32px; }
  .showcase-header h1 { font-size: 26px; }
  .shot-grid,
  .shot-grid--wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .contact-item {
    width: 100%;
    justify-content: center;
  }
}
</style>
