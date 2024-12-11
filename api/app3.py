from flask import Flask, jsonify, request
from flask_cors import CORS

# ini kode bagian untuk message broker dengan rabbitmq dan erlang
import pika
import json

# ini untuk multithread
import threading
import requests

# ini agar retry terus ke restapi ketika mysql down
import time

# Konfigurasi RabbitMQ
RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'cart_queue'

app = Flask(__name__)
CORS(app)  # Aktifkan CORS untuk seluruh aplikasi

@app.route('/')
def home():
    return jsonify({"message": "Selamat Datang Di Sistem Antrian Tambah Keranjang"})

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
            cart_data = json.loads(body)
            # Log the product data to know what is received
            print("Received Cart data:", cart_data)
            
            # Panggil fungsi yang sesuai berdasarkan tipe operasi
            operation = cart_data.get('operation')
            if operation == 'add':
                send_to_external_api(cart_data, 'POST')
            elif operation == 'update':
                send_to_external_api(cart_data, 'PUT')
            elif operation == 'delete':
                send_to_external_api(cart_data, 'DELETE')
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

def send_to_external_api(cart_data, method):
    """Mengirimkan data ke API eksternal sesuai tipe operasi."""
    urladd = 'http://localhost/onlinestorev2/index.php/api/cart'
    headers = {
        'Authorization': f'Bearer {cart_data["token"]}',
        'Content-Type': 'application/json',
    }

    max_retries = 360  # setengah jam waktu untuk meretry antrian hingga dapat diproses ke restapi database
    retry_delay = 5
    retries = 0

    while retries < max_retries:
        try:
            if method == 'POST':
                cart_data_infoadd = {
                    'product_id': cart_data['cart'][0]['product_id'],
                    'quantity': cart_data['cart'][0]['quantity'],
                }
                response = requests.post(urladd, headers=headers, json=cart_data_infoadd)
            elif method == 'PUT':
                cart_data_infoupdate = {
                    'id': cart_data['cart'][0]['id'],
                    'name': cart_data['cart'][0]['name'],
                    'quantity': cart_data['cart'][0]['quantity'],
                }
                urlupdatedelete = f'http://localhost/onlinestorev2/index.php/api/cart/{cart_data_infoupdate["id"]}'
                response = requests.put(urlupdatedelete, headers=headers, json=cart_data_infoupdate)
            elif method == 'DELETE':
                cart_data_infodelete = {'id': cart_data['cart'][0]['id']}  # Ambil ID dari 'category'
                urlupdatedelete = f'http://localhost/onlinestorev2/index.php/api/cart/{cart_data_infodelete["id"]}'
                response = requests.delete(urlupdatedelete, headers=headers, json=cart_data_infodelete)
                print(f"Token: {cart_data['token']}")
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
                "Item added to cart",
                "Item quantity updated",
                "Item removed from cart"
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

if __name__ == "__main__":
    # Menjalankan consumer di thread terpisah
    consumer_thread = threading.Thread(target=consumer_daemon)
    consumer_thread.daemon = True
    consumer_thread.start()

    # Menjalankan Flask app pada port 5001
    app.run(debug=True, host='0.0.0.0', port=5002)
