-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 8.140.211.132    Database: service-ticket
-- ------------------------------------------------------
-- Server version	8.0.27

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `order_refund`
--

DROP TABLE IF EXISTS `order_refund`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_refund` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '退款单ID',
  `refund_no` varchar(32) NOT NULL COMMENT '退款单号',
  `ticket_id` bigint NOT NULL COMMENT '来源工单',
  `order_id` bigint NOT NULL COMMENT '原订单ID',
  `pay_order_id` varchar(64) DEFAULT NULL COMMENT '原支付单号',
  `passenger_id` bigint DEFAULT NULL COMMENT '乘客ID',
  `passenger_phone` varchar(16) DEFAULT NULL COMMENT '乘客手机号',
  `driver_id` bigint DEFAULT NULL COMMENT '司机ID',
  `order_price` decimal(10,2) DEFAULT NULL COMMENT '订单金额快照',
  `refund_amount` decimal(10,2) NOT NULL COMMENT '退款金额',
  `reason_code` varchar(32) DEFAULT NULL COMMENT '原因编码',
  `reason_text` varchar(512) DEFAULT NULL COMMENT '原因说明',
  `status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED/REFUNDING/REFUNDED/FAILED',
  `refund_channel` varchar(16) DEFAULT NULL COMMENT 'MANUAL/ALIPAY',
  `voucher_no` varchar(64) DEFAULT NULL COMMENT '手动退款凭证号',
  `operator_id` int DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(32) DEFAULT NULL COMMENT '操作人名称',
  `alipay_refund_no` varchar(64) DEFAULT NULL COMMENT '支付宝退款流水(二期)',
  `driver_settled` tinyint NOT NULL DEFAULT '0' COMMENT '是否已回退司机收入 0否1是',
  `refunded_at` datetime DEFAULT NULL COMMENT '实际退款成功时间',
  `remark` varchar(512) DEFAULT NULL COMMENT '备注',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_ticket_id` (`ticket_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status_ctime` (`status`,`gmt_create`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单退款单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_refund`
--

