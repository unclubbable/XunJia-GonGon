-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 8.140.211.132    Database: service-ai
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
-- Table structure for table `agent_conversation`
--

DROP TABLE IF EXISTS `agent_conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `thread_id` varchar(64) NOT NULL COMMENT 'LangGraph thread_id，全局唯一',
  `user_type` varchar(16) NOT NULL COMMENT 'ADMIN / PASSENGER / DRIVER',
  `user_id` bigint NOT NULL COMMENT '对应用户主键（boss/passenger/driver）',
  `agent_scene` varchar(32) NOT NULL COMMENT '场景：TICKET_ASSIST / POLICY_QA / NAV_QA / DRIVER_QA',
  `biz_id` bigint DEFAULT NULL COMMENT '业务ID，如 ticketId',
  `title` varchar(128) DEFAULT NULL COMMENT '会话标题',
  `status` varchar(16) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE / CLOSED',
  `last_msg_at` datetime DEFAULT NULL COMMENT '最后消息时间',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_thread_id` (`thread_id`),
  KEY `idx_user_scene` (`user_type`,`user_id`,`agent_scene`,`status`),
  KEY `idx_biz` (`agent_scene`,`biz_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Agent会话与用户映射';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_conversation`
--

LOCK TABLES `agent_conversation` WRITE;
/*!40000 ALTER TABLE `agent_conversation` DISABLE KEYS */;
INSERT INTO `agent_conversation` VALUES (1,'6663b5ceed7e4f859c222a90ed5a4e68','ADMIN',1,'TICKET_ASSIST',17,'工单协查-T2026082600000017','ACTIVE','2026-09-05 20:36:27','2026-09-04 16:48:28','2026-09-05 20:36:27'),(2,'0b72c14668e04a3facb4afe29a53a21d','ADMIN',1,'TICKET_ASSIST',16,'工单协查-T2026082600000016','ACTIVE','2026-09-04 17:14:52','2026-09-04 17:14:42','2026-09-04 17:14:52'),(3,'31203ed5ebb147a5a217c82dfe499e88','ADMIN',1,'TICKET_ASSIST',15,'工单协查-T2026082600000015','ACTIVE','2026-09-05 10:55:01','2026-09-05 10:54:50','2026-09-05 10:55:01');
/*!40000 ALTER TABLE `agent_conversation` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-06 13:27:15
