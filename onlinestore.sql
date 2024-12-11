-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 11, 2024 at 04:22 AM
-- Server version: 10.1.28-MariaDB
-- PHP Version: 5.6.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `onlinestore`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddProduct` (IN `pName` VARCHAR(255), IN `pDescription` TEXT, IN `pPrice` DECIMAL(10,2), IN `pStock` INT, IN `pCategoryID` INT, IN `pimage` VARCHAR(255))  BEGIN
    INSERT INTO Products (Name, Description, Price, Stock, CategoryID, CreatedAt,ImageURL)
    VALUES (pName, pDescription, pPrice, pStock, pCategoryID, NOW(),pimage);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ReduceStock` (IN `productID` INT, IN `quantity` INT)  BEGIN
    UPDATE Products
    SET Stock = Stock - quantity
    WHERE ProductID = productID AND Stock >= quantity;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock';
    END IF;
END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateAverageRating` (`productID` INT) RETURNS DECIMAL(3,2) BEGIN
    DECLARE avgRating DECIMAL(3,2);

    -- Menghitung rata-rata rating untuk produk berdasarkan ProductID
    SELECT AVG(Rating) INTO avgRating
    FROM Reviews
    WHERE ProductID = productID;

    -- Mengembalikan nilai rata-rata, atau 0 jika tidak ada rating
    RETURN IFNULL(avgRating, 0);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `CartID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `CategoryID` int(11) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` text,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `CreatedAt`) VALUES
(1, 'Electronics', 'Devices such as phones, laptops, and tablets.', '2024-11-25 04:42:58'),
(2, 'Clothing', 'Apparel including shirts, pants, and dresses.', '2024-11-25 04:42:58'),
(3, 'Books', 'Various genres and authors of books.', '2024-11-25 04:42:58'),
(4, 'Mobil', 'Transportasi roda empat keren', '2024-11-26 12:09:52'),
(5, 'tambah kategori bari', 'ini baru kategorinya', '2024-12-09 03:37:18');

-- --------------------------------------------------------

--
-- Table structure for table `orderdetails`
--

CREATE TABLE `orderdetails` (
  `OrderDetailID` int(11) NOT NULL,
  `OrderID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `Price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `orderdetails`
--

INSERT INTO `orderdetails` (`OrderDetailID`, `OrderID`, `ProductID`, `Quantity`, `Price`) VALUES
(10, 10, 2, 5, '999.99'),
(11, 10, 3, 1, '19.99'),
(12, 10, 7, 1, '199.99'),
(13, 10, 8, 3, '12.99'),
(14, 10, 1, 3, '9.99'),
(17, 11, 1, 2, '9.99'),
(18, 11, 2, 1, '999.99'),
(19, 11, 3, 2, '19.99'),
(20, 12, 1, 2, '9.99'),
(21, 12, 2, 2, '999.99'),
(22, 12, 3, 2, '19.99'),
(23, 13, 4, 2, '799.99'),
(24, 13, 5, 1, '49.99'),
(25, 14, 4, 2, '799.99'),
(26, 14, 2, 2, '999.99');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `OrderID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `TotalAmount` decimal(10,2) NOT NULL,
  `PaymentStatus` enum('Pending','Paid','Failed') NOT NULL,
  `OrderStatus` enum('Processing','Shipped','Delivered','Cancelled') NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`OrderID`, `UserID`, `TotalAmount`, `PaymentStatus`, `OrderStatus`, `CreatedAt`) VALUES
(10, 1, '5288.87', 'Paid', 'Shipped', '2024-11-28 05:42:44'),
(11, 1, '1059.95', 'Paid', 'Shipped', '2024-11-28 05:48:01'),
(12, 1, '2059.94', 'Pending', 'Processing', '2024-12-09 03:51:14'),
(13, 1, '1649.97', 'Pending', 'Processing', '2024-12-09 03:51:45'),
(14, 1, '3599.96', 'Pending', 'Processing', '2024-12-09 05:55:07');