LOCK TABLES `order_refund` WRITE;
/*!40000 ALTER TABLE `order_refund` DISABLE KEYS */;
INSERT INTO `order_refund` VALUES (1,'R2026082600000001',6,412,NULL,3,'17806211690',1,3.34,2.00,'ORDER_ISSUE','乘客要退款','REFUNDED','MANUAL','12312312',1,'运营',NULL,1,'2026-08-26 16:53:33','老旧版本退费','2026-08-26 16:07:46','2026-08-26 16:53:34'),(2,'R2026082600000002',16,413,NULL,3,'17806211690',1,1.00,1.00,'DETOUR',NULL,'REJECTED',NULL,NULL,1,'运营',NULL,0,NULL,'驳回：不像给','2026-08-26 17:04:01','2026-08-26 17:04:49'),(3,'R2026082600000003',16,413,NULL,3,'17806211690',1,1.00,1.00,'DETOUR','必须给','REFUNDED','MANUAL','12332423',1,'运营',NULL,1,'2026-08-26 17:08:11','给了','2026-08-26 17:05:03','2026-08-26 17:08:11'),(4,'R2026082600000004',17,422,'2026032422001457290508820680',3,'17806211690',1,3.00,1.00,'DETOUR',NULL,'REFUNDED','ALIPAY',NULL,1,'运营','2026032422001457290508820680',1,'2026-08-26 17:11:46',NULL,'2026-08-26 17:11:31','2026-08-26 17:11:46'),(5,'R2026082600000005',17,422,'2026032422001457290508820680',3,'17806211690',1,3.00,1.00,'DETOUR',NULL,'REFUNDED','ALIPAY',NULL,1,'运营','2026032422001457290508820680',1,'2026-08-26 17:19:27','1','2026-08-26 17:15:50','2026-08-26 17:19:27'),(6,'R2026082600000006',17,422,'2026032422001457290508820680',3,'17806211690',1,3.00,1.00,'DETOUR',NULL,'REFUNDED','ALIPAY',NULL,1,'运营','2026032422001457290508820680',1,'2026-08-26 17:20:27','12','2026-08-26 17:20:18','2026-08-26 17:20:27'),(7,'R2026082600000007',17,422,'2026032422001457290508820680',3,'17806211690',1,3.00,1.00,'DETOUR',NULL,'REFUNDED','ALIPAY',NULL,1,'运营','2026032422001457290508820680',1,'2026-08-26 17:23:55','22','2026-08-26 17:23:28','2026-08-26 17:23:56');
/*!40000 ALTER TABLE `order_refund` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `ticket_no` varchar(32) NOT NULL COMMENT '对外工单号',
  `source` tinyint NOT NULL COMMENT '来源：1乘客 2司机',
  `category` varchar(32) NOT NULL COMMENT '工单类型',
  `title` varchar(128) NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '描述',
  `status` varchar(32) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN/IN_PROGRESS/PENDING_USER/RESOLVED/REJECTED/CANCELLED',
  `priority` tinyint NOT NULL DEFAULT '2' COMMENT '1低 2中 3高',
  `order_id` bigint DEFAULT NULL COMMENT '关联订单ID',
  `passenger_id` bigint DEFAULT NULL COMMENT '乘客ID',
  `passenger_phone` varchar(16) DEFAULT NULL COMMENT '乘客手机号',
  `driver_id` bigint DEFAULT NULL COMMENT '司机ID',
  `driver_phone` varchar(16) DEFAULT NULL COMMENT '司机手机号',
  `request_payload` json DEFAULT NULL COMMENT '结构化申请（改城市/改资料等）',
  `assignee_id` int DEFAULT NULL COMMENT '处理人(boss_user.id)',
  `assignee_name` varchar(32) DEFAULT NULL COMMENT '处理人名称',
  `result_summary` varchar(512) DEFAULT NULL COMMENT '结案说明',
  `reject_reason` varchar(512) DEFAULT NULL COMMENT '驳回原因',
  `refund_id` bigint DEFAULT NULL COMMENT '关联退款单ID',
  `ai_summary` varchar(1024) DEFAULT NULL COMMENT 'Agent摘要预留',
  `ai_suggestion_json` json DEFAULT NULL COMMENT 'Agent建议预留',
  `version` int NOT NULL DEFAULT '0' COMMENT '乐观锁版本',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_no` (`ticket_no`),
  KEY `idx_source_status_ctime` (`source`,`status`,`gmt_create`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_passenger` (`passenger_id`,`gmt_create`),
  KEY `idx_driver` (`driver_id`,`gmt_create`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单主表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
INSERT INTO `ticket` VALUES (5,'T2026082500000005',1,'ATTITUDE','态度投诉','订单413司机态度较差，请记录。','RESOLVED',1,413,3,'17806211690',1,'15069840419',NULL,1,'admin','已沟通提醒司机，工单完结。',NULL,NULL,NULL,NULL,0,'2026-08-25 15:37:15','2026-08-25 15:37:15'),(6,'T2026082500000006',2,'ORDER_ISSUE','订单问题反馈','订单412乘客对费用有异议，请平台协助说明。','RESOLVED',2,412,3,'17806211690',1,'15069840419',NULL,1,'admin','已处理完成',NULL,1,NULL,NULL,3,'2026-08-25 15:37:15','2026-08-26 16:08:08'),(7,'T2026082500000007',2,'CHANGE_CITY','申请修改运营城市','希望将运营城市改为济南。','RESOLVED',2,NULL,NULL,NULL,1,'15069840419','{\"targetAddress\": \"370100\"}',1,'admin','已处理完成',NULL,NULL,NULL,NULL,1,'2026-08-25 15:37:15','2026-08-26 14:21:00'),(8,'T2026082500000008',2,'SALARY_QA','工资组成咨询','想了解平台抽成和收入明细怎么算。','OPEN',1,NULL,NULL,NULL,1,'15069840419',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-08-25 15:37:15','2026-08-25 15:37:15'),(10,'T2026082600000010',2,'CHANGE_CITY','申请修改运营城市','给我换位置','RESOLVED',2,NULL,NULL,NULL,1,'15069840419','{\"targetAddress\": \"371100\"}',1,'admin','申请已通过并执行',NULL,NULL,NULL,NULL,3,'2026-08-26 14:42:58','2026-08-26 14:44:13'),(11,'T2026082600000011',2,'CHANGE_PROFILE','申请修改个人信息','我重生了','REJECTED',2,NULL,NULL,NULL,1,'15069840419','{\"driverBirthday\": \"2000-1-1\"}',1,'admin',NULL,'不可以！！',NULL,NULL,NULL,3,'2026-08-26 14:45:26','2026-08-26 14:51:07'),(12,'T2026082600000012',2,'CHANGE_CITY','申请修改运营城市','给我改','RESOLVED',2,NULL,NULL,NULL,1,'15069840419','{\"targetAddress\": \"370100\"}',1,'admin','申请已通过并执行',NULL,NULL,NULL,NULL,2,'2026-08-26 14:51:59','2026-08-26 14:52:12'),(13,'T2026082600000013',2,'CHANGE_PROFILE','申请修改个人信息','我又重生了','RESOLVED',2,NULL,NULL,NULL,1,'15069840419','{\"driverBirthday\": \"2000-01-14\"}',1,'admin','申请已通过并执行',NULL,NULL,NULL,NULL,2,'2026-08-26 14:52:44','2026-08-26 14:52:52'),(14,'T2026082600000014',2,'BIND_VEHICLE','绑定/换绑车辆','我要换车','RESOLVED',2,NULL,NULL,NULL,1,'15069840419','{\"vehicleNo\": \"鲁A83fe\", \"targetCarId\": 2, \"vehicleType\": \"1\"}',1,'admin','申请已通过并执行',NULL,NULL,NULL,NULL,2,'2026-08-26 14:54:53','2026-08-26 14:55:03'),(15,'T2026082600000015',1,'DETOUR','绕路投诉','我要投诉','REJECTED',2,421,3,'17806211690',NULL,NULL,NULL,1,'admin',NULL,'gun',NULL,'乘客投诉绕路问题，但未提供相关证据。当前工单状态为已驳回，驳回原因为\'gun\'。','{\"summary\": \"乘客投诉绕路问题，但未提供相关证据。当前工单状态为已驳回，驳回原因为\'gun\'。\", \"confidence\": \"low\", \"risk_notes\": [\"缺订单轨迹\", \"缺绕路凭证\"], \"reply_draft\": \"尊敬的乘客，您好！关于您投诉的绕路问题，我们需要进一步核实相关信息。请您提供订单轨迹和绕路凭证，以便我们更好地处理您的投诉。感谢您的配合！\", \"reject_draft\": \"\", \"refund_advice\": {\"reason\": \"证据不足，无法确认绕路事实\", \"caution\": \"须运营确认后走 Java 退款登记/执行，Agent 不得退款。\", \"amount_hint\": \"待核对后填写\", \"suggest_refund\": false, \"evidence_needed\": [\"订单轨迹\", \"绕路凭证\"]}, \"resolve_draft\": \"\", \"execute_advice\": {\"reason\": \"非司机可执行变更类工单，不评估通过并执行\", \"caution\": \"仅 CHANGE_CITY / CHANGE_PROFILE / BIND_VEHICLE 可执行\", \"checklist\": [], \"suggest_approve\": false}, \"recommended_actions\": [\"NEED_MORE_INFO\"]}',6,'2026-08-26 16:59:13','2026-09-05 10:55:01'),(16,'T2026082600000016',1,'DETOUR','绕路投诉','这个付钱了','RESOLVED',2,413,3,'17806211690',NULL,NULL,NULL,1,'admin','。',NULL,3,'乘客投诉绕路问题，订单号 413，工单状态为已解决。退款单 R2026082600000003 已手动确认退款 ¥1.00，凭证 12332423。','{\"summary\": \"乘客投诉绕路问题，订单号 413，工单状态为已解决。退款单 R2026082600000003 已手动确认退款 ¥1.00，凭证 12332423。\", \"confidence\": \"high\", \"risk_notes\": [], \"reply_draft\": \"尊敬的乘客，您的退款申请已处理完成，退款金额 ¥1.00 已确认退款，凭证号为 12332423。感谢您对讯家出行的支持。\", \"reject_draft\": \"\", \"refund_advice\": {\"reason\": \"退款单 R2026082600000003 已手动确认退款 ¥1.00，凭证 12332423\", \"caution\": \"须运营确认后走 Java 退款登记/执行，Agent 不得退款。\", \"amount_hint\": \"¥1.00\", \"suggest_refund\": true, \"evidence_needed\": []}, \"resolve_draft\": \"工单已解决，退款已处理完成。\", \"execute_advice\": {\"reason\": \"非司机可执行变更类工单，不评估通过并执行\", \"caution\": \"仅 CHANGE_CITY / CHANGE_PROFILE / BIND_VEHICLE 可执行\", \"checklist\": [], \"suggest_approve\": false}, \"recommended_actions\": [\"RESOLVE\"]}',6,'2026-08-26 17:03:05','2026-09-04 17:14:52'),(17,'T2026082600000017',1,'DETOUR','绕路投诉','.。。','RESOLVED',2,422,3,'17806211690',NULL,NULL,NULL,1,'admin','尊敬的乘客，您好！关于您的绕路投诉，我们已经多次为您处理退款，且退款均已成功到账。如您还有其他问题，欢迎随时联系我们。感谢您的理解与支持！',NULL,7,'乘客投诉绕路问题，已多次处理退款且退款均已成功到账。工单状态为已解决。','{\"summary\": \"乘客投诉绕路问题，已多次处理退款且退款均已成功到账。工单状态为已解决。\", \"confidence\": \"high\", \"risk_notes\": [], \"reply_draft\": \"\", \"reject_draft\": \"\", \"refund_advice\": {\"reason\": \"已多次处理退款且退款均已成功到账\", \"caution\": \"须运营确认后走 Java 退款登记/执行，Agent 不得退款。\", \"amount_hint\": \"待核对后填写\", \"suggest_refund\": false, \"evidence_needed\": []}, \"resolve_draft\": \"尊敬的乘客，您好！关于您的绕路投诉，我们已经多次为您处理退款，且退款均已成功到账。如您还有其他问题，欢迎随时联系我们。感谢您的理解与支持！\", \"execute_advice\": {\"reason\": \"非司机可执行变更类工单，不评估通过并执行\", \"caution\": \"仅 CHANGE_CITY / CHANGE_PROFILE / BIND_VEHICLE 可执行\", \"checklist\": [], \"suggest_approve\": false}, \"recommended_actions\": [\"RESOLVE\"]}',14,'2026-08-26 17:11:06','2026-09-05 20:36:27');
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_message`
--

DROP TABLE IF EXISTS `ticket_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_message` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `ticket_id` bigint NOT NULL COMMENT '工单ID',
  `sender_type` tinyint NOT NULL COMMENT '1乘客 2司机 3运营 4系统',
  `sender_id` bigint DEFAULT NULL COMMENT '发送者ID',
  `sender_name` varchar(32) DEFAULT NULL COMMENT '发送者名称',
  `content` text NOT NULL COMMENT '内容',
  `msg_type` tinyint NOT NULL DEFAULT '1' COMMENT '1文本 2系统事件',
  `content_source` varchar(16) DEFAULT 'HUMAN' COMMENT 'HUMAN/AI_ASSISTED 预留',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ticket_id` (`ticket_id`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单沟通记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_message`
--

LOCK TABLES `ticket_message` WRITE;
/*!40000 ALTER TABLE `ticket_message` DISABLE KEYS */;
INSERT INTO `ticket_message` VALUES (5,5,4,NULL,'系统','工单已创建，等待受理。单号：T2026082500000005',2,'HUMAN','2026-08-25 15:37:15'),(6,6,4,NULL,'系统','工单已创建，等待受理。单号：T2026082500000006',2,'HUMAN','2026-08-25 15:37:15'),(7,7,4,NULL,'系统','工单已创建，等待受理。单号：T2026082500000007',2,'HUMAN','2026-08-25 15:37:15'),(8,8,4,NULL,'系统','工单已创建，等待受理。单号：T2026082500000008',2,'HUMAN','2026-08-25 15:37:15'),(17,7,3,1,'admin','已受理，正在核查订单与轨迹。',1,'HUMAN','2026-08-25 15:37:15'),(20,5,3,1,'admin','已沟通提醒司机，工单完结。',1,'HUMAN','2026-08-25 15:37:15'),(21,7,3,1,'admin','哈哈',1,'HUMAN','2026-08-26 14:20:38'),(22,7,4,NULL,'系统','工单已解决：已处理完成',2,'HUMAN','2026-08-26 14:21:00'),(23,10,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000010',2,'HUMAN','2026-08-26 14:42:58'),(24,10,4,NULL,'系统','工单已由 admin 受理',2,'HUMAN','2026-08-26 14:43:27'),(25,10,3,1,'admin','不换',1,'HUMAN','2026-08-26 14:43:33'),(26,10,2,NULL,'15069840419','球球你换一下吧',1,'HUMAN','2026-08-26 14:43:58'),(27,10,3,1,'admin','好',1,'HUMAN','2026-08-26 14:44:07'),(28,10,4,NULL,'系统','申请已通过并执行：申请已通过并执行',2,'HUMAN','2026-08-26 14:44:13'),(29,11,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000011',2,'HUMAN','2026-08-26 14:45:26'),(30,11,4,NULL,'系统','工单已由 admin 受理',2,'HUMAN','2026-08-26 14:45:36'),(31,11,4,NULL,'系统','工单已驳回：不可以！！',2,'HUMAN','2026-08-26 14:51:07'),(32,12,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000012',2,'HUMAN','2026-08-26 14:51:59'),(33,12,4,NULL,'系统','申请已通过并执行：申请已通过并执行',2,'HUMAN','2026-08-26 14:52:12'),(34,13,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000013',2,'HUMAN','2026-08-26 14:52:44'),(35,13,4,NULL,'系统','申请已通过并执行：申请已通过并执行',2,'HUMAN','2026-08-26 14:52:52'),(36,14,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000014',2,'HUMAN','2026-08-26 14:54:53'),(37,14,4,NULL,'系统','申请已通过并执行：申请已通过并执行',2,'HUMAN','2026-08-26 14:55:03'),(38,6,4,NULL,'系统','已创建退款单 R2026082600000001，金额 ¥2.00，状态 APPROVED',2,'HUMAN','2026-08-26 16:07:46'),(39,6,4,NULL,'系统','工单已由 admin 受理',2,'HUMAN','2026-08-26 16:08:01'),(40,6,4,NULL,'系统','工单已解决：已处理完成',2,'HUMAN','2026-08-26 16:08:08'),(41,6,4,NULL,'系统','退款单 R2026082600000001 已手动确认退款 ¥2.00，凭证 12312312',2,'HUMAN','2026-08-26 16:53:34'),(42,15,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000015',2,'HUMAN','2026-08-26 16:59:13'),(43,15,4,NULL,'系统','工单已由 admin 受理',2,'HUMAN','2026-08-26 16:59:26'),(44,15,3,1,'admin','666，你都这样说了，那给了，要多少钱',1,'HUMAN','2026-08-26 16:59:57'),(45,15,1,NULL,'17806211690','我必须狮子大开口，1块吧',1,'HUMAN','2026-08-26 17:00:48'),(46,15,3,1,'admin','666，给你了',1,'HUMAN','2026-08-26 17:01:03'),(47,15,1,NULL,'17806211690','可以可以',1,'HUMAN','2026-08-26 17:01:12'),(48,15,3,1,'admin','666，你还没付钱呢，让我退款',1,'HUMAN','2026-08-26 17:02:15'),(49,15,3,1,'admin','滚蛋',1,'HUMAN','2026-08-26 17:02:21'),(50,15,4,NULL,'系统','工单已驳回：gun',2,'HUMAN','2026-08-26 17:02:28'),(51,16,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000016',2,'HUMAN','2026-08-26 17:03:05'),(52,16,4,NULL,'系统','工单已由 admin 受理',2,'HUMAN','2026-08-26 17:03:58'),(53,16,4,NULL,'系统','已登记退款单 R2026082600000002，金额 ¥1.00，待在退款页执行',2,'HUMAN','2026-08-26 17:04:01'),(54,16,4,NULL,'系统','退款单 R2026082600000002 已驳回：不像给',2,'HUMAN','2026-08-26 17:04:49'),(55,16,4,NULL,'系统','已登记退款单 R2026082600000003，金额 ¥1.00，待在退款页执行',2,'HUMAN','2026-08-26 17:05:03'),(56,16,4,NULL,'系统','退款单 R2026082600000003 已手动确认退款 ¥1.00，凭证 12332423',2,'HUMAN','2026-08-26 17:08:11'),(57,17,4,NULL,'系统','工单已创建，等待受理。单号：T2026082600000017',2,'HUMAN','2026-08-26 17:11:06'),(58,17,4,NULL,'系统','工单已由 admin 受理',2,'HUMAN','2026-08-26 17:11:14'),(59,16,4,NULL,'系统','工单已解决：。',2,'HUMAN','2026-08-26 17:11:22'),(60,17,4,NULL,'系统','已登记退款单 R2026082600000004，金额 ¥1.00，待在退款页执行',2,'HUMAN','2026-08-26 17:11:31'),(61,17,4,NULL,'系统','退款单 R2026082600000004 支付宝退款成功 ¥1.00',2,'HUMAN','2026-08-26 17:11:46'),(62,17,4,NULL,'系统','已登记退款单 R2026082600000005，金额 ¥1.00，待在退款页执行',2,'HUMAN','2026-08-26 17:15:50'),(63,17,4,NULL,'系统','支付宝退款调用异常：Read timed out executing POST http://service-order/alipay/refund',2,'HUMAN','2026-08-26 17:16:15'),(64,17,4,NULL,'系统','退款单 R2026082600000005 支付宝退款成功 ¥1.00',2,'HUMAN','2026-08-26 17:19:27'),(65,17,4,NULL,'系统','已登记退款单 R2026082600000006，金额 ¥1.00，待在退款页执行',2,'HUMAN','2026-08-26 17:20:18'),(66,17,4,NULL,'系统','退款单 R2026082600000006 支付宝退款成功 ¥1.00',2,'HUMAN','2026-08-26 17:20:27'),(67,17,4,NULL,'系统','已登记退款单 R2026082600000007，金额 ¥1.00，待在退款页执行',2,'HUMAN','2026-08-26 17:23:28'),(68,17,4,NULL,'系统','退款单 R2026082600000007 支付宝退款成功 ¥1.00',2,'HUMAN','2026-08-26 17:23:56'),(69,17,4,NULL,'系统','工单已解决：尊敬的乘客，您好！关于您的绕路投诉，我们已经多次为您处理退款，且退款均已成功到账。如您还有其他问题，欢迎随时联系我们。感谢您的理解与支持！',2,'HUMAN','2026-09-04 17:15:17');
/*!40000 ALTER TABLE `ticket_message` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-06 13:29:21
