from flask import Flask, render_template, request, jsonify
import os
import fitz  # PyMuPDF
import nltk

from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
nltk.download("punkt")
nltk.download("punkt_tab")
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

# -------------------------------
# Upload Folder
# -------------------------------
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# -------------------------------
# Home Page
# -------------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -------------------------------
# Upload PDF
# -------------------------------
@app.route("/upload", methods=["POST"])
def upload():

    if "pdf" not in request.files:
        return jsonify({
            "success": False,
            "message": "No PDF uploaded."
        })

    file = request.files["pdf"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "Please choose a PDF."
        })

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    text = ""

    try:

        pdf = fitz.open(filepath)

        page_count = pdf.page_count

        for page in pdf:
            text += page.get_text("text")

        pdf.close()

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        })

    if not text.strip():
        text = "No readable text found."

    word_count = len(text.split())
    character_count = len(text)

    return jsonify({
        "success": True,
        "filename": file.filename,
        "pages": page_count,
        "words": word_count,
        "characters": character_count,
        "text": text
    })


# -------------------------------
# Ping Route
# -------------------------------
@app.route("/ping")
def ping():
    return jsonify({"status": "OK"})


# -------------------------------
# Generate Summary
# -------------------------------
@app.route("/summary", methods=["POST"])
def summary():

    data = request.get_json()
    text = data.get("text", "")

    if len(text.strip()) == 0:
        return jsonify({
            "summary": "No text found."
        })

    parser = PlaintextParser.from_string(
        text,
        Tokenizer("english")
    )

    summarizer = LsaSummarizer()

    sentences = summarizer(parser.document, 5)

    summary = " ".join(str(sentence) for sentence in sentences)

    return jsonify({
        "summary": summary
    })


# -------------------------------
# Generate Quiz
# -------------------------------
@app.route("/quiz", methods=["POST"])
def quiz():

    data = request.get_json()

    text = data.get("text", "")

    if not text.strip():
        return jsonify({
            "quiz": []
        })

    words = list(dict.fromkeys(text.split()))

    quiz = []

    for word in words[:10]:

        quiz.append({

            "question": f"What is the meaning of '{word}' according to your notes?",

            "options": [

                word,
                "None of the above",
                "Not mentioned",
                "Unknown"

            ],

            "answer": word

        })

    return jsonify({
        "quiz": quiz
    })


# -------------------------------
# Run Flask
# -------------------------------
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )