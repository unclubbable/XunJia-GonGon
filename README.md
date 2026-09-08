# 讯家出行 · 网约车全链路平台

> 简历项目 | 微服务 + 三端协同 + AI 工单协查

基于 **Spring Cloud 微服务** 构建的一站式网约车系统，覆盖 **乘客端下单 → 司机端听单履约 → 管理端运营监控与售后闭环** 全业务流程，并接入 **Python LangGraph Agent** 实现工单智能协查与协议 RAG 问答。

**目录导航**：[一 亮点](#一项目亮点) · [二 架构](#二技术架构) · [三 流程](#三核心业务流程) · [四 分库](#四数据与分库设计) · [五 安卓展示](#五安卓端功能展示) · [六 管理端展示](#六web-管理端功能展示) · [七 Agent](#七agent-工作流结构化展示) · [八 技术亮点](#八核心技术亮点详解) · [九 目录](#九工程目录速览) · [十 端口](#十服务端口与模块对照) 

| 端侧 | 工程 | 形态 |
|------|------|------|
| 乘客端 | `前端/passenger-uniapp` | uni-app（Android / H5） |
| 司机端 | `前端/driver-uniapp` | uni-app（Android / H5） |
| 管理端 | `前端/admin-vue3` | Vue3 Web |
| 业务后端 | `后端/XunJiaChuXing` | Spring Cloud 微服务 |
| AI 后端 | `Agent` | FastAPI + LangGraph |
| 数据层 | `sql` | MySQL 按服务分库 |

## 一、项目亮点

1. **三端业务闭环**：乘客叫车、司机听单履约、管理端司机/车辆/订单/财务/工单一体化运营。
2. **可靠异步派单**：RabbitMQ 解耦下单与匹配；高德周边扩环搜车 + Redisson 分布式锁防重复派单。
3. **实时行程体验**：WebSocket 推送订单状态；高德猎鹰轨迹 + **2D/3D 地图** 可视化行程。
4. **支付与一致性**：支付宝沙箱支付/退款；Seata 覆盖收款与支付回调等关键链路。
5. **工单售后中台**：投诉 / 变更类工单 + 退款单（手动凭证 / 支付宝原路退）+ 管理端「通过并执行」。
6. **AI 人机协同**：Java `service-ai` 编排会话，Python Agent 输出案情摘要与处理草稿；**人在环路**，不自动结案/退款。
7. **统一网关按端隔离**：`/passenger-user`、`/driver-user`、`/boss-user` 三端路由与 JWT 身份隔离。
8. **容器化编排**：Docker Compose 一键部署网关与业务服务。

---

## 二、技术架构

### 2.1 整体架构示意

```
乘客端 / 司机端 (uni-app)          管理端 (Vue3)
        │                              │
        ├──── HTTP API ────────────────┤
        │                              ▼
        │                     Spring Cloud Gateway (:7071)
        │                /passenger-user  /driver-user  /boss-user
        │                              │
        │              ┌───────────────┼─────────────────────────────┐
        │              ▼               ▼              ▼              ▼
        │           用户服务        订单服务        地图/计价       工单服务
        │           司机服务        计价等…      Nacos/Sentinel    AI 服务 ──► Python Agent (:18080)
        │              │               │                              │
        │              └──── MySQL 分库 + Redis + RabbitMQ + Seata ───┘
        │
        └──── WebSocket 直连 ──► service-websocket (:9000)
              （不经 Gateway；业务服务经 Feign/HTTP 调 /push 再下发到连接）
```

### 2.2 后端技术栈

| 分层 | 技术选型 |
|------|----------|
| 基础框架 | Spring Boot / Java / Spring Cloud |
| 网关与治理 | Spring Cloud Gateway、Nacos 注册发现、Sentinel 限流熔断、OpenFeign |
| 数据与缓存 | MyBatis-Plus、MySQL（按服务分库）、Redis（Token / 验证码） |
| 消息与事务 | RabbitMQ（派单异步化）、Seata AT、Redisson 分布式锁 |
| 实时通信 | WebSocket（司机 / 乘客行程与消息同步） |
| 支付与地图 | 支付宝 SDK、高德 Web API + 猎鹰轨迹 |
| 其他 | 阿里云 OSS、短信验证、Knife4j、Docker Compose |

### 2.3 前端技术栈

| 端 | 技术选型 |
|----|----------|
| 管理端 | Vue 3 + Vite + Vue Router + Vuex + Element Plus + ECharts + 高德 JS API |
| 乘客 / 司机端 | uni-app（Vue 3）+ Vuex + uni-ui + 高德 JS API（含 2D/3D 视角） |

### 2.4 AI Agent 技术栈

| 分层 | 技术选型 |
|------|----------|
| 服务框架 | FastAPI + Uvicorn + Pydantic v2 |
| 编排引擎 | LangGraph（SQLite Checkpoint）；协查为 Tool Agent，问答为 RAG 流水线 |
| 大模型 | SiliconFlow（OpenAI 兼容）· DeepSeek-V3 |
| 向量检索 | BAAI/bge-m3 Embedding + Qdrant |
| 可观测 | Langfuse |
| 知识源 | 乘客 / 司机平台协议 Markdown |
| 业务 Tool | 订单 / 计价 / 钱包 / 轨迹 / 车辆 / 支付 / 退款 / 协议检索等 11 个只读工具 |

### 2.5 微服务模块一览

| 模块 | 职责 |
|------|------|
| `gateweb` | 统一 API 网关：三端路由、JWT 鉴权、身份隔离 |
| `service-passenger-user` | 乘客登录、资料、Token 刷新、头像 OSS |
| `service-driver-user` | 司机登录、车辆/绑定、出车状态、钱包加减款 |
| `service-boss-user` | 管理端账号登录 |
| `service-order` | 订单全生命周期、异步派单、支付宝支付/退款、Seata |
| `service-map` | 路径规划、行政区、轨迹终端/上报、周边搜司机 |
| `service-price` | 预估价 / 实价、计价规则 CRUD 与版本校验 |
| `service-ticket` | 客服工单、退款登记与执行、AI 协查入口 |
| `service-ai` | AI 会话落库、转发 Python Agent、回写工单 AI 草稿 |
| `service-websocket` | WebSocket 长连接与业务推送（**客户端直连 :9000，不经网关**） |
| `service-api` / `internal-common` | Feign Client、DTO、JWT、Sentinel、OSS、短信等公共能力 |

---

## 三、核心业务流程

### 3.1 下单 → 派单 → 完单

```
乘客选点下单 → 预估价（地图距离 + 计价规则版本）
  → service-order 落库（order_info + order_trip）
  → RabbitMQ travel-topic 异步派单
  → 高德 aroundsearch 扩环（约 2km → 5km）+ 车型匹配
  → Redisson 锁司机，校验无进行中订单后接单
  → WebSocket 通知司机 / 乘客
  → 状态机推进：待接单→接单→去接→到达→行程中→待收款→支付→完成
```

**订单状态（1–9）**：待接单 → 已接单 → 去接乘客 → 到达上车点 → 行程中 → 待收款 → 待支付 → 已完成 / 已取消。

### 3.2 支付与分账

1. 司机发起收款（Seata）：订单进入待支付，推送支付信息  
2. 乘客支付宝 WAP 支付，回调网关  
3. 支付成功回调（Seata）：订单完成、司机加款、WebSocket 通知  

### 3.3 工单与退款闭环

- **乘客**：绕路、多收费、态度、取消纠纷等，可关联订单发起工单  
- **司机**：改运营城市 / 改资料 / 绑车、订单问题、准则与工资咨询等；变更类支持管理端「通过并执行」写回  
- **管理端**：受理 → 回复 → 结案 / 驳回；退款单支持手动凭证或支付宝原路退（幂等查单），并同步订单退款状态、扣减司机收入  

### 3.4 AI 工单协查

```
管理端工单详情「AI 协查」
  → Gateway /boss-user 或 ticket AI 入口
  → service-ai 建/复用会话（agent_conversation）
  → HTTP → Python Agent /v1/ticket/assist
  → LangGraph：load_ticket → agent ⇄ tools（最多 5 轮）→ finalize
  → 只读 Tool：订单/计价/钱包/轨迹/车辆/支付推断/退款/协议 RAG 等
  → 输出摘要、建议动作、回复/结案草稿、退款/执行建议
  → 回写 ticket.ai_summary / ai_suggestion_json
  → 运营人工确认后执行（不自动结案 / 不自动退款）

协议问答（独立链路，暂未改 Tool 化）：
  /v1/ticket/chat → retrieve → answer（Qdrant RAG）
```

> 两条链路的节点、Tool 清单与示意图见 **[七、Agent 工作流结构化展示](#七agent-工作流结构化展示)**（说明文档：`Agent/data/graphs/README.md`）。

---

## 四、数据与分库设计

业务库按微服务拆分（详见 `sql/分离库sql/`，另有 `QuanLiang.sql` 全量脚本）：

| 库 | 核心表 | 说明 |
|----|--------|------|
| `service-order` | `order_info`、`order_trip`、`undo_log` | 订单主数据、行程节点、Seata AT |
| `service-ticket` | `ticket`、`ticket_message`、`order_refund` | 工单、沟通、退款；含 AI 摘要字段 |
| `service-ai` | `agent_conversation` | Agent 会话与 `thread_id` 关联 |
| `service-driver-user` | 司机 / 车辆 / 绑定 / 出车 / 收入 / 车型字典 | 运力与财务基础数据 |
| `service-passenger-user` | `passenger_user` | 乘客账号 |
| `service-price` | `price_rule` | 城市 + 车型计价规则与版本 |
| `service-map` | `dic_district` | 行政区划 |
| `service-user` | `boss_user` | 管理端账号 |
| `seata` / `nacos` | 基础设施元数据 | 分布式事务 / 配置中心 |

---

## 五、安卓端功能展示(加载较慢)

### 5.1 下单 → 完单全流程演示（同步播放）

司机端与乘客端 **同屏同步录制**，左右对照观看全链路：听单 / 下单 → 派单履约 → 行程 → 收款完单。  
动图路径：`assets/android/driver.gif` · `assets/android/passenger.gif`

| 司机端 | 乘客端 |
| :----: | :----: |
| <img src="./assets/android/driver.gif" width="280" alt="司机端同步演示"> | <img src="./assets/android/passenger.gif" width="280" alt="乘客端同步演示"> |
| `assets/android/driver.gif` | `assets/android/passenger.gif` |

### 5.2 登录界面（短信验证码）

<img src="./assets/android/login.jpg" width="150" alt="登录界面">

### 5.3 司机端功能

| 功能模块 | 效果展示 | 功能模块 | 效果展示 | 功能模块 | 效果展示 |
| ---- | :----: | ---- | :----: | ---- | :----: |
| 首页（出车听单） | <img src="./assets/android/driver/shouye.jpg" width="150"> | 实时地图 | <img src="./assets/android/driver/map.jpg" width="150"> | 3D 地图 | <img src="./assets/android/driver/3Dmap.jpg" width="150"> |
| 全部订单 | <img src="./assets/android/driver/order.jpg" width="150"> | 钱包收入 | <img src="./assets/android/driver/qianbao.jpg" width="150"> | 个人主页 | <img src="./assets/android/driver/zhuye.jpg" width="150"> |
| 个人信息 | <img src="./assets/android/driver/zhuye-gerenxinxi.jpg" width="150"> | 绑定车辆 | <img src="./assets/android/driver/zhuye-cheliangxinxi.jpg" width="150"> | 我的工单 | <img src="./assets/android/driver/gondan.jpg" width="150"> |
| 新建工单 | <img src="./assets/android/driver/xinjiangondan.jpg" width="150"> | 意见反馈 | <img src="./assets/android/driver/zhuye-kaifazheyijian.jpg" width="150"> | 平台协议 | <img src="./assets/android/driver/zhuye-xieyi.jpg" width="150"> |

**司机端能力摘要**

- 出车 / 收车、WebSocket 听单与订单状态同步  
- 订单履约按钮链：去接乘客 → 到达起点 → 接到乘客 → 到达目的地 → 发起收款  
- 高德地图定位、导航向展示，支持 **3D 倾斜与建筑物视角**  
- 工单：改城市 / 改资料 / 绑车、订单问题、准则与工资咨询等  

### 5.4 乘客端功能

| 功能模块 | 效果展示 | 功能模块 | 效果展示 | 功能模块 | 效果展示 |
| ---- | :----: | ---- | :----: | ---- | :----: |
| 首页（地图叫车） | <img src="./assets/android/passenger/shouye.jpg" width="150"> | 全部订单 | <img src="./assets/android/passenger/order.jpg" width="150"> | 个人主页 | <img src="./assets/android/passenger/zhuye.jpg" width="150"> |
| 个人信息 | <img src="./assets/android/passenger/zhuye-gerenxinxi.jpg" width="150"> | 支付设置 | <img src="./assets/android/passenger/zhuye-zhifushezhi.jpg" width="150"> | 工单首页 | <img src="./assets/android/passenger/gondanshouye.jpg" width="150"> |
| 选择工单类型 | <img src="./assets/android/passenger/xuanzegondan.jpg" width="150"> | 新建工单 | <img src="./assets/android/passenger/xinjiangondan.jpg" width="150"> | 意见反馈 | <img src="./assets/android/passenger/zhuye-kaifazheyijian.jpg" width="150"> |
| 平台协议 | <img src="./assets/android/passenger/zhuye-xieyi.jpg" width="150"> |  |  |  |  |

**乘客端能力摘要**

- 全屏地图选点、运营城市切换、预估价下单、等待派单  
- 订单详情完整状态机展示，支持取消规则提示与支付  
- 工单：绕路 / 多收费 / 态度 / 取消纠纷等，可关联订单发起售后  

---

## 六、Web 管理端功能展示（加载较慢）

### 6.1 运营看板与运力管理

| 功能模块 | 效果展示 |
| ---- | ---- |
| 管理端首页 | <img src="./assets/GuanLiDuan/shouye.png" width="600" alt="管理端首页"> |
| 司机信息 | <img src="./assets/GuanLiDuan/sijixinxi.png" width="600" alt="司机信息"> |
| 司机工作状态 | <img src="./assets/GuanLiDuan/gonzuozhuangtai.png" width="600" alt="司机工作状态"> |
| 车辆信息 | <img src="./assets/GuanLiDuan/car.png" width="600" alt="车辆信息"> |
| 车辆证件信息 | <img src="./assets/GuanLiDuan/carstatus.png" width="600" alt="车辆证件"> |
| 新增车辆证件 | <img src="./assets/GuanLiDuan/caraddstatus.png" width="600" alt="新增车辆证件"> |
| 车辆类型字典 | <img src="./assets/GuanLiDuan/cartype.png" width="600" alt="车辆类型"> |
| 人车绑定状态 | <img src="./assets/GuanLiDuan/binding.png" width="600" alt="人车绑定"> |

### 6.2 订单监控与轨迹

| 功能模块 | 效果展示 |
| ---- | ---- |
| 订单管理 | <img src="./assets/GuanLiDuan/dingdan.png" width="600" alt="订单管理"> |
| 订单详情 | <img src="./assets/GuanLiDuan/dingdanxaingqing.png" width="600" alt="订单详情"> |
| 订单位置追踪 | <img src="./assets/GuanLiDuan/dingdanweizhi.png" width="600" alt="订单位置追踪"> |
| 订单位置（楼块 3D） | <img src="./assets/GuanLiDuan/dingdanweizhiloukuai.png" width="600" alt="订单位置楼块"> |
| 司机实时位置 | <img src="./assets/GuanLiDuan/sijishishiweizhi.png" width="600" alt="司机实时位置"> |

### 6.3 财务与运价运营

| 功能模块 | 效果展示 |
| ---- | ---- |
| 司机收入明细 | <img src="./assets/GuanLiDuan/sijishouru.png" width="600" alt="司机收入"> |
| 收入发放明细 | <img src="./assets/GuanLiDuan/shourufafang.png" width="600" alt="收入发放"> |
| 平台抽成明细 | <img src="./assets/GuanLiDuan/pingtaichoucheng.png" width="600" alt="平台抽成"> |
| 运营城市管理 | <img src="./assets/GuanLiDuan/yunyingcity.png" width="600" alt="运营城市"> |
| 运价定价管理 | <img src="./assets/GuanLiDuan/yunjia.png" width="600" alt="运价管理"> |
| 新增运价配置 | <img src="./assets/GuanLiDuan/yunjia-addconfig.png" width="600" alt="新增运价配置"> |

### 6.4 工单售后与 AI 协查

| 功能模块 | 效果展示 |
| ---- | ---- |
| 工单列表 | <img src="./assets/GuanLiDuan/gondanlist.png" width="600" alt="工单列表"> |
| AI 正在生成 | <img src="./assets/GuanLiDuan/gondanliebiao-AIzhengzaishengcheng.png" width="600" alt="AI正在生成"> |
| AI 生成完成 | <img src="./assets/GuanLiDuan/gondanliebiao-AIshengchengwanbi.png" width="600" alt="AI生成完成"> |
| AI 协查面板 | <img src="./assets/GuanLiDuan/AIxiecha.png" width="600" alt="AI协查"> |
| 退款工单 | <img src="./assets/GuanLiDuan/tuikuangondan.png" width="600" alt="退款工单"> |
| 退款工单详情 | <img src="./assets/GuanLiDuan/tuikuangondan-xiangqing.png" width="600" alt="退款工单详情"> |

**管理端能力摘要**

- Dashboard 数据看板（ECharts）  
- 司机 / 车辆 / 证件 / 车型 / 人车绑定全链路运力治理  
- 订单列表 + 详情 + **2D/3D 轨迹与楼块视角** 监控  
- 收入、发放、平台抽成财务闭环  
- 工单处理 + 退款执行 + **AI 协查（摘要 / 草稿 / 协议追问）**  

---

## 七、Agent 工作流结构化展示

>  导出拓扑（`python -m scripts.export_graphs`）在运行时把 **tools 收成一个节点**；下列为**业务向详细图**：展开 11 个 Tool，并配 `assets/Agent` 截图。  
> 管理端效果见 [6.4 工单售后与 AI 协查](#64-工单售后与-ai-协查)。

### 7.1 能力总览与链路对比

| | 工单协查 `ticket_assist` | 协议问答 `ticket_chat` |
|--|--------------------------|------------------------|
| 入口 | `POST /v1/ticket/assist` | `POST /v1/ticket/chat` |
| 形态 | **Tool Agent 循环**（LLM 按需调工具） | **固定流水线**（retrieve → answer） |
| 输入重点 | 整张工单 + 工单聊天 | 一句运营提问 |
| 检索 | `retrieve_policy` **按需** | `retrieve` **必跑** |
| 循环上限 | `ASSIST_MAX_TOOL_STEPS`（默认 5） | 无循环 |
| 产出 | 结构化处置建议（摘要 / 草稿 / 退款建议等） | 自然语言答案 + citations（可拒答） |

### 7.2 工单协查链路 `ticket_assist`

**主流程**：`START → load_ticket → agent ⇄ tools（≤5 轮）→ finalize → END`

| 节点 | 类型 | 功能 |
|------|------|------|
| `load_ticket` | 固定节点 | 预填工单与聊天；打业务标记（是否需退款/执行建议）；初始化 LLM 对话 |
| `agent` | LLM 节点 | `bind_tools` 后阅读 messages，决定调哪些 Tool，或结束去 finalize |
| `tools` | 执行节点 | 执行本轮 `tool_calls`（可并行多个），结果写成 ToolMessage 回写；`tool_steps + 1` |
| `finalize` | 收尾节点 | 汇总对话与工具结果，产出结构化 `TicketAssistSuggestion` |
| `route_after_agent` | 条件边 | 有 `tool_calls` 且未超限 → `tools`，否则 → `finalize` |

**业务向详细流程图（Tool 展开）**

```mermaid
flowchart TD
  START([START<br/>Java 传入 ticket + 工单聊天]) --> LOAD

  LOAD["① load_ticket<br/>预填工单信息"]

  LOAD --> AGENT

  AGENT["② agent<br/>LLM + bind_tools<br/>决定：调哪些 Tool"]

  AGENT -->|有 tool_calls<br/>且未超轮次上限| TOOLS_HUB
  AGENT -->|无 tool_calls<br/>或已达 max_steps| FINAL

  TOOLS_HUB["③ tools 节点<br/>执行 tool_calls<br/>ToolMessage 回写"]

  TOOLS_HUB --> T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10 & T11

  T1["get_order"]
  T2["get_price_rule"]
  T3["get_driver_wallet"]
  T4["get_driver_orders"]
  T5["get_trip_track"]
  T6["get_vehicle"]
  T7["list_bindable_cars"]
  T8["check_city_price_support"]
  T9["get_payment"]
  T10["get_refund"]
  T11["retrieve_policy"]

  T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10 & T11 --> BACK
  BACK([工具结果回写 messages]) --> AGENT

  FINAL["④ finalize<br/>结构化协查建议"]

  FINAL --> ENDN([END<br/>返回 Java / 回写工单 AI 草稿])
```

**（流程控制台打印截图）**

<img src="./assets/Agent/liuchengshishikonzhitaidayinjietu-ToolAndNode.png" width="800" alt="Tool与节点流程">

#### Tool 清单（按需调用，不是每单全跑）

| Tool | 典型场景 |
|------|----------|
| `get_order` | 多收费 / 绕路 / 订单争议 |
| `get_price_rule` | 多收费核对计价 |
| `get_driver_wallet` | 工资 / 资金异常 |
| `get_driver_orders` | 对流水、对某月订单 |
| `get_trip_track` | 绕路投诉看轨迹 |
| `get_vehicle` | 换绑 / 看当前车 |
| `list_bindable_cars` | 绑车工单看可绑车 |
| `check_city_price_support` | 改运营城市 |
| `get_payment` | 支付核对（订单字段推断） |
| `get_refund` | 退款单查询 |
| `retrieve_policy` | 协议 / 准则条款（Qdrant RAG） |

#### 工单类型

| 标记 | 触发条件 | Agent 必须讨论 |
|------|----------|----------------|
| `need_refund_advice` | 有关联订单，且类别为绕路/多收费/取消纠纷/未付争议/订单问题/态度/其他等 | `refund_advice`（倾向不退时也要写清理由） |
| `need_execute_advice` | 类别为 `CHANGE_CITY` / `CHANGE_PROFILE` / `BIND_VEHICLE` | `execute_advice`（是否建议「通过并执行」） |

#### finalize 结构化产出（`TicketAssistSuggestion`）

| 字段 | 含义 |
|------|------|
| `summary` | 案情摘要（面向运营，约 200 字内） |
| `risk_notes` | 风险点 / 缺证据提示 |
| `recommended_actions` | 建议动作：`ACCEPT` / `REPLY` / `RESOLVE` / `REJECT` / `REFUND_CREATE` / `APPROVE_EXECUTE` / `NEED_MORE_INFO` |
| `reply_draft` | 可直接发给用户的回复草稿 |
| `resolve_draft` / `reject_draft` | 结案 / 驳回说明草稿 |
| `refund_advice` | 是否建议退、金额提示、还需核实材料、caution（须走 Java 退款） |
| `execute_advice` | 是否建议通过执行、核对清单、caution（须点「通过并执行」） |
| `confidence` | `high` / `medium` / `low`（证据不足倾向 low） |

### 7.3 协议问答链路 `ticket_chat`

**主流程**：`START → retrieve → answer → END`（暂未改成 Tool Agent）

| 节点 | 功能 |
|------|------|
| `retrieve` | 用 question 做向量检索（Qdrant + Embedding）；可按 passenger/driver 过滤；top_k=4，低于阈值丢弃 |
| `answer` | **无 citations → 固定拒答，不调 LLM**；有 citations → 带 history + 片段，LLM 只依据协议回答 |

```mermaid
flowchart TD
  START([START<br/>运营提问 question]) --> RET

  RET["① retrieve<br/>Qdrant + Embedding<br/>可按 audience 过滤<br/>top_k=4，低分丢弃"]

  RET --> ANS

  ANS["② answer<br/>无 citations：拒答<br/>有 citations：LLM 依协议回答"]

  ANS --> ENDN([END<br/>answer + citations + refused])
```

### 7.4 可观测：Langfuse Tracing

协查 / 问答运行链路通过 **Langfuse** 做链路追踪，便于回放节点耗时、Tool 调用与 LLM 输入输出。

| 说明 | 效果展示 |
|------|----------|
| Tracing 总览 | <img src="./assets/Agent/LangFuseTracing.png" width="700" alt="Langfuse Tracing"> |
| Tracing 详情 | <img src="./assets/Agent/LangFuseTracingxiangxi.png" width="700" alt="Langfuse Tracing详情"> |

### 7.5 与 Java 的协作边界

```
管理端 → Gateway → service-ai（会话 thread_id / 拉工单）
                 → HTTP Python Agent (:18080)
                 → 回写 ticket.ai_summary / ai_suggestion_json
运营在管理端人工：受理 / 回复 / 结案 / 退款 /「通过并执行」
```

- Agent **只读**业务数据（订单、计价、轨迹、钱包等）+ 协议 RAG  
- **禁止**自动退款、自动改库、自动结案；真正动作留在 Java / 管理端人在环路  
- `finalize` 后处理会裁剪不合规动作（如无退款场景去掉 `REFUND_CREATE`，非变更类去掉 `APPROVE_EXECUTE`）  

---

## 八、核心技术亮点详解

### 8.1 订单可靠投递与智能派单

- RabbitMQ 手动确认；异常订单进入失败队列，支持有限次重试  
- 异步消费后调用高德周边搜索：半径约 **2000m → 3500m → 5000m** 扩环匹配可用司机与车型  
- 单轮未命中则间隔约 **20s** 再试，最多约 **5** 轮；仍失败则订单置无效并通知乘客，避免长时间悬挂  

### 8.2 并发安全控制

- Redisson 分布式锁锁定司机资源，防止多实例下重复派单  
- 接单前校验司机是否已有进行中订单，保证同一时段单一履约  

### 8.3 实时交互与地图体验

- 乘客/司机 App **直连** `service-websocket:9000`（如 `ws://host:9000/connect/{userId}/{identity}`），**不经过 Gateway**；`gateweb` 中亦无 WS 路由  
- 订单/派单等业务服务通过 Feign 调 WebSocket 服务的 HTTP `/push`，再由该服务写入对应长连接  
- 支持心跳保活；前端失败时可轮询兜底  
- 高德猎鹰轨迹上报与回放；移动端与管理端支持 **2D/3D** 切换、倾斜角与建筑物展示  

### 8.4 统一网关按端隔离

- 司机端、乘客端、管理端共用 Gateway  
- 分别以 `/driver-user`、`/passenger-user`、`/boss-user` 根路径隔离  
- JWT 校验并结合 Redis Token；司机 / 乘客路径做身份匹配，模块解耦便于独立扩展  

### 8.5 分布式事务与高可用

- Seata 全局事务保障「发起收款 / 支付回调」等跨服务数据一致性  

<img src="./assets/seata.png" width="700" alt="Seata">

- Sentinel 限流熔断，保障接口在高并发下的稳定性  

<img src="./assets/sentinel.png" width="700" alt="Sentinel">

### 8.6 计价规则版本防脏下单

- 预估价返回 `fareType` / `fareVersion`  
- 下单时校验规则是否仍为最新版本，避免运价变更导致价差纠纷  

### 8.7 工单 AI 人机协同

- Java `service-ai` 负责会话持久化与编排；Python Agent 为 **LangGraph Tool Agent（协查）+ RAG 流水线（问答）**  
- 协查侧最多 5 轮工具循环，11 个只读 Tool 按需调用；问答侧无引用即拒答  
- 明确边界：**辅助决策，不自动结案、不自动退款、不自动改库**（详见第七章）  

### 8.8 容器化部署

- Docker + Docker Compose 编排网关与各业务服务，便于环境一致与快速交付  

---

## 九、工程目录速览

```
讯家出行项目/
├── 前端/
│   ├── admin-vue3/          # Web 管理端（Vue3 + Element Plus）
│   ├── passenger-uniapp/    # 乘客端（uni-app）
│   └── driver-uniapp/       # 司机端（uni-app）
├── 后端/
│   ├── XunJiaChuXing/       # Java 微服务父工程
│   ├── docker-compose.yml
│   └── Dockerfile
├── Agent/                   # Python AI 工单 Agent（FastAPI + LangGraph）
│   └── data/graphs/         # 工作流说明与导出拓扑
├── sql/                     # 分库脚本 + 全量脚本
└── assets/                  # README 演示截图 / 动图（含 Agent/）
```

---

## 十、服务端口与模块对照

| 服务 | 端口 | 主要职责 |
|------|------|----------|
| `gateweb` | 7071 | 统一网关入口 |
| `service-passenger-user` | 8083 | 乘客账号 |
| `service-price` | 8084 | 计价 / 预估 |
| `service-map` | 8085 | 地图 / 轨迹 / 周边搜 |
| `service-driver-user` | 8086 | 司机 / 车辆 / 钱包 |
| `service-order` | 8087 | 订单 / 派单 / 支付 |
| `service-boss-user` | 8089 | 管理端登录 |
| `service-websocket` | 9000 | 实时推送（默认直连，不经网关） |
| `service-ticket` | 8091 | 工单 / 退款 |
| `service-ai` | 8092 | AI 编排与会话 |
| Python Agent | 18080 | LangGraph 协查 / RAG |

**中间件依赖（本地/联调常见）**：Nacos、MySQL、Redis、RabbitMQ、Seata；Agent 另需 Embedding/LLM 密钥、Qdrant、Langfuse（按 `Agent` 配置）。

---

