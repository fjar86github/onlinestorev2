import pandas as pd
import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import TruncatedSVD
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from textblob import TextBlob

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

#ini kode bagian untuk message broker dengan rabbitmq dan erlang
import pika
import json


#ini untuk multithread
import threading
import requests

#ini agar retry terus ke restapi ketika mysql down
import time


# Konfigurasi RabbitMQ
RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'product_queue'

app = Flask(__name__)
CORS(app)  # Aktifkan CORS untuk seluruh aplikasi

# Koneksi ke database MySQL
def connect_db():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="",  # Ganti jika menggunakan password
            database="onlinestore"
        )
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

# Fungsi untuk mengambil data transaksi dari database
def get_data_from_db():
    conn = connect_db()
    if conn is None:
        return None
    query = """
    SELECT o.UserID, od.ProductID, od.Quantity, p.Name as ProductName 
    FROM orders o 
    JOIN orderdetails od ON o.OrderID = od.OrderID 
    JOIN products p ON od.ProductID = p.ProductID
    """
    # Menggunakan pandas read_sql untuk mengambil data ke dalam DataFrame
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Function to get reviews from the database
def get_reviews():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""SELECT r.*, p.Name AS ProductName 
                      FROM reviews r
                      JOIN products p ON r.ProductID = p.ProductID;""")
    reviews = cursor.fetchall()
    conn.close()
    return reviews

analyzer = SentimentIntensityAnalyzer()

# Perform sentiment analysis
def analyze_sentiment(text):
    sentiment_score = analyzer.polarity_scores(text)
    compound_score = sentiment_score['compound']
    
    # Logika untuk menangani kata yang netral seperti "oklah"
    if compound_score >= 0.05:
        return "Positive"
    elif compound_score <= -0.05:
        return "Negative"
    else:
        return "Neutral"  # Tambahkan kasus "Neutral" jika perlu

# Fungsi untuk membuat matriks perilaku pengguna-produk
def create_user_product_matrix(df):
    user_product_matrix = df.pivot_table(index='UserID', columns='ProductName', values='Quantity', aggfunc='sum', fill_value=0)
    return user_product_matrix

# Fungsi untuk model rekomendasi menggunakan KNN
def recommend_products_knn(user_id, n_neighbors=5):
    df = get_data_from_db()
    if df is None:
        return jsonify({"error": "Unable to fetch data from the database"}), 500
    user_product_matrix = create_user_product_matrix(df)
    
    if user_id not in user_product_matrix.index:
        return jsonify({"error": "User ID not found"}), 404
    
    num_samples = user_product_matrix.shape[0]
    if num_samples < n_neighbors:
        n_neighbors = num_samples  # Sesuaikan n_neighbors dengan jumlah sampel yang ada
    
    knn = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=n_neighbors)
    knn.fit(user_product_matrix.values)
    
    user_index = user_product_matrix.index.get_loc(user_id)
    distances, indices = knn.kneighbors([user_product_matrix.iloc[user_index, :].values], n_neighbors=n_neighbors)
    
    recommended_products = []
    for idx in indices[0]:
        recommended_products.append(user_product_matrix.columns[idx])
    
    return jsonify({
        "status": "success",
        "UserID": user_id,
        "Recommended Products (KNN)": recommended_products
    })

# Fungsi untuk model rekomendasi menggunakan Matrix Factorization (SVD)
def recommend_products_svd(user_id, n_components=10):
    df = get_data_from_db()
    if df is None:
        return jsonify({"error": "Unable to fetch data from the database"}), 500
    user_product_matrix = create_user_product_matrix(df)
    
    if user_id not in user_product_matrix.index:
        return jsonify({"error": "User ID not found"}), 404
    
    num_samples = user_product_matrix.shape[0]
    if num_samples < n_components:
        n_components = num_samples  # Sesuaikan n_components dengan jumlah sampel yang ada
    
    svd = TruncatedSVD(n_components=n_components)
    svd_matrix = svd.fit_transform(user_product_matrix)
    
    user_index = user_product_matrix.index.get_loc(user_id)
    user_vector = svd_matrix[user_index, :]
    
    similarity = np.dot(svd_matrix, user_vector)
    similarity_scores = list(enumerate(similarity))
    
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
    
    recommended_products = []
    for idx, score in similarity_scores[:5]:  # Top 5 rekomendasi
        recommended_products.append(user_product_matrix.columns[idx])
    
    return jsonify({
        "status": "success",
        "UserID": user_id,
        "Recommended Products (SVD)": recommended_products
    })

# Fungsi untuk mengambil data permintaan stok dari database
def get_stock_data():
    conn = connect_db()
    if conn is None:
        return None
    query = """
    SELECT od.ProductID, p.Name AS ProductName, od.Quantity, o.CreatedAt AS OrderDate
    FROM orderdetails od JOIN orders o ON od.OrderID = o.OrderID JOIN products p 
    ON od.ProductID = p.ProductID;
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Fungsi untuk mempersiapkan data untuk model
def prepare_data(df):
    df['OrderDate'] = pd.to_datetime(df['OrderDate'])
    df['Month'] = df['OrderDate'].dt.month
    df['Year'] = df['OrderDate'].dt.year
    df_grouped = df.groupby(['ProductID','ProductName', 'Year', 'Month']).agg({
        'Quantity': 'sum',
    }).reset_index()
    return df_grouped

