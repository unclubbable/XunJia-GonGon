-- MySQL dump 10.13  Distrib 8.0.39, for Win64 (x86_64)
--
-- Host: 8.140.211.132    Database: service-driver-user
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
-- Table structure for table `car`
--

DROP TABLE IF EXISTS `car`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `address` char(6) DEFAULT NULL COMMENT '车辆注册城市',
  `vehicle_no` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆号牌',
  `plate_color` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车牌颜色（1：蓝色，2：黄色，3：黑色，4：白色，5：绿色，9：其他）',
  `seats` int DEFAULT NULL COMMENT '核定载客位',
  `brand` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆厂牌',
  `model` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆型号',
  `vehicle_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '1' COMMENT '车辆类型（1：轿车，2：SUV，3：MPV， 4 ：面包车， 9：其他',
  `owner_name` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆所有人',
  `vehicle_color` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆颜色（1：白色，2：黑色）',
  `engine_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '发动机号',
  `vin` varchar(64) DEFAULT NULL COMMENT '车辆识别码',
  `certify_date_a` date DEFAULT NULL COMMENT '车辆注册日期',
  `fue_type` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '燃料类型(1：汽油，2：柴油，3：天然气，4：液化气，5：电动，9：其他）',
  `engine_displace` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '发动机排量（毫升）',
  `trans_agency` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆运输证发证机构',
  `trans_area` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆经验区域',
  `trans_date_start` date DEFAULT NULL COMMENT '车辆运输证有效期起',
  `trans_date_end` date DEFAULT NULL COMMENT '车辆运输证有效期止',
  `certify_date_b` date DEFAULT NULL COMMENT '车辆初次登记日期',
  `fix_state` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '车辆的检修状态(0：未检修，1：已检修，2：未知）',
  `next_fix_date` date DEFAULT NULL COMMENT '下次年检时间',
  `check_state` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '年度审验状态（0：未年审，1：年审合格，2：年审不合格）',
  `fee_print_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '发票打印设备序列号',
  `gps_brand` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '卫星定位装置品牌',
  `gps_model` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '卫星型号',
  `gps_install_date` date DEFAULT NULL COMMENT '卫星定位设备安装日期',
  `register_date` date DEFAULT NULL COMMENT '报备日期',
  `commercial_type` int DEFAULT NULL COMMENT '服务类型：1：网络预约出租车，2：巡游出租车，3：私人小客车合乘',
  `fare_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '运价编码 关联计价规则',
  `state` tinyint(1) DEFAULT '0' COMMENT '状态：0:有效，1：失效',
  `tid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '终端id',
  `trid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '轨迹id',
  `trname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '轨迹名称',
  `gmt_create` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car`
--

