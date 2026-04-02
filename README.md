# 讯家出行打车平台（三端微服务架构）
基于微服务架构实现的一站式在线打车系统，包含**安卓司机端**、**安卓用户端**、**Web管理端**，覆盖订单匹配、实时定位、支付结算、运营管理全流程业务。

## 一、技术栈说明
### 后端技术
- 核心框架：Spring Boot、Spring Cloud、Spring Gateway、OpenFeign
- 数据层：Mybatis-Plus、MySQL、Redis（Token存储）
- 消息队列：RabbitMQ（订单匹配、短信推送、异常订单重试）
- 通信组件：RestTemplate、WebSocket（司机/用户实时消息同步）
- 分布式方案：Redisson 分布式锁（防并发重复派单）

### 前端技术
- 管理端（Web）：Vue2、Element-Plus、ECharts、高德 JS API 2.0
- 移动端（Android）：uni-app、Vuex、uni-ui、高德 JS API 2.0

### 第三方服务
- 地图服务：高德猎鹰轨迹、高德周边搜索API
- 存储服务：阿里云OSS
- 支付服务：支付宝在线支付
- 其他：短信验证服务

---

## 二、安卓端功能展示
### 1. 下单->完单全流程展示
司机端 + 用户端同步录制演示视频（建议同时播放观感更高）

<img src="assets/android/driver.gif" width="300" alt="司机端演示"><img src="assets/android/passenger.gif" width="300" alt="用户端演示">


### 2. 登录界面（短信验证码）
<img src="./assets/android/login.jpg" width="150" alt="登录界面">

### 3. 司机端功能
| 功能模块 | 效果展示 | 功能模块 | 效果展示 | 功能模块 | 效果展示 |
| ---- | :----: | ---- | :----: | ---- | :----: |
| 首页 | <img src="./assets/android/driver/shouye.jpg" width="150"> | 实时地图 | <img src="./assets/android/driver/map.jpg" width="150"> | 订单状态 | <img src="./assets/android/driver/order-quanbu.jpg" width="150"> |
| 钱包功能 | <img src="./assets/android/driver/qianbao.jpg" width="150"> | 个人主页 | <img src="./assets/android/driver/zhuye.jpg" width="150"> | 个人信息 | <img src="./assets/android/driver/zhuye-gerenxinxi.jpg" width="150"> |
| 绑定车辆 | <img src="./assets/android/driver/zhuye-cheliangxinxi.jpg" width="150"> | 运营城市 | <img src="./assets/android/driver/zhuye-shezhiyunyingchengshi.jpg" width="150"> | 意见反馈 | <img src="./assets/android/driver/zhuye-kaifazheyijian.jpg" width="150"> |
| 平台协议 | <img src="./assets/android/driver/zhuye-xieyi.jpg" width="150"> |  |  |  |  |

### 4. 用户端功能
| 功能模块 | 效果展示 | 功能模块 | 效果展示 | 功能模块 | 效果展示 |
| ---- | :----: | ---- | :----: | ---- | :----: |
| 首页 | <img src="./assets/android/passenger/shouye.jpg" width="150"> | 全部订单 | <img src="./assets/android/passenger/order.jpg" width="150"> | 个人主页 | <img src="./assets/android/passenger/zhuye.jpg" width="150"> |
| 个人信息 | <img src="./assets/android/passenger/zhuye-gerenxinxi.jpg" width="150"> | 意见反馈 | <img src="./assets/android/passenger/zhuye-kaifazheyijian.jpg" width="150"> | 平台协议 | <img src="./assets/android/passenger/zhuye-xieyi.jpg" width="150"> |

---

## 三、Web管理端功能展示
| 功能模块 | 效果展示 |
| ---- | ---- |
| 管理端首页 | <img src="./assets/GuanLiDuan/shouye.png" width="600" alt="管理端首页"> |
| 司机信息 | <img src="./assets/GuanLiDuan/sijixinxi.png" width="600" alt="司机信息"> |
| 司机工作状态 | <img src="./assets/GuanLiDuan/gonzuozhuangtai.png" width="600" alt="司机工作状态"> |
| 车辆信息 | <img src="./assets/GuanLiDuan/car.png" width="600" alt="车辆信息"> |
| 车辆证件信息 | <img src="./assets/GuanLiDuan/carstatus.png" width="600" alt="车辆证件"> |
| 人车绑定状态 | <img src="./assets/GuanLiDuan/binding.png" width="600" alt="人车绑定"> |
| 订单管理 | <img src="./assets/GuanLiDuan/dingdan.png" width="600" alt="订单管理"> |
| 订单位置追踪 | <img src="./assets/GuanLiDuan/dingdanweizhi.png" width="600" alt="订单位置追踪"> |
| 司机收入明细 | <img src="./assets/GuanLiDuan/sijishouru.png" width="600" alt="司机收入"> |
| 收入发放明细 | <img src="./assets/GuanLiDuan/shourufafang.png" width="600" alt="收入发放"> |
| 平台抽成明细 | <img src="./assets/GuanLiDuan/pingtaichoucheng.png" width="600" alt="平台抽成"> |
| 司机实时位置 | <img src="./assets/GuanLiDuan/sijishishiweizhi.png" width="600" alt="司机实时位置"> |
| 运营城市管理 | <img src="./assets/GuanLiDuan/yunyingcity.png" width="600" alt="运营城市"> |
| 运价定价管理 | <img src="./assets/GuanLiDuan/yunjia.png" width="600" alt="运价管理"> |

---

## 四、核心业务亮点
1. **订单可靠投递**
   - RabbitMQ 手动确认机制，异常订单进入失败队列
   - 每20秒调用高德周边搜索API完成智能派单
   
2. **并发安全控制**
   - Redisson 分布式锁解决分布式环境下重复派单问题
   - 保证同一司机同一时间仅可承接一个订单
   
3. **实时交互体验**
   - WebSocket 同步司机/用户行程与消息
   - 高德绘制行驶轨迹，地图实时刷新
   
4. **微服务多网关架构**
   - 司机端、用户端、管理端独立网关隔离
   
   - 模块解耦，支持独立扩展与迭代
   
     
