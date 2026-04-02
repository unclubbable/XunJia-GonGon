<template>
  <div class="android-showcase">
    <!-- 页面头部 -->
    <div class="showcase-header">
      <h1>讯家出行 · 安卓端平台展示</h1>
      <p>司机端 · 用户端 完整功能体验</p>
    </div>

    <!-- 登录界面展示 -->
    <div class="login-section">
      <h2>统一登录界面</h2>
      <div class="login-card">
        <img :src="loginImg" alt="登录界面" class="login-img" />
        <p class="img-caption">司机/用户统一登录入口，支持手机号验证码登录</p>
      </div>
    </div>

    <!-- 司机端与用户端并排展示 -->
    <el-row :gutter="24" class="app-row">
      <!-- 司机端 -->
      <el-col :xs="24" :md="12" class="app-col">
        <div class="app-card driver-card">
          <div class="app-header">
            <el-icon><Van /></el-icon>
            <h2>司机端</h2>
          </div>
          <div class="feature-grid">
            <div v-for="item in driverFeatures" :key="item.title" class="feature-item">
              <img :src="item.img" :alt="item.title" class="feature-img" />
              <div class="feature-title">{{ item.title }}</div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 用户端 -->
      <el-col :xs="24" :md="12" class="app-col">
        <div class="app-card passenger-card">
          <div class="app-header">
            <el-icon><User /></el-icon>
            <h2>用户端</h2>
          </div>
          <div class="feature-grid">
            <div v-for="item in passengerFeatures" :key="item.title" class="feature-item">
              <img :src="item.img" :alt="item.title" class="feature-img" />
              <div class="feature-title">{{ item.title }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 视频展示区域（同步播放） -->
    <div class="video-section">
      <h2>完整打车流程视频展示</h2>
      <div class="video-tip">因实际路程过长,视频展示为测试版本(上传轨迹点为事先定义好的经纬度列表)</div>
      <div class="video-row">
        <div class="video-card">
          <video
            ref="driverVideo"
            :src="driverVideoUrl"
            controls
            preload="metadata"
            class="showcase-video"
          ></video>
          <div class="video-caption">司机端打车流程</div>
        </div>
        <div class="video-card">
          <video
            ref="passengerVideo"
            :src="passengerVideoUrl"
            controls
            preload="metadata"
            class="showcase-video"
          ></video>
          <div class="video-caption">用户端打车流程</div>
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
      <div class="video-tip">点击“同步播放”两个视频将同时开始，同时结束</div>
    </div>

    <!-- 联系方式 -->
    <div class="contact-section">
      <h3>获取APK安装包</h3>
      <p>如需下载体验，请联系我们：</p>
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
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Van, User, VideoPlay, VideoPause, RefreshRight, Phone, Message } from '@element-plus/icons-vue'
// 登录图
import loginImg from '@/assets/android/login.jpg'

// 司机端所有截图
import driverHome from '@/assets/android/driver/shouye.jpg'
import driverMap from '@/assets/android/driver/map.jpg'
import driverOrderAll from '@/assets/android/driver/order-quanbu.jpg'
import driverWallet from '@/assets/android/driver/qianbao.jpg'
import driverProfile from '@/assets/android/driver/zhuye.jpg'
import driverProfileInfo from '@/assets/android/driver/zhuye-gerenxinxi.jpg'
import driverCarInfo from '@/assets/android/driver/zhuye-cheliangxinxi.jpg'
import driverSetCity from '@/assets/android/driver/zhuye-shezhiyunyingchengshi.jpg'
import driverAgreement from '@/assets/android/driver/zhuye-xieyi.jpg'

// 用户端所有截图
import passengerHome from '@/assets/android/passenger/shouye.jpg'
import passengerOrder from '@/assets/android/passenger/order.jpg'
import passengerProfile from '@/assets/android/passenger/zhuye.jpg'
import passengerProfileInfo from '@/assets/android/passenger/zhuye-gerenxinxi.jpg'
import passengerFeedback from '@/assets/android/passenger/zhuye-kaifazheyijian.jpg'
import passengerAgreement from '@/assets/android/passenger/zhuye-xieyi.jpg'

// 视频
import driverVideoUrl from '@/assets/android/driver.mp4'
import passengerVideoUrl from '@/assets/android/passenger.mp4'

