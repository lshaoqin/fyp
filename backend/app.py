from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import vision
import google.genai as genai
import os
import tempfile
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Google Cloud Vision client
client = vision.ImageAnnotatorClient()

gemini_model = "gemini-2.5-flash-lite"
genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def format_text_with_gemini(raw_text: str) -> str:
    """Use Gemini to correct inaccuracies and format text for readability.
    
    Args:
        raw_text: Raw OCR text to be corrected and formatted.
        
    Returns:
        Formatted and corrected text.
    """
    try:
        prompt = f"""You are a text formatting expert. Please take the following OCR-extracted text and:

1. Correct any OCR inaccuracies or misspellings
2. Remove hyphens that result from words being split across lines (e.g., "hap-pened" -> "happened")
3. Add paragraph breaks where appropriate for readability and logical grouping
4. Bold section titles or headings using **text** format
5. Preserve the overall structure and meaning of the original text

Original OCR text:
{raw_text}

Please provide the corrected, formatted text only. Do not add any explanations or metadata."""

        response = genai_client.models.generate_content(
    model="gemini-2.5-flash-lite", contents=prompt
)
        return response.text.strip()
    except Exception as e:
        # If Gemini fails, return original text
        print(f"Warning: Gemini formatting failed: {str(e)}")
        return raw_text


def get_document_blocks(image_file_path: str) -> dict:
    """Extract text blocks with bounding boxes from document using Vision API structure.
    
    Args:
        image_file_path: path to the image file.
        
    Returns:
        Dictionary with full_text and blocks containing text and vertices.
    """
    with open(image_file_path, 'rb') as image_file:
        content = image_file.read()
    
    image = vision.Image(content=content)
    response = client.document_text_detection(image=image)
    
    blocks = []
    full_text = response.full_text_annotation.text if response.full_text_annotation else ''
    
    if response.full_text_annotation:
        document = response.full_text_annotation
        
        # Extract blocks from the document structure
        for page in document.pages:
            for block in page.blocks:
                # Get text from all paragraphs in this block
                block_text = ''
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        for symbol in word.symbols:
                            block_text += symbol.text
                        block_text += ' '
                    block_text += '\n'
                
                block_text = block_text.strip()
                
                # Get bounding box vertices
                if block.bounding_box and block_text:
                    # Format the block text using Gemini
                    formatted_text = format_text_with_gemini(block_text)
                    
                    vertices = []
                    for vertex in block.bounding_box.vertices:
                        vertices.append({'x': vertex.x, 'y': vertex.y})
                    
                    blocks.append({
                        'text': formatted_text,
                        'vertices': vertices
                    })
    
    # Also format the full text
    formatted_full_text = format_text_with_gemini(full_text) if full_text else ''
    
    return {
        'full_text': formatted_full_text,
        'blocks': blocks
    }


def extract_text_with_boxes(file_path: str) -> dict:
    """Extract text and bounding boxes from an image using Google Cloud Vision."""
    try:
        # Read the image for base64 encoding
        with open(file_path, 'rb') as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Get document blocks
        result = get_document_blocks(file_path)
        
        return {
            'full_text': result['full_text'],
            'blocks': result['blocks'],
            'image_base64': image_base64
        }
    except Exception as e:
        raise Exception(f"Error extracting text: {str(e)}")


@app.route('/extract', methods=['POST'])
def extract():
    """Handle file upload and extract text with bounding boxes from image."""
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
            # Extract text and bounding boxes from image
            result = extract_text_with_boxes(tmp_path)
            return jsonify(result), 200
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
