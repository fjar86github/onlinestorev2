# Online Store with RESTful APIs, Data Science, and Microservices

This is a complete online store project built using a combination of **Frontend**, **Backend**, **Data Science**, and **Microservices**. It provides an interactive shopping experience with advanced features such as product recommendations, stock predictions, and fault tolerance using RabbitMQ and JWT-based authentication and integrated with google data analytic.

## Features

### Frontend:
- **HTML5, CSS3, and JavaScript**: Modern web design with a responsive UI.
- **Service Worker**: Enables offline functionality for a seamless experience when the user is not connected to the internet.

### Backend:
- **PHP 5.3 RESTful API**: Handles CRUD operations for products, users, and orders.
- **Flask (Python)**: Provides Data Science-powered features such as product recommendations and stock prediction.
- **RabbitMQ**: Implements message queuing for fault tolerance. If the MySQL server goes down, operations continue smoothly via the message queue.
- **JWT (JSON Web Token)**: Secure authentication for the RESTful APIs.

### Microservices:
- **Service Discovery**: A `.json` file is used for discovering available services in the system.
- **API Gateway**: `index.php` acts as a gateway that routes API requests and performs CRUD operations on the data.

## Installation

Follow these steps to set up your own instance of the online store.

### Prerequisites
- **PHP 5.3**: Install PHP and a web server such as Apache or Nginx.
- **MySQL**: Database management system.
- **Python 3.x**: For Flask-based data science services.
- **RabbitMQ**: Messaging service.

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/online-store.git
   cd online-store
2. **Project Directory Structure**:
   Here is the structure of the project directory, showcasing the files and subfolders:
C:. ├── catatan.txt ├── index.php ├── onlinestore.sql ├── api │ ├── app.py │ ├── app2.py │ ├── app3.py │ ├── app4.py │ ├── app5.py │ ├── app6.py │ ├── auth.php │ ├── cart.php │ ├── categories.php │ ├── chatbot.php │ ├── database.php │ ├── index.html │ ├── jwt.php │ ├── login.php │ ├── mysqlstatus.php │ ├── notifications.php │ ├── orders.php │ ├── products.php │ ├── profile.php │ ├── register.php │ ├── reviews.php │ ├── segmentasipelanggan.php │ ├── transaksi.php │ └── users.php ├── public │ ├── cart.html │ ├── checkout.html │ ├── index.html │ ├── login.html │ ├── manage-categories.html │ ├── manage-products.html │ ├── manage-users.html │ ├── notifications.html │ ├── offline.html │ ├── orders.html │ ├── product-list.html │ ├── recomended.html │ ├── register.html │ ├── segmentasipelanggan.html │ ├── sentiment.html │ ├── service-worker.js │ ├── stokpredict.html │ ├── transaksi.html │ └── user-profile.html ├── css │ └── styles.css ├── images ├── js │ ├── api_endpoints.json │ ├── cart.js │ ├── chatbot.js │ ├── checkout.js │ ├── config.js │ ├── config2.js │ ├── endpoints.json │ ├── manage-categories.js │ ├── manage-products.js │ ├── manage-users.js │ ├── notifications.js │ ├── orders.js │ ├── product-list.js │ ├── products.js │ ├── recomended.js │ ├── segmentasi.js │ ├── sentiment.js │ ├── stokpredict.js │ ├── transaksi.js │ ├── userprofile.js │ └── workerconfig.js └── templates ├── footer.html ├── header.html └── sidebar.html


## Explanation of the Directory Structure

- **C:**
  - `catatan.txt`: A text file for notes.
  - `index.php`: The entry point for the PHP application.
  - `onlinestore.sql`: SQL script to set up the database.
  
