DROP TABLE IF EXISTS `test_book`;
CREATE TABLE `test_book` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) DEFAULT NULL,
  `description` text,
  `origin_price` decimal(8,2) DEFAULT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_book(author_id)_idx` (`author_id`),
  CONSTRAINT `test_book_author` FOREIGN KEY (`author_id`) REFERENCES `test_book_author` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;

INSERT INTO `test_book` VALUES (1,'企鹅兰登经典分级读物','大量的描述html',192.00,92.00,5,'2018-05-04 03:02:52','2018-05-04 03:02:54',1,NULL),(2,'Gossie 卡板','Gossie 卡板的大量描述html',40.00,36.80,10,'2018-05-04 03:02:50','2018-05-04 03:02:55',1,NULL),(3,'米小圈上学记','米小圈发生的故事',40.00,40.00,NULL,'2018-05-03 14:37:21','2018-05-03 14:37:39',2,NULL);

DROP TABLE IF EXISTS `test_book_author`;

CREATE TABLE `test_book_author` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) DEFAULT NULL,
  `description` text,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

INSERT INTO `test_book_author` VALUES (1,'兰登','畅销作者兰登','2018-05-04 03:02:19','2018-05-04 03:02:32'),(2,'吴承恩','小说家','2018-05-04 03:02:29','2018-05-04 03:02:34');

DROP TABLE IF EXISTS `test_book_image`;

CREATE TABLE `test_book_image` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) DEFAULT NULL,
  `pic` varchar(1024) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_book_image(book_id)_idx` (`book_id`),
  CONSTRAINT `fk_book` FOREIGN KEY (`book_id`) REFERENCES `test_book` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;

INSERT INTO `test_book_image` VALUES (1,1,'https://img.huxiucdn.com/article/cover/201501/13/070143825417.jpg?imageView2/1/w/800/h/600/|imageMogr2/strip/interlace/1/quality/85/format/jpg',NULL,NULL),(2,2,'https://img.huxiucdn.com/article/cover/201709/02/220120241004.jpg?imageView2/1/w/1440/h/1080/|imageMogr2/strip/interlace/1/quality/85/format/jpg',NULL,NULL),(3,2,'https://img.huxiucdn.com/article/cover/201709/02/220120241004.jpg?imageView2/1/w/1440/h/1080/|imageMogr2/strip/interlace/1/quality/85/format/jpg',NULL,NULL);
