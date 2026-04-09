
#VIET College Chatbot - Flask Backend

from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
import math

app = Flask(__name__)

#Load knowledge base
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

with open(os.path.join(DATA_DIR, "knowledge_base.json"), "r", encoding="utf-8") as f:
    KNOWLEDGE_BASE = json.load(f)

with open(os.path.join(DATA_DIR, "fallback.json"), "r", encoding="utf-8") as f:
    FALLBACK_RESPONSES = json.load(f)

#Synonyms
SYNONYM_MAP = {
    "admission": ["admision","admissions","admisison","addmission","joining","enroll","enrollment","enrolment","entry","apply","application","registration","register","join","intake","seat","seats","eligibility"],
    "eamcet": ["eamset","eamkt","ap eamcet","entrance","apeamcet","entrance exam","qualifying exam"],
    "counselling": ["counseling","counsling","councelling","web counselling","allotment","college allotment"],
    "fee": ["fees","fess","feees","cost","amount","payment","charge","tuition","tution","annual fee","semester fee","how much","price","rate"],
    "hostel": ["hostil","hostle","hostels","accommodation","dormitory","room","stay","quarters","pg","housing","lodge","residence","boys hostel","girls hostel","ladies hostel"],
    "placement": ["placements","placment","job","jobs","career","recruit","recruitment","company","companies","salary","package","ctc","lpa","hire","hiring","campus placement","campus drive","off campus","employ","employment"],
    "courses": ["course","program","programs","branch","branches","department","departments","subject","stream","degree","btech","b.tech","mtech","m.tech","mba","mca","what courses","which course","available courses"],
    "cse": ["computer science","cs","computers","computer","coding","aiml","data science","cybersceurity","cybersecurity","programming"],
    "ece": ["electronics","communication","ec","electronic"],
    "eee": ["electrical","power","ee","electric"],
    "mechanical": ["mech","me","machines"],
    "civil": ["construction","ce","structural"],
    "mca": ["MCA","Computerapplication","computerapplications"],
    "mba": ["mba","hr"],
    "scholarship": ["scholarships","scolarship","scholorship","schlarship","aid","waiver","financial aid","financial help","free","discount","stipend","fee reimbursement","government scholarship","jagananna","vidya deevena"],
    "contact": ["phone","number","contact number","address","location","email","reach","office","helpline","call","where","how to reach","direction","map","situated"],
    "exam": ["exams","examination","examinations","test","result","results","marks","grade","semester","semister","hall ticket","jntuk","internal","external","mid","mids","end sem","backlog","supply"],
    "facility": ["facilities","infrastructure","labs","lab","laboratory","library","canteen","mess","food","sports","gym","gymnasium","wifi","wi-fi","internet","campus","medical","transport","bus"],
    "lateral": ["lateral entry","lateral admission","diploma","ecet","ap ecet","second year","direct admission","2nd year","polytechnic"],
    "club": ["clubs","activities","activity","events","event","fest","festival","cultural","technical","nss","ncc","symposium","hackathon","coding competition","sports","extracurricular"],
    "about": ["history","established","founded","information","details","overview","viet","college","institute","university","affiliation","affiliated","jntuk","aicte","naac","accreditation","ranking"],
    "principal": ["hod","head","director","management","staff","faculty","professor","lecturer","teacher"],
    "library": ["books","e-library","digital library","journal","reading room","reading hall"],
    "transport": ["bus","buses","vehicle","commute","route","pickup","drop"],
    "narava": ["narva","narava","vizag","visakhapatnam","vishakhapatnam","vishakapatnam"],
}

conversation_memory = {}

#Build reverse lookup
ALIAS_TO_CANONICAL = {}
for canonical, aliases in SYNONYM_MAP.items():
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = canonical


#Helper functions
def levenshtein(a, b):
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    matrix = [[0] * (len(a) + 1) for _ in range(len(b) + 1)]
    for i in range(len(b) + 1):
        matrix[i][0] = i
    for j in range(len(a) + 1):
        matrix[0][j] = j
    for i in range(1, len(b) + 1):
        for j in range(1, len(a) + 1):
            if b[i - 1] == a[j - 1]:
                matrix[i][j] = matrix[i - 1][j - 1]
            else:
                matrix[i][j] = min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1,
                )
    return matrix[len(b)][len(a)]


def fuzzy_match(query, target, threshold=2):
    if len(target) < 3:
        return query == target
    if abs(len(query) - len(target)) > threshold + 1:
        return False
    return levenshtein(query, target) <= threshold


def tokenize(text):
    import re
    return [t for t in re.sub(r'[।,.!?;:\'"()\[\]{}]', " ", text.lower()).split() if len(t) > 1]


def expand_tokens(tokens):
    expanded = set(tokens)
    for token in tokens:
        canonical = ALIAS_TO_CANONICAL.get(token)
        if canonical:
            expanded.add(canonical)
        for alias, can in ALIAS_TO_CANONICAL.items():
            if fuzzy_match(token, alias, 2 if len(token) > 6 else 1):
                expanded.add(can)
                expanded.add(alias)
        for canon in SYNONYM_MAP.keys():
            if fuzzy_match(token, canon, 1):
                expanded.add(canon)
    return list(expanded)