- **api/**
  - Contains various Python and PHP scripts handling core functionalities such as user authentication (`auth.php`), cart management (`cart.php`), product handling (`products.php`), and more.
  - Also includes HTML templates for API routes.

- **public/**
  - Contains the HTML pages used in the front-end of the project.
  - Includes pages like `cart.html`, `checkout.html`, `orders.html`, and `recomended.html`.

- **css/**
  - Contains the `styles.css` file for styling the front-end pages.

- **images/**
  - Stores image files used throughout the project.

- **js/**
  - Contains JavaScript files for handling the dynamic behavior of the front-end.
  - Files like `cart.js`, `checkout.js`, `products.js`, and `recomended.js` manage different aspects of the UI functionality.

- **templates/**
  - Contains reusable HTML templates for common elements like the `footer.html`, `header.html`, and `sidebar.html`.

---

This structure ensures a modular organization, separating the back-end (API) logic from the front-end user interface, and organizing the project into clearly defined folders for easy navigation and management.




### Penjelasan:
1. **Struktur Endpoint**: Setiap endpoint API dijelaskan dengan jelas termasuk metode HTTP yang digunakan (`GET`, `POST`, `PUT`, `DELETE`), parameter body, dan format respons.
2. **Error Handling**: Penjelasan mengenai error yang mungkin muncul, seperti `404 Not Found` dan `401 Unauthorized`.
3. **Dokumentasi Terstruktur**: Menyusun dokumentasi dengan header untuk memisahkan bagian-bagian yang berbeda seperti informasi umum, autentikasi, dan dokumentasi endpoint.

# Online Store API Documentation

This document provides the API documentation for the Online Store, which is implemented using PHP 5.3. It supports various endpoints for managing users, products, orders, and more.

## General Information

- **Base URL**: `/onlinestorev2/index.php`
- **CORS Headers**: All requests from any origin are allowed (this can be modified to restrict specific domains).
- **HTTP Methods**: The API supports the following HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS`.
- **Authentication**: JWT (JSON Web Token) is used for authentication. Ensure to include the `Authorization` header with a valid token for protected routes.

## CORS Headers

The following CORS headers are used for all API responses:

- `Access-Control-Allow-Origin: *` (Can be customized to allow specific domains)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Authentication

To access protected routes, you need to include a JWT token in the `Authorization` header of the request. The token is obtained after logging in or registering.

## Endpoints

### 1. **Register a New User**
- **URL**: `/api/register`
- **Method**: `POST`
- **Body**:
    ```json
    {
        "username": "user123",
        "email": "user@example.com",
        "password": "password123"
    }
    ```
- **Response**:
    ```json
    {
        "message": "User registered successfully."
    }
    ```

### 2. **Login**
- **URL**: `/api/login`
- **Method**: `POST`
- **Body**:
    ```json
    {
        "username": "user123",
        "password": "password123"
    }
    ```
- **Response**:
    ```json
    {
        "token": "your-jwt-token"
    }
    ```

### 3. **Get User Profile**
- **URL**: `/api/profile`
- **Method**: `GET`
- **Authorization**: Bearer Token
- **Response**:
    ```json
    {
        "id": 1,
        "username": "user123",
        "email": "user@example.com"
    }
    ```

### 4. **Get All Products**
- **URL**: `/api/products`
- **Method**: `GET`
- **Response**:
    ```json
    {
        "products": [
            {
                "id": 1,
                "name": "Product 1",
                "price": 100,
                "stock": 20
            },
            {
                "id": 2,
                "name": "Product 2",
                "price": 150,
                "stock": 15
            }
        ]
    }
    ```

### 5. **Create a Product**
- **URL**: `/api/products`
- **Method**: `POST`
- **Body**:
    ```json
    {
        "name": "New Product",
        "price": 120,
        "stock": 30
    }
    ```
- **Response**:
    ```json
    {
        "message": "Product created successfully."
    }
    ```

### 6. **Get a Product**
- **URL**: `/api/products/{id}`
- **Method**: `GET`
- **Response**:
    ```json
    {
        "id": 1,
        "name": "Product 1",
        "price": 100,
        "stock": 20
    }
    ```

### 7. **Update a Product**
- **URL**: `/api/products/{id}`
- **Method**: `PUT`
- **Body**:
    ```json
    {
        "name": "Updated Product Name",
        "price": 140,
        "stock": 25
    }
    ```
- **Response**:
    ```json
    {
        "message": "Product updated successfully."
    }
    ```

### 8. **Delete a Product**
- **URL**: `/api/products/{id}`
- **Method**: `DELETE`
- **Response**:
    ```json
    {
        "message": "Product deleted successfully."
    }
    ```

### 9. **Add Item to Cart**
- **URL**: `/api/cart`
- **Method**: `POST`
- **Body**:
    ```json
    {
        "product_id": 1,
        "quantity": 2
    }
    ```
- **Response**:
    ```json
    {
        "message": "Item added to cart."
    }
    ```

### 10. **Create an Order**
- **URL**: `/api/orders`
- **Method**: `POST`
- **Body**:
    ```json
    {
        "user_id": 1,
        "cart_items": [
            { "product_id": 1, "quantity": 2 },
            { "product_id": 2, "quantity": 1 }
        ]
    }
    ```
- **Response**:
    ```json
    {
        "message": "Order created successfully."
    }
    ```

### 11. **Submit a Review for a Product**
- **URL**: `/api/reviews`
- **Method**: `POST`
- **Body**:
    ```json
    {
        "product_id": 1,
        "user_id": 1,
        "rating": 5,
        "comment": "Great product!"
    }
    ```
- **Response**:
    ```json
    {
        "message": "Review submitted successfully."
    }
    ```

### 12. **Get Categories**
- **URL**: `/api/categories`
- **Method**: `GET`
- **Response**:
    ```json
    {
        "categories": [
            { "id": 1, "name": "Electronics" },
            { "id": 2, "name": "Clothing" }
        ]
    }
    ```

### 13. **Get Notifications**
- **URL**: `/api/notifications`
- **Method**: `GET`
- **Response**:
    ```json
    {
        "notifications": [
            { "id": 1, "message": "New product available!" }
        ]
    }
    ```

### 14. **Get MySQL Status**
- **URL**: `/api/mysqlstatus`
- **Method**: `GET`
- **Response**:
    ```json
    {
        "status": "MySQL is running."
    }
    ```

## Error Responses

The API may return the following error responses:
- **404 Not Found**: Endpoint not found.
- **400 Bad Request**: Invalid request body or parameters.
- **401 Unauthorized**: Missing or invalid JWT token.

Example:
```json
{
    "message": "Unauthorized"
}

# Intelligent System for Online Store

This repository contains the code for a recommendation system and stock demand prediction for an online store. The system uses machine learning techniques, sentiment analysis, and integrates with RabbitMQ for message brokering.

## Features

- **Product Recommendation**: 
  - KNN (K-Nearest Neighbors) based recommendation.
  - Matrix Factorization (SVD) based recommendation.
- **Stock Demand Prediction**: 
  - Predicts future stock demand using Linear Regression.
- **Sentiment Analysis**: 
  - Analyzes customer reviews for sentiment (positive, negative, neutral).
- **Message Broker**: 
  - Integration with RabbitMQ to handle add, update, and delete operations for products, category, cart, checkout, users, notifications.

## Dependencies

This project uses the following Python libraries:

- `Flask`: For building the web API.
- `Flask-CORS`: To handle Cross-Origin Resource Sharing (CORS).
- `pandas`: For data manipulation and handling.
- `sklearn`: For machine learning algorithms (KNN, SVD, Linear Regression).
- `numpy`: For numerical operations.
- `textblob`: For text processing.
- `vaderSentiment`: For sentiment analysis of reviews.
- `mysql-connector`: To connect to the MySQL database.
- `pika`: For RabbitMQ integration.
- `requests`: For HTTP requests.
- `time`: For retry logic in case of MySQL downtime.

Install dependencies with:

```bash
pip install -r requirements.txt



