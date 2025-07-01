-- MySQL dump 10.13  Distrib 8.0.38, for macos14 (arm64)
--
-- Host: 127.0.0.1    Database: high_street_gym
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `duration` int NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'Yoga',60,0),(2,'Pilates',120,0),(3,'Abs',45,0),(4,'HIIT',60,0),(5,'Indoor Cycling',30,0),(6,'Boxing',120,0),(7,'Zumba',30,0);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject` text NOT NULL,
  `content` text NOT NULL,
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `blog_post_user_id_fk` (`user_id`),
  CONSTRAINT `blog_post_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts`
--

LOCK TABLES `blog_posts` WRITE;
/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
INSERT INTO `blog_posts` VALUES (1,1,'example blog post subject','example content');
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `session_id` int NOT NULL,
  `status` enum('active','cancelled') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `uq_bookings_member_session` (`member_id`,`session_id`),
  KEY `booking_member_id_fk_idx` (`member_id`),
  KEY `booking_session_id_fk_idx` (`session_id`),
  CONSTRAINT `booking_member_id_fk` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`),
  CONSTRAINT `booking_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Ashgrove','1 Ashgrove Road',0),(2,'Brisbane City','2 Brisbane Road',0),(3,'Chermside','3 Chermside Road',0),(4,'Graceville','4 Graceville Road',0),(5,'Westlake','5 Westlake Road',0);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `location_id` int NOT NULL,
  `trainer_id` int NOT NULL,
  `deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `trainer_id_fk_idx` (`trainer_id`),
  KEY `sessions_location_id_fk_idx` (`location_id`),
  KEY `sessions_activity_id_fk_idx` (`activity_id`),
  CONSTRAINT `sessions_activity_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  CONSTRAINT `sessions_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `sessions_trainer_id_fk` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (71,1,'2025-07-05','12:30:00',1,2,0),(72,2,'2025-07-06','10:30:00',2,15,0),(73,3,'2025-07-05','16:00:00',1,2,0),(74,5,'2025-07-07','13:00:00',1,2,0),(75,1,'2025-07-08','10:00:00',1,2,0),(76,1,'2025-07-10','10:30:00',1,2,0),(77,6,'2025-07-11','10:30:00',3,15,0),(78,7,'2025-07-12','09:30:00',4,15,0);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role` enum('admin','trainer','member') NOT NULL,
  `email` varchar(45) NOT NULL,
  `password` varchar(255) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `authentication_key` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ad','min','admin','admin@gmail.com','$2a$10$boUQ7OKEQrP3TekjRnGOG.iDoqTi2qKYH/A7zMlyu2tEa9WktRLzy',0,NULL),(2,'Bill','Smith','trainer','trainer@gmail.com','$2a$10$RxtO0wkMxgWMY4ezmSczwOYkZxAkRUR6xgivlhocgNMv3BqNP6zAe',0,NULL),(12,'mem','ber','member','member@gmail.com','$2a$10$gDVWqraOMVga.VowSfMNi.fj4lyTPlYMyLWCzfQb0QH9XnlnauXgi',0,NULL),(15,'Bob','Jane','trainer','trainer2@gmail.com','$2a$10$vHLiuZDXaRyYXW2aczeQ1.JwB763P9UTouyK82OLGrmOrCKRjDT1q',0,NULL),(16,'mem','berTwo','member','member2@gmail.com','$2a$10$3phMuXnZN1wg1uJy40OzauSFGukHBX3p4i9aEVu6fvexasSipxLrS',0,NULL),(17,'John ','Doe','trainer','trainer3@gmail.com','$2a$10$wfZIWZN.js0x5GQzvhtJUO8Etx/OcNMicyZzovfC/lHP8vnLqnQlq',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-01 12:11:08
