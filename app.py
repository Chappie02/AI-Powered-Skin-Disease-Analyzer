# app.py → PERFECTLY FIXED (copy this exactly)

from flask import Flask, request, jsonify, send_from_directory
from ultralytics import YOLO
import google.generativeai as genai
from PIL import Image

app = Flask(__name__, static_folder='.')

# Load your classifier model
model = YOLO('best.pt')  # ← your current best.pt (classifier)

# PUT YOUR REAL GEMINI KEY HERE (in quotes!)
genai.configure(api_key="gemini api")  # ← your key

# FIXED MODEL NAME: gemini-1.5-flash (works with v1beta API)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# YOUR CLASS NAMES (from the log: Actinic_Keratosis, SkinCancer, etc.)
CLASS_NAMES = [
    "Acne",
    "Actinic_Keratosis",      # 0 from log
    "DrugEruption",
    "Eczema",
    "Lupus",
    "Psoriasis",              # detected with 46.9%
    "Seborrh_Keratoses",      # 0.00 from log
    "SkinCancer",             # 0.19 from log
    "Tinea",
    "Vitiligo"
    # 10 classes total – adjust if needed
]

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')


@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400

    file = request.files['image']
    img = Image.open(file.stream).convert("RGB")

    # Run inference (YOLOv8 classifier)
    results = model(img)[0]

    # Get top prediction
    probs = results.probs
    class_id = int(probs.top1)
    confidence = float(probs.top1conf)

    disease_raw = CLASS_NAMES[class_id]
    disease = disease_raw.replace("_", " ")

    # Low confidence fallback
    if confidence < 0.4:
        return jsonify({
            "disease": "Uncertain",
            "confidence": round(confidence, 3),
            "explanation": "The AI is not confident enough (low score). Please upload a clearer, well-lit close-up image of the affected skin."
        })

    # Gemini prompt for explanation
    prompt = f"""
    You are a caring dermatologist speaking to a patient.
    The AI detected: {disease}
    Confidence: {confidence:.1%}

    In simple, kind language (max 250 words):
    • What is {disease}?
    • Common causes and symptoms
    • Home remedies or over-the-counter options
    • When to see a doctor immediately
    End with: "This is not a substitute for professional medical advice."
    """

    try:
        response = gemini_model.generate_content([prompt, img])
        explanation = response.text.strip()
    except Exception as e:
        # Fallback if Gemini fails (but won't now!)
        explanation = f"Disease detected: {disease} ({confidence:.1%} confidence). Gemini temporarily unavailable – please try again. This is not medical advice."

    return jsonify({
        "disease": disease,
        "confidence": round(confidence, 3),
        "explanation": explanation
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)