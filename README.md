#VIET College Chatbot – Developer Setup

Visakha Institute of Engineering & Technology  
Offline Multilingual Chatbot (English + Telugu)

---

#Project Structure

```
BhashaRAG/
├── app.py                     ← Flask backend (Python)
├── requirements.txt
├── data/
│   ├── knowledge_base.json    ← RAG knowledge entries
│   └── fallback.json          ← Fallback responses
├── templates/
│   └── index.html             ← Main HTML page
└── static/
    ├── css/
    │   └── styles.css         ← All styling
    ├── js/
    │   ├── app.js             ← Main app logic & state
    │   ├── chat.js            ← Message rendering & markdown
    │   └── ocr.js             ← OCR panel UI & Tesseract
    └── images/
        └── viet-logo.png      ← College logo
```

---

#Setup & Run

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

#2. Run the server

```bash
python app.py
```

#3. Open in browser

```
http://localhost:5000
```

---

#Features

- RAG (Retrieval-Augmented Generation) with fuzzy matching
- Bilingual: English + Telugu + Hindi
- OCR scanning via Tesseract.js (browser-side)
- Voice input (Web Speech API)
- Fully offline – no external AI API needed
- VIET logo as header + chat background watermark

---

## API Endpoints

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| GET    | `/`                 | Serves the chatbot UI     |
| POST   | `/api/chat`         | Query the RAG engine      |
| POST   | `/api/ocr-response` | Get response for OCR text |

### POST /api/chat

```json
{ "message": "What courses are offered?", "lang": "en" }
```

Response:

```json
{
  "response": "...",
  "category": "courses",
  "confidence": 82,
  "detectedLang": "en"
}
```