LOCK TABLES `car` WRITE;
/*!40000 ALTER TABLE `car` DISABLE KEYS */;
INSERT INTO `car` VALUES (1,'110000','京A2541','1',5,'比亚迪','唐A','1','王五','2','AB55487C','LSDAGDSVSE','2023-11-30','5','1500','北京市交通运输局','北京市','2023-11-15','2037-11-20','2023-11-07','1','2025-11-14','1','55487','ss','ss','2023-11-06','2023-11-22',1,'110000$1',0,'1866119768','20',NULL,'2026-03-26 11:02:22','2026-03-26 11:51:08'),(2,'370100','鲁A83fe','1',5,'雪佛兰','雪A','1','陈加','1','v8','23cr3e','2026-03-18','1','35600','国家税务局','北京市','2026-03-10','2027-03-18',NULL,'0','2026-03-31','1','238C832NCR32R','GGP','A186','2026-03-16',NULL,1,NULL,0,'1879222808','120','','2026-03-26 14:14:03','2026-03-26 14:14:03');
/*!40000 ALTER TABLE `car` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_car_binding_relationship`
--

DROP TABLE IF EXISTS `driver_car_binding_relationship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_car_binding_relationship` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint DEFAULT NULL,
  `car_id` bigint DEFAULT NULL,
  `vehicle_no` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `bind_state` int DEFAULT NULL,
  `binding_time` datetime DEFAULT NULL,
  `un_binding_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_car_binding_relationship`
--

LOCK TABLES `driver_car_binding_relationship` WRITE;
/*!40000 ALTER TABLE `driver_car_binding_relationship` DISABLE KEYS */;
INSERT INTO `driver_car_binding_relationship` VALUES (1,1,1,'京A2541',1,'2023-11-26 18:24:18',NULL),(5,2,2,'鲁A83fe',2,'2026-03-26 14:14:32',NULL),(6,2,2,'鲁A83fe',2,'2026-03-26 15:02:54',NULL),(7,2,2,'鲁A83fe',1,'2026-03-26 17:03:06',NULL);
/*!40000 ALTER TABLE `driver_car_binding_relationship` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_user`
--

DROP TABLE IF EXISTS `driver_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `address` char(6) DEFAULT NULL COMMENT '司机运营地行政区划代码',
  `driver_surname` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '司机姓',
  `driver_name` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '司机姓名',
  `driver_phone` varchar(16) DEFAULT NULL COMMENT '司机手机号',
  `driver_gender` tinyint DEFAULT NULL COMMENT '1:男，2：女',
  `driver_birthday` date DEFAULT NULL COMMENT '司机生日',
  `driver_nation` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '驾驶员民族',
  `total_orders` bigint DEFAULT '0' COMMENT '司机完成总单数',
  `driver_contact_address` varchar(255) DEFAULT NULL COMMENT '司机联系地址',
  `license_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '机动车驾驶证号',
  `get_driver_license_date` date DEFAULT NULL COMMENT '初次领取驾驶证日期',
  `driver_license_on` date DEFAULT NULL COMMENT '驾驶证有效期起',
  `driver_license_off` date DEFAULT NULL COMMENT '驾驶证有效期止',
  `taxi_driver` tinyint DEFAULT NULL COMMENT '是否巡游出租汽车：1：是，0：否',
  `certificate_no` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '网络预约出租汽车驾驶员资格证号',
  `network_car_issue_organization` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '网络预约出租汽车驾驶员发证机构',
  `network_car_issue_date` date DEFAULT NULL COMMENT '资格证发证日期',
  `get_network_car_proof_date` date DEFAULT NULL COMMENT '初次领取资格证日期',
  `network_car_proof_on` date DEFAULT NULL COMMENT '资格证有效起始日期',
  `network_car_proof_off` date DEFAULT NULL COMMENT '资格证有效截止日期',
  `register_date` date DEFAULT NULL COMMENT '报备日期',
  `commercial_type` tinyint DEFAULT NULL COMMENT '服务类型：1：网络预约出租汽车，2：巡游出租汽车，3：私人小客车合乘',
  `contract_company` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '驾驶员合同（协议）签署公司',
  `contract_on` date DEFAULT NULL COMMENT '合同（协议）有效期起',
  `contract_off` date DEFAULT NULL COMMENT '合同有效期止',
  `state` tinyint DEFAULT '0' COMMENT '司机状态：0：有效，1：失效',
  `gmt_create` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_user`
--

LOCK TABLES `driver_user` WRITE;
/*!40000 ALTER TABLE `driver_user` DISABLE KEYS */;
INSERT INTO `driver_user` VALUES (1,'371100','陈','陈家旺','15069840419',1,'2020-01-03','汉族',18,'通信地址','机动车驾驶证号','2019-01-05','2019-01-01','2025-01-01',1,'673402837482374823423','北京交通总局','2020-01-02','2020-01-01','2020-01-03','2028-07-01','2020-02-03',1,'合约公司','2022-01-05','2022-01-06',0,'2026-03-26 17:00:53','2026-03-30 14:51:37'),(2,'371100','张','张三','15547553754',1,'2026-03-09','和',0,'无','23d423c','2026-03-03','2026-03-03','2027-03-17',0,'23cxru832cnr834nc','国家税务局','2026-03-03','2026-03-10','2027-03-10','2026-05-19','2027-03-12',3,'无','2026-03-10','2027-03-02',0,'2026-03-28 11:27:25','2026-03-28 11:27:25');
/*!40000 ALTER TABLE `driver_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_user_money`
--

DROP TABLE IF EXISTS `driver_user_money`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_user_money` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int DEFAULT NULL COMMENT '司机ID',
  `year` int DEFAULT NULL COMMENT '年',
  `month` int DEFAULT NULL COMMENT '月',
  `total_order_amount` double DEFAULT NULL COMMENT '订单总金额（乘客实付）',
  `driver_income` double DEFAULT NULL COMMENT '司机实际收入（最终到手）',
  `platform_commission` double DEFAULT NULL COMMENT '平台抽成/服务费',
  `status` bigint DEFAULT NULL COMMENT '是否发放（0未发放，1已发放）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_user_money`
--

LOCK TABLES `driver_user_money` WRITE;
/*!40000 ALTER TABLE `driver_user_money` DISABLE KEYS */;
INSERT INTO `driver_user_money` VALUES (1,1,2025,1,12800,10240,2560,1),(2,1,2025,2,13500,10800,2700,1),(3,1,2025,3,14200,11360,2840,1),(4,1,2025,4,15600,12480,3120,1),(5,1,2025,5,16300,13040,3260,1),(6,1,2025,6,14900,11920,2980,1),(7,1,2025,7,15800,12640,3160,1),(8,1,2025,8,16600,13280,3320,1),(9,1,2025,9,15100,12080,3020,1),(10,1,2025,10,17200,13760,3440,1),(11,1,2025,11,16500,13200,3300,1),(12,1,2025,12,18000,14400,3600,1),(13,1,2026,1,100,80,20,1),(14,1,2026,2,17900,14320,3580,1),(15,1,2026,3,19282,15424,3856,0),(17,2,2025,1,8500,6800,1700,1),(18,2,2025,2,9200,7360,1840,0),(19,2,2025,3,10500,8400,2100,1),(20,2,2025,4,7800,6240,1560,0),(21,2,2025,5,11200,8960,2240,0),(22,2,2025,6,12000,9600,2400,1),(23,2,2025,7,8900,7120,1780,0),(24,2,2025,8,9800,7840,1960,0),(25,2,2025,9,10200,8160,2040,0),(26,2,2025,10,11500,9200,2300,1),(27,2,2025,11,8300,6640,1660,0),(28,2,2025,12,13000,10400,2600,0),(29,2,2026,1,9500,7600,1900,0),(30,2,2026,2,10800,8640,2160,1),(31,2,2026,3,7500,6000,1500,0);
/*!40000 ALTER TABLE `driver_user_money` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_user_work_status`
--

DROP TABLE IF EXISTS `driver_user_work_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_user_work_status` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint DEFAULT NULL,
  `work_status` int DEFAULT NULL,
  `citycode` varchar(10) DEFAULT NULL COMMENT '运营城市代码',
  `adname` varchar(12) DEFAULT NULL COMMENT '运营城市',
  `adcode` varchar(10) DEFAULT NULL,
  `gmt_create` datetime DEFAULT NULL,
  `gmt_modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_user_work_status`
--

LOCK TABLES `driver_user_work_status` WRITE;
/*!40000 ALTER TABLE `driver_user_work_status` DISABLE KEYS */;
INSERT INTO `driver_user_work_status` VALUES (1,1,0,'0633','日照市','371100','2023-11-21 15:32:34','2026-03-31 17:20:32'),(8,2,0,'0633',NULL,'371100','2026-03-26 08:29:19','2026-03-28 11:29:43'),(9,2,0,NULL,NULL,'371100','2026-03-26 08:29:33','2026-03-26 08:29:33'),(10,NULL,1,NULL,NULL,NULL,'2026-03-31 13:24:20','2026-03-31 13:24:20');
/*!40000 ALTER TABLE `driver_user_work_status` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-01 17:28:15
