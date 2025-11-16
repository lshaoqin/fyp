from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import vision
import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Google Cloud Vision client
client = vision.ImageAnnotatorClient()

def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image using Google Cloud Vision."""
    try:
        with open(file_path, 'rb') as image_file:
            content = image_file.read()
        
        image = vision.Image(content=content)
        response = client.document_text_detection(image=image)
        
        # Get the full text from the first annotation
        text = response.text if response.text_annotations else ''
        
        return text
    except Exception as e:
        raise Exception(f"Error extracting text: {str(e)}")

@app.route('/extract', methods=['POST'])
def extract():
    """Handle file upload and extract text from image."""
    try:
        # Check if file is in the request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Save file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            # Extract text from image
            text = extract_text_from_image(tmp_path)
            return jsonify({"text": text}), 200
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_path)
            except:
                pass
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
