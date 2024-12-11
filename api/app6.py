from flask import Flask, jsonify, request
from flask_cors import CORS

# Ini kode bagian untuk message broker dengan RabbitMQ dan Erlang
import pika
import json

# Ini untuk multithread
import threading
import requests

# Ini agar retry terus ke REST API ketika MySQL down
import time

# Konfigurasi RabbitMQ
RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'notif_queue'

app = Flask(__name__)
CORS(app)  # Aktifkan CORS untuk seluruh aplikasi

@app.route('/')
def home():
    return jsonify({"message": "Selamat Datang Di Sistem Antrian Notifikasi"})

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
            notif_data = json.loads(body)
            print("Received notifications data:", notif_data)

            # Panggil fungsi yang sesuai berdasarkan tipe operasi
            operation = notif_data.get('operation')
            if operation == 'add':
                send_to_external_api(notif_data, 'POST')
            elif operation == 'update':
                send_to_external_api(notif_data, 'PUT')
            elif operation == 'delete':
                send_to_external_api(notif_data, 'DELETE')
            else:
                print(f'Unknown operation: {operation}')
        
        except json.JSONDecodeError as e:
            print("Failed to decode JSON:", e)
            print("Invalid message body:", body)

    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback, auto_ack=True)

    print('Consumer is running... Waiting for messages.')
    channel.start_consuming()

def send_to_external_api(notif_data, method):
    """Mengirimkan data ke API eksternal sesuai tipe operasi."""
    urlnotif = 'http://localhost/onlinestorev2/index.php/api/notifications'
    headers2 = {
        'Authorization': f'Bearer {notif_data["token"]}',
        'Content-Type': 'application/json',
    }

    max_retries = 360
    retry_delay = 5
    retries = 0

    while retries < max_retries:
        try:
            if method == 'POST':
                notif_data_infoadd = {
                    'userId': notif_data['notifications'][0]['userId'],
                    'token': notif_data['notifications'][0]['token2'],
                    'message': notif_data['notifications'][0]['message'],
                    'type': notif_data['notifications'][0]['type']
                }
                response = requests.post(urlnotif, headers=headers2, json=notif_data_infoadd)

            elif method == 'PUT':
                notifid = notif_data['notifications'][0]['notifid']  # Ambil 'id' dari elemen pertama
                urladd = f'http://localhost/onlinestorev2/index.php/api/notifications/{notifid}'
                headers = {
                    'Authorization': f'Bearer {notif_data["token"]}',
                    'Content-Type': 'application/json',
                }
                notif_data_infoadd = {
                    'userId': notif_data['notifications'][0]['userId'],
                    'token': notif_data['notifications'][0]['token2'],
                    'message': notif_data['notifications'][0]['message'],
                    'type': notif_data['notifications'][0]['type']
                }
                response = requests.put(urladd, headers=headers, json=notif_data_infoadd)

            elif method == 'DELETE':
                notifid = notif_data['notifications'][0]['notifid']  # Ambil 'id' dari elemen pertama
                urladd = f'http://localhost/onlinestorev2/index.php/api/notifications/{notifid}'
                headers = {
                    'Authorization': f'Bearer {notif_data["token"]}',
                    'Content-Type': 'application/json',
                }
                response = requests.delete(urladd, headers=headers)
                print(f"Token: {notif_data['token']}")
                print(f"DELETE URL: {urladd}")

            else:
                print(f'Unknown HTTP method: {method}')
                return

            if not response.text.strip():
                print(f'Warning: Empty response for {method} request.')
                break

            response_data = response.json()
            success_messages = ["Notification created","Notification updated","Notification deleted"]

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
    consumer_thread = threading.Thread(target=consumer_daemon)
    consumer_thread.daemon = True
    consumer_thread.start()

    app.run(debug=True, host='0.0.0.0', port=5005)