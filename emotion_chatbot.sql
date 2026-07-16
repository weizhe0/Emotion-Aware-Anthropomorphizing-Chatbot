-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 16, 2026 at 09:13 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `emotion_chatbot`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `sender` enum('user','bot') NOT NULL,
  `message` text NOT NULL,
  `emotion` varchar(50) DEFAULT NULL,
  `sentiment` varchar(20) DEFAULT NULL,
  `conflict` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `session_id`, `sender`, `message`, `emotion`, `sentiment`, `conflict`, `created_at`) VALUES
(85, 18, 'user', 'i feel great today, every thing is good', 'sad', 'positive', 1, '2026-06-10 10:00:22'),
(86, 18, 'bot', 'That\'s wonderful to hear. It\'s amazing when everything falls into place and you\'re feeling great. You must be doing something right. I\'m so happy for you, and I\'m here to share in your joy. What\'s been the highlight of your day so far? Is there something in particular that\'s put a big smile on your face?', 'sad', NULL, 0, '2026-06-10 10:00:24'),
(103, 20, 'user', 'hi', 'happy', 'positive', 0, '2026-06-14 16:56:06'),
(104, 20, 'bot', 'You seem to be in a great mood today, and that\'s wonderful to see. Your energy is infectious, and I\'m happy to be chatting with you. What\'s putting that big smile on your face? Is everything going well, or is there something in particular that\'s got you feeling so cheerful?', 'happy', NULL, 0, '2026-06-14 16:56:08'),
(105, 21, 'user', 'hi', 'happy', 'positive', 0, '2026-06-14 18:12:20'),
(106, 21, 'bot', 'You seem to be in a great mood today, and that\'s wonderful to see. Your cheerful energy is infectious, and I\'m happy to be chatting with you. What\'s putting that big smile on your face? Is everything going well, or is there something in particular that\'s got you feeling so positive?', 'happy', NULL, 0, '2026-06-14 18:12:21'),
(107, 21, 'user', 'hi i am happy', 'sad', 'positive', 1, '2026-06-14 18:13:22'),
(108, 21, 'bot', 'That\'s wonderful to hear that you\'re happy. However, I sense that there might be something else going on beneath the surface. You initially seemed a bit subdued when you said \"hi\" earlier, and now you\'re telling me you\'re happy. I want you to know that I\'m here to listen and support you, no matter what you\'re feeling. If you\'re willing to share, what\'s making you happy today? Is there something specific that\'s put a smile on your face, or is it just a general feeling of contentment?', 'sad', NULL, 0, '2026-06-14 18:13:23'),
(109, 21, 'user', 'i am going to singapore', 'sad', 'positive', 1, '2026-06-14 18:15:58'),
(110, 21, 'bot', 'Singapore sounds like an exciting destination. I can sense a mix of emotions from you, though - I\'m not sure if it\'s all excitement or if there\'s a bit of nervousness or sadness about leaving something or someone behind. Am I right? You seem happy about the trip, but I want to make sure I\'m not missing anything. Are you looking forward to trying all the amazing food, exploring the Gardens by the Bay, or experiencing the vibrant culture of Singapore? Or is there something else that\'s got you eager to visit? Tell me more about your trip and how you\'re feeling about it.', 'sad', NULL, 0, '2026-06-14 18:15:58'),
(111, 22, 'user', 'n', 'angry', 'negative', 0, '2026-06-14 23:52:20'),
(112, 22, 'bot', 'I can tell that something\'s bothering you, and it seems like you\'re really struggling to put your thoughts into words right now. That can be really overwhelming and frustrating. I\'m here to listen and support you, and I want you to know that I\'m not here to judge. Would you like to talk about what\'s going on, or do you just need someone to be present with you for a bit?', 'angry', NULL, 0, '2026-06-14 23:52:22'),
(113, 23, 'user', 'hi', 'neutral', 'positive', 0, '2026-06-30 17:55:01'),
(114, 23, 'bot', 'It\'s lovely to connect with you. You seem quite calm and relaxed at the moment, and I\'m happy to see that. Is there something on your mind that you\'d like to talk about, or are you just looking for some friendly conversation? I\'m here to listen and support you in any way I can.', 'neutral', NULL, 0, '2026-06-30 17:55:04'),
(143, 23, 'user', 'i feel sad today because my cat was missing', 'sad', 'positive', 1, '2026-07-01 18:30:44'),
(144, 23, 'bot', 'I\'m so sorry to hear that your cat is missing. That can be really scary and sad. It\'s completely understandable that you\'re feeling down today. Losing a pet, even if it\'s just temporary, can be really tough. \n\nCan you tell me more about what happened? When did you last see your cat, and have you been looking for them? Sometimes talking about it can help us feel a little better. I\'m here to listen and offer support. Your feelings are valid, and I care about how you\'re doing.', 'sad', NULL, 0, '2026-07-01 18:30:46'),
(145, 23, 'user', 'who should i contact?', 'sad', 'negative', 0, '2026-07-01 18:31:05'),
(146, 23, 'bot', 'I\'m so glad you\'re taking steps to try to find your cat. It\'s great that you\'re reaching out for help.\n\nThere are a few people and organizations you can contact to help locate your missing cat. You might want to start by contacting:\n\n* Your local animal shelter or humane society to report your cat missing and see if anyone has brought them in.\n* Your neighbors to let them know your cat is missing and ask if they\'ve seen them.\n* Your local veterinary clinics to see if anyone has brought in a cat matching your pet\'s description.\n* You can also post on social media, such as Facebook or Twitter, to spread the word and ask people to keep an eye out for your cat.\n\nAdditionally, you can try contacting local lost and found pet services, such as the ASPCA or PetFinder, to report your cat missing and get help with the search.\n\nRemember, it\'s okay to feel scared and worried, but try to stay hopeful. Many cats are reunited with their', 'sad', NULL, 0, '2026-07-01 18:31:06'),
(147, 30, 'user', 'hi', 'neutral', 'positive', 0, '2026-07-15 10:52:02'),
(148, 30, 'bot', 'Hello. It\'s nice to meet you. You seem quite calm and relaxed at the moment, which is great. I\'m here to listen and chat with you about anything that\'s on your mind. How are you feeling today? Is there something specific you\'d like to talk about, or is it just a casual conversation you\'re looking for?', 'neutral', NULL, 0, '2026-07-15 10:52:04'),
(149, 31, 'user', 'hi', 'happy', 'positive', 0, '2026-07-15 10:53:07'),
(150, 31, 'bot', 'It\'s great to see you\'re looking so cheerful and positive today. I can sense a big smile behind that \"hi\". What\'s putting you in such a wonderful mood? I\'m all ears and here to listen!', 'happy', NULL, 0, '2026-07-15 10:53:09'),
(151, 32, 'user', 'hi', 'happy', 'positive', 0, '2026-07-15 10:54:05'),
(152, 32, 'bot', 'It\'s lovely to see you looking so cheerful and positive today. Your energy is infectious, and I\'m happy to be chatting with you. What\'s putting that big smile on your face? I\'m all ears and here to listen!', 'happy', NULL, 0, '2026-07-15 10:54:06');