# Model prediksi permintaan stok
def train_stock_model(df):
    X = df[['Year', 'Month']]  # Features
    y = df['Quantity']  # Target variable (quantity sold)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)  # Calculate the mean squared error
    return model, mse

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Inteliggent System Tokoonline Recommendation API!"})

@app.route('/api/recommend_knn/<int:user_id>', methods=['GET'])
def recommend_knn(user_id):
    return recommend_products_knn(user_id)

@app.route('/api/recommend_svd/<int:user_id>', methods=['GET'])
def recommend_svd(user_id):
    return recommend_products_svd(user_id)

@app.route('/api/stock_demand', methods=['POST'])
def predict_stock_demand():
    # Extract year and month from the request data
    data = request.get_json()
    year = data.get('Year')
    month = data.get('Month')
    
    # Fetch the stock data from the database
    df = get_stock_data()
    if df is None:
        return jsonify({"error": "Unable to fetch data from the database"}), 500
    
    # Prepare the data for training
    df_prepared = prepare_data(df)
    
    # Train the stock prediction model
    model, mse = train_stock_model(df_prepared)
    
    # Filter the data for the requested year and month
    df_products = df_prepared[(df_prepared['Year'] == year) & (df_prepared['Month'] == month)]

    if df_products.empty:
        return jsonify({"error": "No data available for the given year and month"}), 404

    # Prepare features for prediction
    X_new = df_products[['Year', 'Month']]
    
    # Predict demand for all products in the specified year and month
    predictions = model.predict(X_new)
    predicted_demand = [
        {
            "ProductID": product_id,
            "ProductName": product_name,
            "Predicted Demand": max(0, int(demand))
        }
        for product_id, product_name, demand in zip(
            df_products['ProductID'], df_products['ProductName'], predictions
        )
    ]
    
    return jsonify({
        "status": "success",
        "Year": year,
        "Month": month,
        "Predicted Demands": predicted_demand,
        "Model MSE": mse
    })


# API endpoint for sentiment analysis on a review
@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment_api():
    review_text = request.json.get("review_text")
    
    if not review_text:
        return jsonify({"error": "Review text is required"}), 400

    sentiment = analyze_sentiment(review_text)
    return jsonify({"sentiment": sentiment})

# API endpoint to get all reviews and their sentiment
@app.route('/get-reviews', methods=['GET'])
def get_reviews_api():
    reviews = get_reviews()
    result = []
    for review in reviews:
        # Pastikan Comment ada dalam review
        if 'Comment' in review:
            sentiment = analyze_sentiment(review['Comment'])  # Gunakan 'Comment' sebagai pengganti 'ReviewText'
            result.append({
                "ReviewID": review['ReviewID'],
                "ProductName": review['ProductName'],
                "Comment": review['Comment'],  # Ganti ReviewText dengan Comment
                "Sentiment": sentiment
            })
        else:
            result.append({
                "ReviewID": review['ReviewID'],
                "ProductName": review['ProductName'],
                "Sentiment": "No Comment"  # Perbaiki jika tidak ada Comment
            })

    return jsonify(result)

def send_to_rabbitmq(operation_type):
    """Mengirimkan data ke RabbitMQ dengan tipe operasi."""
    data = request.json
    if not data:
        return jsonify({'error': 'Invalid input, JSON body is required'}), 400

    if 'token' not in data:
        return jsonify({'error': 'Token is required'}), 400

    data['operation'] = operation_type  # Tambahkan tipe operasi ke payload

    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME)

        channel.basic_publish(exchange='', routing_key=QUEUE_NAME, body=json.dumps(data))
        connection.close()

        return jsonify({'message': f'{operation_type.capitalize()} operation sent to RabbitMQ'}), 200
    except Exception as e:
        return jsonify({'error': f'Error while sending to RabbitMQ: {str(e)}'}), 500



@app.route('/producer/add', methods=['POST'])
def producer_add():
    return send_to_rabbitmq('add')

@app.route('/producer/update', methods=['PUT'])
def producer_update():
    return send_to_rabbitmq('update')


@app.route('/producer/delete', methods=['DELETE'])
def producer_delete():
    return send_to_rabbitmq('delete')