-- --------------------------------------------------------

--
-- Stand-in structure for view `order_summary`
-- (See below for the actual view)
--
CREATE TABLE `order_summary` (
`OrderID` int(11)
,`UserID` int(11)
,`UserName` varchar(100)
,`Email` varchar(100)
,`TotalAmount` decimal(10,2)
,`PaymentStatus` enum('Pending','Paid','Failed')
,`OrderStatus` enum('Processing','Shipped','Delivered','Cancelled')
,`OrderCreatedAt` timestamp
,`OrderDetailID` int(11)
,`ProductID` int(11)
,`ProductName` varchar(255)
,`ProductDescription` text
,`ProductPrice` decimal(10,2)
,`QuantityOrdered` int(11)
,`TotalPrice` decimal(20,2)
,`CategoryName` varchar(100)
,`ProductStock` int(11)
,`ProductRating` int(11)
,`AverageRating` decimal(14,4)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `productdetails`
-- (See below for the actual view)
--
CREATE TABLE `productdetails` (
`ProductID` int(11)
,`ProductName` varchar(255)
,`Description` text
,`Price` decimal(10,2)
,`Stock` int(11)
,`CategoryName` varchar(100)
,`CreatedAt` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `ProductID` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` text,
  `Price` decimal(10,2) NOT NULL,
  `Stock` int(11) NOT NULL,
  `CategoryID` int(11) DEFAULT NULL,
  `ImageURL` varchar(255) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`ProductID`, `Name`, `Description`, `Price`, `Stock`, `CategoryID`, `ImageURL`, `CreatedAt`) VALUES
(1, 'The Alchemist', 'A novel by Paulo Coelho about following your dreams.', '9.99', 193, 3, 'https://example.com/images/alchemist.jpg', '2024-11-25 04:45:45'),
(2, 'iPhone 14', 'Latest Apple smartphone with A15 chip.', '999.99', 40, 1, 'https://example.com/images/iphone14.jpg', '2024-11-25 04:45:45'),
(3, 'T-Shirt', '100% cotton t-shirt available in multiple colors.', '19.99', 95, 2, 'https://www.toyota.astra.co.id/sites/default/files/2023-09/avanza%20e%20type_1_1.png', '2024-11-25 04:46:29'),
(4, 'Samsung Galaxy S23', 'Flagship smartphone with excellent camera and display.', '799.99', 36, 1, 'https://example.com/images/samsung_s23.jpg', '2024-11-25 04:55:53'),
(5, 'Wireless Earbuds', 'High-quality earbuds with noise cancellation.', '49.99', 149, 1, 'https://example.com/images/earbuds.jpg', '2024-11-25 04:55:53'),
(6, 'Gaming Laptop', 'Powerful gaming laptop with RTX 3070 GPU.', '1499.99', 30, 1, 'https://example.com/images/gaming_laptop.jpg', '2024-11-25 04:55:53'),
(7, 'Smart Watch', 'Water-resistant smart watch with health monitoring features.', '199.99', 74, 1, 'https://example.com/images/smart_watch.jpg', '2024-11-25 04:55:53'),
(8, 'Coffee Mug', 'Ceramic mug for coffee lovers, available in multiple designs.', '12.99', 117, 2, 'https://example.com/images/coffee_mug.jpg', '2024-11-25 04:55:53'),
(9, 'Yoga Mat', 'Eco-friendly yoga mat for all fitness levels.', '29.99', 80, 2, 'https://example.com/images/yoga_mat.jpg', '2024-11-25 04:55:53'),
(10, 'Backpack', 'Durable backpack with multiple compartments.', '39.99', 90, 2, 'https://example.com/images/backpack.jpg', '2024-11-25 04:55:53'),
(11, 'LED Desk Lamp', 'Adjustable LED lamp with USB charging port.', '25.99', 60, 2, 'https://example.com/images/desk_lamp.jpg', '2024-11-25 04:55:53'),
(12, 'Bluetooth Speaker', 'Portable speaker with excellent sound quality.', '35.99', 110, 1, 'https://example.com/images/speaker.jpg', '2024-11-25 04:55:53'),
(13, 'Fiction Novel', 'Engaging fiction book from a popular author.', '14.99', 50, 3, 'https://example.com/images/fiction_novel.jpg', '2024-11-25 04:55:53'),
(14, 'Cookware Set', 'Non-stick cookware set with 5 pieces.', '89.99', 25, 2, 'https://example.com/images/cookware_set.jpg', '2024-11-25 04:55:53'),
(15, 'Wireless Keyboard', 'Compact keyboard with long battery life.', '45.99', 60, 1, 'https://example.com/images/wireless_keyboard.jpg', '2024-11-25 04:55:53'),
(16, 'Electric Kettle', 'Fast boiling kettle with 1.7L capacity.', '29.99', 50, 2, 'https://example.com/images/electric_kettle.jpg', '2024-11-25 04:55:53'),
(17, 'Board Game', 'Fun and engaging game for family and friends.', '24.99', 70, 3, 'https://example.com/images/board_game.jpg', '2024-11-25 04:55:53'),
(18, 'Digital Camera', 'Compact camera with 20MP sensor.', '499.99', 20, 1, 'https://example.com/images/digital_camera.jpg', '2024-11-25 04:55:53'),
(19, 'avanza', 'transportasi irit untuk kendaraan roda 4 ya kan', '4999.00', 100, 4, 'https://www.toyota.astra.co.id/sites/default/files/2023-09/avanza%20e%20type_1_1.png', '2024-11-27 23:38:46'),
(20, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:09'),
(21, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:14'),
(22, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:19'),
(23, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:24'),
(24, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:29'),
(25, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:34'),
(26, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:39'),
(27, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:44'),
(28, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:49'),
(29, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:54'),
(30, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:35:59'),
(31, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:04'),
(32, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:09'),
(33, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:14'),
(34, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:19'),
(35, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:24'),
(36, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:29'),
(37, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:34'),
(38, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:39'),
(39, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:44'),
(40, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:50'),
(41, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:36:55'),
(42, 'gaber', 'kucing lucu', '100.00', 10, 1, 'kucing.jpg', '2024-12-07 02:37:00'),
(43, 'gajah', 'buku', '100.00', 10, 1, 'gajah.jpg', '2024-12-07 02:46:33'),
(44, 'kucing lucu', 'lucu banget', '1000.00', 10, 2, 'lucu.jpg', '2024-12-07 02:46:33'),
(45, 'hp samsung', 'samsungku', '10000.00', 100, 1, 'samsungku.jpg', '2024-12-08 12:47:34'),
(46, 'hp samsung', 'samsungku', '10000.00', 100, 1, 'samsungku.jpg', '2024-12-08 12:47:39'),
(47, 'hp samsung', 'samsungku', '10000.00', 100, 1, 'samsungku.jpg', '2024-12-08 12:47:44'),
(48, 'smart watch', 'jam pintar android ya', '100000.00', 10, 1, 'smartwatch.jpg', '2024-12-09 01:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `pushnotifications`
--

CREATE TABLE `pushnotifications` (
  `NotificationID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Token` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('unread','read','deleted','') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `pushnotifications`
--

INSERT INTO `pushnotifications` (`NotificationID`, `UserID`, `Token`, `message`, `type`, `created_at`, `updated_at`) VALUES
(4, 1, 'perubahan token oke', 'hore', 'read', '2024-12-11 03:21:53', '2024-12-11 03:21:53'),
(5, 1, 'perubahan token oke rabbitmq', 'hore', 'read', '2024-12-11 03:22:02', '2024-12-11 03:22:02');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `ReviewID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Rating` int(11) NOT NULL,
  `Comment` text,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`ReviewID`, `ProductID`, `UserID`, `Rating`, `Comment`, `CreatedAt`) VALUES
(1, 1, 1, 5, 'Great product!', '2024-11-28 08:01:58'),
(2, 1, 1, 1, 'good', '2024-11-28 08:11:23'),
(3, 2, 1, 3, 'oklah', '2024-11-28 08:11:48'),
(4, 3, 1, 4, 'jos', '2024-11-28 08:15:20'),
(5, 4, 1, 1, 'oke', '2024-11-29 07:14:12'),
(6, 1, 1, 1, 'assasa', '2024-11-29 07:35:07'),
(7, 1, 1, 1, 'dsdsdsds', '2024-11-29 07:35:13'),
(8, 2, 1, 1, 'keren', '2024-11-29 07:36:49'),
(9, 3, 1, 4, 'very good', '2024-12-03 07:45:02'),
(10, 1, 1, 1, 'sss', '2024-12-04 06:27:50'),
(11, 1, 1, 4, 'good excellent', '2024-12-04 06:57:42'),
(12, 2, 1, 4, 'very good', '2024-12-04 06:59:14'),
(13, 2, 1, 3, 'not bad', '2024-12-04 06:59:25'),
(14, 8, 1, 3, 'nice', '2024-12-04 07:00:03'),
(15, 7, 1, 2, 'not bad', '2024-12-04 07:00:12');

-- --------------------------------------------------------

--
-- Stand-in structure for view `transactiondetails`
-- (See below for the actual view)
--
CREATE TABLE `transactiondetails` (
`UserID` int(11)
,`OrderID` int(11)
,`UserName` varchar(100)
,`Email` varchar(100)
,`TotalAmount` decimal(10,2)
,`PaymentStatus` enum('Pending','Paid','Failed')
,`OrderStatus` enum('Processing','Shipped','Delivered','Cancelled')
,`CreatedAt` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `userlogs`
--

CREATE TABLE `userlogs` (
  `LogID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Activity` varchar(255) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `userlogs`
--

INSERT INTO `userlogs` (`LogID`, `UserID`, `Activity`, `CreatedAt`) VALUES
(1, 1, 'User Created', '2024-11-25 02:42:32'),
(4, 12, 'User Created', '2024-12-10 05:10:10'),
(5, 13, 'User Created', '2024-12-10 05:30:32');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Role` enum('Customer','Admin','Manager') NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `Name`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES
(1, 'fajar', 'fjar86@gmail.com', '$2y$10$a7fUI1lkqgvkDcCQNK4cL.aWDP4HtEDd9O95bCkMkw5/pJUOKJ60O', 'Admin', '2024-11-25 02:42:32'),
(12, 'eka gaul', 'eka@gmail.com', '$2y$10$1AOsEuXTpDnoPK2Slue3He6yY.UXuTjcLION//fBBRE4mUff2WLcG', 'Customer', '2024-12-10 05:10:10'),
(13, 'ari', 'ari@gmail.com', '$2y$10$gdziK0Z84tbQX6CFBrqlXe.FL949R665zKKQKZ8ifUuZT9uaFH86u', 'Customer', '2024-12-10 05:30:32');

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `LogNewUser` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    INSERT INTO UserLogs (UserID, Activity, CreatedAt)
    VALUES (NEW.UserID, 'User Created', NOW());
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure for view `order_summary`
--
DROP TABLE IF EXISTS `order_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `order_summary`  AS  select `o`.`OrderID` AS `OrderID`,`o`.`UserID` AS `UserID`,`u`.`Name` AS `UserName`,`u`.`Email` AS `Email`,`o`.`TotalAmount` AS `TotalAmount`,`o`.`PaymentStatus` AS `PaymentStatus`,`o`.`OrderStatus` AS `OrderStatus`,`o`.`CreatedAt` AS `OrderCreatedAt`,`od`.`OrderDetailID` AS `OrderDetailID`,`p`.`ProductID` AS `ProductID`,`p`.`Name` AS `ProductName`,`p`.`Description` AS `ProductDescription`,`p`.`Price` AS `ProductPrice`,`od`.`Quantity` AS `QuantityOrdered`,(`p`.`Price` * `od`.`Quantity`) AS `TotalPrice`,`c`.`Name` AS `CategoryName`,`p`.`Stock` AS `ProductStock`,`r`.`Rating` AS `ProductRating`,(select avg(`reviews`.`Rating`) from `reviews` where (`reviews`.`ProductID` = `p`.`ProductID`)) AS `AverageRating` from (((((`orders` `o` join `users` `u` on((`o`.`UserID` = `u`.`UserID`))) join `orderdetails` `od` on((`o`.`OrderID` = `od`.`OrderID`))) join `products` `p` on((`od`.`ProductID` = `p`.`ProductID`))) join `categories` `c` on((`p`.`CategoryID` = `c`.`CategoryID`))) left join `reviews` `r` on((`p`.`ProductID` = `r`.`ProductID`))) ;

-- --------------------------------------------------------

--
-- Structure for view `productdetails`
--
DROP TABLE IF EXISTS `productdetails`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `productdetails`  AS  select `p`.`ProductID` AS `ProductID`,`p`.`Name` AS `ProductName`,`p`.`Description` AS `Description`,`p`.`Price` AS `Price`,`p`.`Stock` AS `Stock`,`c`.`Name` AS `CategoryName`,`p`.`CreatedAt` AS `CreatedAt` from (`products` `p` join `categories` `c` on((`p`.`CategoryID` = `c`.`CategoryID`))) ;

-- --------------------------------------------------------

--
-- Structure for view `transactiondetails`
--
DROP TABLE IF EXISTS `transactiondetails`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `transactiondetails`  AS  select `o`.`UserID` AS `UserID`,`o`.`OrderID` AS `OrderID`,`u`.`Name` AS `UserName`,`u`.`Email` AS `Email`,`o`.`TotalAmount` AS `TotalAmount`,`o`.`PaymentStatus` AS `PaymentStatus`,`o`.`OrderStatus` AS `OrderStatus`,`o`.`CreatedAt` AS `CreatedAt` from (`orders` `o` join `users` `u` on((`o`.`UserID` = `u`.`UserID`))) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`CartID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`CategoryID`);

--
-- Indexes for table `orderdetails`
--
ALTER TABLE `orderdetails`
  ADD PRIMARY KEY (`OrderDetailID`),
  ADD KEY `OrderID` (`OrderID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`OrderID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`ProductID`),
  ADD KEY `CategoryID` (`CategoryID`);

--
-- Indexes for table `pushnotifications`
--
ALTER TABLE `pushnotifications`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`ReviewID`),
  ADD KEY `ProductID` (`ProductID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `userlogs`
--
ALTER TABLE `userlogs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `CartID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `CategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orderdetails`
--
ALTER TABLE `orderdetails`
  MODIFY `OrderDetailID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `OrderID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `pushnotifications`
--
ALTER TABLE `pushnotifications`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `ReviewID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `userlogs`
--
ALTER TABLE `userlogs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`ProductID`) REFERENCES `products` (`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderdetails`
--
ALTER TABLE `orderdetails`
  ADD CONSTRAINT `orderdetails_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orderdetails_ibfk_2` FOREIGN KEY (`ProductID`) REFERENCES `products` (`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `categories` (`CategoryID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pushnotifications`
--
ALTER TABLE `pushnotifications`
  ADD CONSTRAINT `pushnotifications_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `products` (`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `userlogs`
--
ALTER TABLE `userlogs`
  ADD CONSTRAINT `userlogs_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
