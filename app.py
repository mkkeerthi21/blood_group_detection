import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

from flask import Flask, render_template, request, jsonify
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.resnet50 import preprocess_input
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}
MAX_FILE_SIZE = 16 * 1024 * 1024

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

CLASS_LABELS = {0: 'A+', 1: 'A-', 2: 'AB+', 3: 'AB-', 4: 'B+', 5: 'B-', 6: 'O+', 7: 'O-'}

# LOAD MODEL - SAVEDMODEL FORMAT
# LOAD MODEL - KERAS FILE FORMAT
MODEL_PATH = 'blood_group_model.keras'

print("=" * 60)
print(f"Loading model from: {MODEL_PATH}")
print("=" * 60)

model = None

if not os.path.exists(MODEL_PATH):
    print(f"❌ ERROR: Model file '{MODEL_PATH}' not found!")
    print(f"📁 Current directory: {os.getcwd()}")
    print(f"📄 Contents: {os.listdir('.')}")
else:
    print("✅ Model file found!")
    try:
        # Load the Keras model file
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("✅ Model loaded successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        model = None


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def predict_blood_group(img_path):
    try:
        img = image.load_img(img_path, target_size=(256, 256))
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)
        
        result = model.predict(x, verbose=0)
        predicted_class = np.argmax(result, axis=1)[0]
        confidence = float(result[0][predicted_class] * 100)
        
        return {
            'success': True,
            'blood_group': CLASS_LABELS[predicted_class],
            'confidence': round(confidence, 2),
            'all_predictions': {CLASS_LABELS[i]: round(float(result[0][i] * 100), 2) for i in range(8)}
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'success': False, 'error': 'Model not loaded'}), 500
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Invalid file'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        result = predict_blood_group(filepath)
        os.remove(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

if __name__ == '__main__':
    if model is not None:
        print("\n🚀 Starting Flask application...")
        print("🌐 Open: http://localhost:5000")
        print("=" * 60 + "\n")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("\n❌ Cannot start - model not loaded!")