# Consumer Function (Daemon)
def consumer_daemon():
    def callback(ch, method, properties, body):
        # Parse the received message (product data)
        try:
            product_data = json.loads(body)
            # Log the product data to know what is received
            print("Received product data:", product_data)
            
            # Panggil fungsi yang sesuai berdasarkan tipe operasi
            operation = product_data.get('operation')
            if operation == 'add':
                send_to_external_api(product_data, 'POST')
            elif operation == 'update':
                send_to_external_api(product_data, 'PUT')
            elif operation == 'delete':
                send_to_external_api(product_data, 'DELETE')
            else:
                print(f'Unknown operation: {operation}')
        
        except json.JSONDecodeError as e:
            print("Failed to decode JSON:", e)
            # Optionally, log the invalid body if it's not valid JSON
            print("Invalid message body:", body)

    # Set up the RabbitMQ connection
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    # Declare the queue if it doesn't already exist
    channel.queue_declare(queue=QUEUE_NAME)

    # Start consuming messages from the queue
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback, auto_ack=True)

    print('Consumer is running... Waiting for messages.')

    # Start processing messages
    channel.start_consuming()

def send_to_external_api(product_data, method):
    """Mengirimkan data ke API eksternal sesuai tipe operasi."""
    urladd = 'http://localhost/onlinestorev2/index.php/api/products'
    headers = {
        'Authorization': f'Bearer {product_data["token"]}',
        'Content-Type': 'application/json',
    }

    max_retries = 360 #setengah jam waktu untuk meretry antrian hingga dapat diproses ke restapi database
    retry_delay = 5
    retries = 0

    while retries < max_retries:
        try:
            if method == 'POST':
                product_infoadd = {
        'name': product_data['products'][0]['name'],
        'description': product_data['products'][0]['description'],
        'price': product_data['products'][0]['price'],
        'stock': product_data['products'][0]['stock'],
        'category_id': product_data['products'][0].get('category_id', 1),
        'image': product_data['products'][0]['image'],
    }
                response = requests.post(urladd, headers=headers, json=product_infoadd)
            elif method == 'PUT':
                product_infoupdate = {
                    'id': product_data['products'][0]['id'],
                    'name': product_data['products'][0]['name'],
                    'description': product_data['products'][0]['description'],
                    'price': product_data['products'][0]['price'],
                    'stock': product_data['products'][0]['stock'],
                    'category_id': product_data['products'][0].get('category_id', 1),
                    'image': product_data['products'][0]['image'],
                }
                urlupdatedelete = f'http://localhost/onlinestorev2/index.php/api/products/{product_infoupdate["id"]}'
                response = requests.put(urlupdatedelete, headers=headers, json=product_infoupdate)
            elif method == 'DELETE':
                product_infodelete = {'id': product_data['products'][0]['id']}  # Ambil ID dari 'products'
                urlupdatedelete = f'http://localhost/onlinestorev2/index.php/api/products/{product_infodelete["id"]}'
                response = requests.delete(urlupdatedelete, headers=headers, json=product_infodelete)
                print(f"Token: {product_data['token']}")
                print(f"DELETE URL: {urlupdatedelete}")
            else:
                print(f'Unknown HTTP method: {method}')
                return

            # Periksa apakah respons kosong
            if not response.text.strip():
                print(f'Warning: Empty response for {method} request.')
                break  # Anggap berhasil, karena kemungkinan API memproses data

            # Proses respons JSON
            response_data = response.json()
            success_messages = [
                "Product added successfully",
                "Product updated successfully",
                "Product deleted successfully"
            ]

            if response.status_code == 200 or response_data.get('message') in success_messages:
                print(f'{method} operation successful: {response_data}')
                break
            else:
                print(f'{method} operation failed: {response_data}')
                retries += 1
                print(f'Retrying in {retry_delay} seconds... (Attempt {retries}/{max_retries})')
                time.sleep(retry_delay)
        
        except ValueError as ve:
            print(f'Error decoding JSON for {method} request: {ve}')
            retries += 1
            print(f'Retrying in {retry_delay} seconds... (Attempt {retries}/{max_retries})')
            time.sleep(retry_delay)
        except requests.RequestException as e:
            print(f'Error during {method} request: {e}')
            retries += 1
            print(f'Retrying in {retry_delay} seconds... (Attempt {retries}/{max_retries})')
            time.sleep(retry_delay)

    if retries == max_retries:
        print(f'Max retries reached. Could not complete {method} operation.')



# Run the Flask app and RabbitMQ consumer concurrently in different threads
def run_flask():
    app.run(debug=True, use_reloader=False)

def run_rabbitmq():
     consumer_daemon()

if __name__ == '__main__':
    import threading
    flask_thread = threading.Thread(target=run_flask)
    rabbitmq_thread = threading.Thread(target=run_rabbitmq, daemon=True)

    flask_thread.start()
    rabbitmq_thread.start()

    flask_thread.join()
  