def score_chunk(raw_query, chunk):
    raw_tokens = tokenize(raw_query)
    query_tokens = expand_tokens(raw_tokens)

    keyword_text = " ".join(chunk["keywords"])
    doc_text = (chunk["en"] + " " + chunk.get("te", "") + " " + keyword_text + " " + chunk["category"]).lower()
    doc_tokens = tokenize(doc_text)

    score = 0
    for q_token in query_tokens:
        exact_kw = any(
            kw.lower() == q_token or kw.lower() in q_token or q_token in kw.lower()
            for kw in chunk["keywords"]
        )
        if exact_kw:
            score += 4

        fuzzy_kw = any(
            fuzzy_match(q_token, kw.lower(), 2 if len(q_token) > 5 else 1)
            for kw in chunk["keywords"]
        )
        if fuzzy_kw and not exact_kw:
            score += 2

        cat = chunk["category"].lower()
        if cat in q_token or fuzzy_match(q_token, cat, 1):
            score += 3

        freq = sum(
            1 for t in doc_tokens
            if t in q_token or q_token in t or fuzzy_match(q_token, t, 1)
        )
        score += freq * 0.4

    query_lower = raw_query.lower()
    combined_keywords = keyword_text.lower()
    if combined_keywords in query_lower or query_lower in combined_keywords or query_lower in doc_text:
        score += 6
    if chunk["category"].lower() in query_lower:
        score += 4

    for i in range(len(raw_tokens) - 1):
        bigram = raw_tokens[i] + " " + raw_tokens[i + 1]
        if bigram in combined_keywords or bigram in chunk["category"]:
            score += 3

    return score


def detect_language(text):
    telugu_chars = sum(1 for c in text if '\u0C00' <= c <= '\u0C7F')
    hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    if telugu_chars > 2:
        return "te"
    if hindi_chars > 2:
        return "hi"
    return "en"


def rag_query(user_query, preferred_lang="en"):
    if not user_query.strip():
        return {
            "response": FALLBACK_RESPONSES[preferred_lang],
            "category": "unknown",
            "confidence": 0,
            "detectedLang": preferred_lang,
        }

    detected_lang = detect_language(user_query)
    if detected_lang == "en":
        detected_lang = preferred_lang

    #Explicit greeting detection for short greeting messages
    GREETING_WORDS = {
        "hi", "hii", "hiii", "hello", "hey", "heey", "heeyy", "heeyyy",
        "namaste", "good morning", "good afternoon", "good evening",
        "start", "help", "what can you do", "what do you know",
        "నమస్కారం", "హలో", "నమస్తే", "సహాయం",
        "नमस्ते", "नमस्कार", "हैलो", "सहायता"
    }
    query_lower = user_query.strip().lower()
    if query_lower in GREETING_WORDS:
        greeting_chunk = next((c for c in KNOWLEDGE_BASE if c["category"] == "greeting"), None)
        if greeting_chunk:
            return {
                "response": greeting_chunk[detected_lang],
                "category": "greeting",
                "confidence": 100,
                "detectedLang": detected_lang,
            }


    scored = [{"chunk": c, "score": score_chunk(user_query, c)} for c in KNOWLEDGE_BASE]
    scored.sort(key=lambda x: x["score"], reverse=True)

    best = scored[0]
    second_best = scored[1] if len(scored) > 1 else None

    if best["score"] < 0.5:
        return {
            "response": FALLBACK_RESPONSES[detected_lang],
            "category": "unknown",
            "confidence": 0,
            "detectedLang": detected_lang,
        }

    response = best["chunk"][detected_lang]

    if (second_best and
        second_best["score"] >= best["score"] * 0.75 and
        second_best["score"] > 3 and
        second_best["chunk"]["id"] != best["chunk"]["id"]):

        divider = (
            "\n\n---\n\n**సంబంధిత సమాచారం:**\n"
            if detected_lang == "te"
            else "\n\n---\n\n**Related Information:**\n"
        )
        second_lines = "\n".join(second_best["chunk"][detected_lang].split("\n")[:6])
        response += divider + second_lines

    confidence = min(100, round((best["score"] / 18) * 100))

    return {
        "response": response,
        "category": best["chunk"]["category"],
        "confidence": confidence,
        "detectedLang": detected_lang,
    }


def generate_ocr_response(ocr_text, lang):
    # Always show extracted text first
    truncated = ocr_text[:800] + ('...' if len(ocr_text) > 800 else '')
    if lang == "te":
        response = f"📄 **OCR ద్వారా వెలికితీసిన వచనం:**\n```\n{truncated}\n```"
    elif lang == "hi":
        response = f"📄 **OCR द्वारा निकाला गया पाठ:**\n```\n{truncated}\n```"
    else:
        response = f"📄 **Text extracted via OCR:**\n```\n{truncated}\n```"

    # Try to find relevant college info to append
    result = rag_query(ocr_text, lang)
    if result["confidence"] >= 15:
        if lang == "te":
            response += f"\n\n---\n\n🔍 **సంబంధిత సమాచారం:**\n\n{result['response']}"
        elif lang == "hi":
            response += f"\n\n---\n\n🔍 **संबंधित जानकारी:**\n\n{result['response']}"
        else:
            response += f"\n\n---\n\n🔍 **Related Information:**\n\n{result['response']}"

    return {"response": response, "category": "ocr", "confidence": result["confidence"], "detectedLang": lang}


#Routes
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_query = data.get("message", "").strip()
    lang = data.get("lang", "en")

    if not user_query:
        return jsonify({"error": "Empty message"}), 400

    result = rag_query(user_query, lang)
    return jsonify(result)


@app.route("/api/ocr-response", methods=["POST"])
def ocr_response():
    data = request.get_json()
    ocr_text = data.get("text", "").strip()
    lang = data.get("lang", "en")

    if not ocr_text:
        return jsonify({"error": "Empty OCR text"}), 400

    result = generate_ocr_response(ocr_text, lang)
    return jsonify(result)


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)