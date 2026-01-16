# AI-Powered-skin-Disease-Analyzer

> A small web app that uses a custom YOLO classifier to predict skin conditions from an uploaded photo and Google Gemini to generate a patient-friendly explanation. This repository contains the web UI, server, training notebook, and model weights placeholder.

**Project layout**
- `app.py`: Flask server that serves the site and exposes the `/analyze` endpoint.
- `index.html`: Frontend UI for uploading images and displaying results.
- `styles.css`: External stylesheet for UI styling.
- `script.js`: Frontend JavaScript handling uploads, preview, and calls to `/analyze`.
- `modal_trainnig.ipynb`: Colab-oriented notebook used to download data and train a YOLOv8 classifier.
- `best.pt`: (not checked in) Trained model weights expected by `app.py`.

## Quick Start

1. Create and activate a Python virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install required packages:

```bash
pip install -U pip
pip install ultralytics google-generativeai pillow flask
```

3. Update your Gemini API key inside `app.py`:

- Open `app.py` and replace the placeholder in `genai.configure(api_key="...")` with your real Google Gemini API key. Keep this key secret.

4. Ensure you have the trained weights available as `best.pt` in the project root. If you trained the model using the notebook, download `best.pt` and move it here.

5. Run the server:

```bash
python app.py
```

Open `http://localhost:5000` in your browser.

## API Endpoints
- `GET /` — Serves the web UI (`index.html`).
- `GET /styles.css` — Serves stylesheet.
- `GET /script.js` — Serves frontend JavaScript.
- `POST /analyze` — Accepts multipart form `image` and returns JSON:

Response format (success):

```json
{
  "disease": "Psoriasis",
  "confidence": 0.469,
  "explanation": "(text from Gemini)"
}
```

If no `image` is provided, the endpoint returns a `400` error JSON.

### Example (curl)

```bash
curl -X POST -F "image=@/path/to/photo.jpg" http://localhost:5000/analyze
```

## Training (Notebook)
- Use `modal_trainnig.ipynb` (originally designed for Google Colab) to download the dataset, prepare `train`/`val` folders and train a YOLOv8 classification model.
- Key steps in the notebook:
  - Install dependencies & download the dataset from Kaggle.
  - Normalize folder names to YOLO's expected `train`/`val` structure.
  - Train using `yolov8m-cls.pt` (medium classification model) with `model.train(...)`.
  - Download `best.pt` from Colab to local machine and copy it into this repo root.

Notes:
- The notebook assumes a Colab environment (`/content`). If running locally, adapt paths accordingly.

## Model & Gemini Notes
- `app.py` loads the classifier via `YOLO('best.pt')`. Ensure `best.pt` is present.
- Replace the Gemini API key in `app.py` before running; otherwise the Gemini explanation step will fail.
- The application uses Gemini to generate a patient-friendly explanation — this text is not a medical diagnosis. The app includes a disclaimer in the UI; do not use this for clinical decisions.

## Troubleshooting
- Error: `ModuleNotFoundError` — install missing packages listed above.
- Error: `FileNotFoundError: best.pt` — ensure you copied the trained weights into the project root with that filename.
- Gemini errors — confirm the API key is valid and that your Google Cloud project has access to the Generative AI API.
- YOLO inference issues — verify the model type (classification) and that `best.pt` was trained as a classification model.


