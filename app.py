import os
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import pubsub_v1

app = Flask(__name__)
CORS(app) # Enable CORS for all routes so the React UI can communicate with this API

# Determine the role of this instance from environment variables
SERVICE_NAME = os.environ.get('SERVICE_NAME', 'unknown')
PROJECT_ID = os.environ.get('PROJECT_ID', '')
TOPIC_ID = os.environ.get('TOPIC_ID', 'order-placed')

# Initialize Publisher client only if this is the order service
publisher = pubsub_v1.PublisherClient() if SERVICE_NAME == 'order' else None

@app.route('/place-order', methods=['POST'])
def place_order():
    """Endpoint for the Order Service to publish events."""
    if SERVICE_NAME != 'order':
        return jsonify({"error": "This endpoint is only available on the order service."}), 400
    
    data = request.json
    if not data:
        return jsonify({"error": "No JSON payload provided."}), 400

    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
    
    # Convert payload to bytes and publish
    data_bytes = json.dumps(data).encode("utf-8")
    future = publisher.publish(topic_path, data_bytes)
    message_id = future.result()
    
    print(f"[ORDER SERVICE] Published OrderPlaced event. Message ID: {message_id}")
    return jsonify({"message": "Order placed successfully", "message_id": message_id}), 200

@app.route('/process', methods=['POST'])
def process_message():
    """Endpoint for downstream services (Inventory, Billing, Shipping) to receive push messages."""
    if SERVICE_NAME not in ['inventory', 'billing', 'shipping']:
        return jsonify({"error": "Not a valid subscriber service."}), 400
    
    envelope = request.get_json()
    if not envelope or 'message' not in envelope:
        return jsonify({"error": "Invalid Pub/Sub message format."}), 400
    
    pubsub_message = envelope['message']
    
    try:
        # Decode the base64 payload
        decoded_data = base64.b64decode(pubsub_message['data']).decode('utf-8')
        payload = json.loads(decoded_data)
        
        print(f"[{SERVICE_NAME.upper()}] Received event: {payload}")
        
        # ==========================================
        # DLQ TESTING LOGIC
        # If the payload contains a flag to fail this specific service, 
        # we return a 500 error to trigger the retry policy and eventually the DLQ.
        # ==========================================
        fail_key = f"fail_{SERVICE_NAME}"
        if payload.get(fail_key) is True:
            print(f"[{SERVICE_NAME.upper()}] Simulating failure! Returning 500. Pub/Sub will retry.")
            return "Simulated processing failure", 500
            
        # Normal processing logic would go here
        print(f"[{SERVICE_NAME.upper()}] Successfully processed order.")
        return "OK", 200
        
    except Exception as e:
        print(f"[{SERVICE_NAME.upper()}] Error processing message: {e}")
        return "Internal Error", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