// 司机端功能列表（用 import 后的变量）
const driverFeatures = ref([
  { title: '首页', img: driverHome },
  { title: '地图实时位置', img: driverMap },
  { title: '订单', img: driverOrderAll },
  { title: '钱包', img: driverWallet },
  { title: '个人主页', img: driverProfile },
  { title: '个人信息', img: driverProfileInfo },
  { title: '车辆信息', img: driverCarInfo },
  { title: '设置运营城市', img: driverSetCity },
  { title: '平台协议', img: driverAgreement }
])

// 用户端功能列表
const passengerFeatures = ref([
  { title: '首页', img: passengerHome },
  { title: '订单', img: passengerOrder },
  { title: '个人主页', img: passengerProfile },
  { title: '个人信息', img: passengerProfileInfo },
  { title: '向开发者提意见', img: passengerFeedback },
  { title: '平台协议', img: passengerAgreement }
])


// 视频元素引用
const driverVideo = ref(null)
const passengerVideo = ref(null)

// 同步播放
const playBothVideos = () => {
  if (driverVideo.value && passengerVideo.value) {
    // 确保两个视频都准备就绪
    const playPromise1 = driverVideo.value.play()
    const playPromise2 = passengerVideo.value.play()
    if (playPromise1 !== undefined) {
      playPromise1.catch(e => console.log('司机端视频播放失败', e))
    }
    if (playPromise2 !== undefined) {
      playPromise2.catch(e => console.log('用户端视频播放失败', e))
    }
  }
}

// 同步暂停
const pauseBothVideos = () => {
  if (driverVideo.value) driverVideo.value.pause()
  if (passengerVideo.value) passengerVideo.value.pause()
}

// 重置视频（暂停并回到开头）
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #f8fafc;
}

/* 头部 */
.showcase-header {
  text-align: center;
  margin-bottom: 40px;
}
.showcase-header h1 {
  font-size: 32px;
  font-weight: 600;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 8px;
}
.showcase-header p {
  font-size: 16px;
  color: #5a6874;
}

/* 登录界面 */
.login-section {
  margin-bottom: 48px;
  text-align: center;
}
.login-section h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #2c3e50;
}
.login-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  display: inline-block;
  width: 100%;
  max-width: 400px;
}
.login-img {
  height: 500px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.img-caption {
  margin-top: 12px;
  font-size: 14px;
  color: #6c757d;
}

/* 左右分栏 */
.app-row {
  margin-bottom: 48px;
}
.app-col {
  margin-bottom: 24px;
}
.app-card {
  background: white;
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
  height: 100%;
}
.app-card:hover {
  transform: translateY(-4px);
}
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}
.app-header .el-icon {
  font-size: 32px;
  color: #1890ff;
}
.app-header h2 {
  font-size: 24px;
  margin: 0;
  color: #1f2f3d;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.feature-item {
  text-align: center;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 12px 8px;
  transition: all 0.2s;
}
.feature-item:hover {
  background: #e9ecef;
  transform: scale(1.02);
}
.feature-img {
  height: 300px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
}
.feature-title {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

/* 视频区域 */
.video-section {
  background: white;
  border-radius: 32px;
  padding: 24px;
  margin-bottom: 48px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}
.video-section h2 {
  font-size: 24px;
  text-align: center;
  margin-bottom: 24px;
  color: #2c3e50;
}
.video-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  margin-bottom: 24px;
  width: 80%;
  margin: 0 auto;
}
.video-card {
  flex: 1;
  min-width: 280px;
  text-align: center;
}
.showcase-video {
  height: 600px;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  background: #000;
}
.video-caption {
  margin-top: 8px;
  font-size: 14px;
  color: #6c757d;
}
.video-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 20px 0 12px;
}
.video-tip {
  text-align: center;
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 联系方式 */
.contact-section {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 32px;
  padding: 32px;
  text-align: center;
  color: white;
}
.contact-section h3 {
  font-size: 24px;
  margin-bottom: 12px;
}
.contact-section p {
  margin-bottom: 20px;
  opacity: 0.9;
}
.contact-info {
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 24px;
  border-radius: 48px;
  backdrop-filter: blur(4px);
}
.contact-item .el-icon {
  font-size: 20px;
}
.contact-item strong {
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .android-showcase {
    padding: 16px;
  }
  .feature-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  .contact-info {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .contact-item {
    width: 100%;
    justify-content: center;
  }
}
</style>