-- --------------------------------------------------------

--
-- Table structure for table `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_title` varchar(255) DEFAULT 'New Chat',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_sessions`
--

INSERT INTO `chat_sessions` (`id`, `user_id`, `session_title`, `created_at`) VALUES
(18, 7, 'i feel great today, every thing is good', '2026-06-10 10:00:22'),
(20, 7, 'Back to school', '2026-06-14 16:56:06'),
(21, 7, 'Why sad', '2026-06-14 18:12:20'),
(22, 7, 'Every thing good?', '2026-06-14 23:52:20'),
(23, 7, 'i am sad now', '2026-06-30 17:55:01'),
(30, 7, 'hi', '2026-07-15 10:52:02'),
(31, 7, 'hi', '2026-07-15 10:53:07'),
(32, 7, 'hi', '2026-07-15 10:54:05');

-- --------------------------------------------------------

--
-- Table structure for table `emotion_analytics`
--

CREATE TABLE `emotion_analytics` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `naive_bayes_sentiment` varchar(20) DEFAULT NULL,
  `naive_bayes_confidence` float DEFAULT NULL,
  `logistic_sentiment` varchar(20) DEFAULT NULL,
  `logistic_confidence` float DEFAULT NULL,
  `bert_sentiment` varchar(20) DEFAULT NULL,
  `bert_confidence` float DEFAULT NULL,
  `final_sentiment` varchar(20) DEFAULT NULL,
  `agreement` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emotion_analytics`
--

INSERT INTO `emotion_analytics` (`id`, `message_id`, `naive_bayes_sentiment`, `naive_bayes_confidence`, `logistic_sentiment`, `logistic_confidence`, `bert_sentiment`, `bert_confidence`, `final_sentiment`, `agreement`, `created_at`) VALUES
(43, 85, 'positive', 0.683, 'positive', 0.953, 'positive', 0.98, 'positive', 1, '2026-06-10 10:00:24'),
(52, 103, 'positive', 0.556, 'positive', 0.575, 'positive', 0.509, 'positive', 1, '2026-06-14 16:56:08'),
(53, 105, 'positive', 0.556, 'positive', 0.575, 'positive', 0.509, 'positive', 1, '2026-06-14 18:12:21'),
(54, 107, 'positive', 0.592, 'positive', 0.588, 'positive', 0.916, 'positive', 1, '2026-06-14 18:13:23'),
(55, 109, 'positive', 0.544, 'negative', 0.558, 'positive', 0.632, 'positive', 0, '2026-06-14 18:15:58'),
(56, 111, 'negative', 0.5, 'positive', 0.551, 'negative', 0.527, 'negative', 0, '2026-06-14 23:52:22'),
(57, 113, 'positive', 0.556, 'positive', 0.575, 'positive', 0.509, 'positive', 1, '2026-06-30 17:55:04'),
(72, 143, 'positive', 0.505, 'positive', 0.708, 'negative', 0.857, 'positive', 0, '2026-07-01 18:30:46'),
(73, 145, 'negative', 0.575, 'negative', 0.516, 'negative', 0.898, 'negative', 1, '2026-07-01 18:31:06'),
(74, 147, 'positive', 0.556, 'positive', 0.575, 'positive', 0.509, 'positive', 1, '2026-07-15 10:52:04'),
(75, 149, 'positive', 0.556, 'positive', 0.575, 'positive', 0.509, 'positive', 1, '2026-07-15 10:53:09'),
(76, 151, 'positive', 0.556, 'positive', 0.575, 'positive', 0.509, 'positive', 1, '2026-07-15 10:54:06');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `profile_picture`, `created_at`) VALUES
(7, 'john', 'john@gmail.com', '$2b$12$jrdZrxlMqG3TRQJuOXaPZusYxRgEiGb5lTa9yfMbJTW9S44EZT8cK', NULL, '2026-06-10 01:24:53');

-- --------------------------------------------------------

--
-- Table structure for table `weekly_reports`
--

CREATE TABLE `weekly_reports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `week_start` date DEFAULT NULL,
  `week_end` date DEFAULT NULL,
  `dominant_emotion` varchar(50) DEFAULT NULL,
  `positive_percentage` float DEFAULT NULL,
  `conclusion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weekly_reports`
--

INSERT INTO `weekly_reports` (`id`, `user_id`, `week_start`, `week_end`, `dominant_emotion`, `positive_percentage`, `conclusion`, `created_at`) VALUES
(7, 7, '2026-06-03', '2026-06-10', 'happy', 88.9, '😊 Overall this week you were mostly HAPPY! 88.9% of your messages were positive. Keep up the great mood!', '2026-06-10 09:41:53'),
(8, 7, '2026-06-04', '2026-06-11', 'happy', 64.7, '😐 You had a mixed week. 64.7% positive vs 35.3% negative messages. Some ups and downs — that\'s normal!', '2026-06-11 10:51:14'),
(9, 7, '2026-06-08', '2026-06-15', 'happy', 70, '😊 Overall this week you were mostly HAPPY! 70.0% of your messages were positive. Keep up the great mood!', '2026-06-14 18:12:40'),
(10, 7, '2026-06-25', '2026-07-02', 'neutral', 100, '😊 Overall this week you were mostly HAPPY! 100.0% of your messages were positive. Keep up the great mood!', '2026-07-01 18:30:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `emotion_analytics`
--
ALTER TABLE `emotion_analytics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `weekly_reports`
--
ALTER TABLE `weekly_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- AUTO_INCREMENT for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `emotion_analytics`
--
ALTER TABLE `emotion_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `weekly_reports`
--
ALTER TABLE `weekly_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `emotion_analytics`
--
ALTER TABLE `emotion_analytics`
  ADD CONSTRAINT `emotion_analytics_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `weekly_reports`
--
ALTER TABLE `weekly_reports`
  ADD CONSTRAINT `weekly_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
