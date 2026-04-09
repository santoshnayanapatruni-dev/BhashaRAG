/**
 * app.js – Main application logic
 * VIET College Chatbot
 * Visakha Institute of Engineering & Technology
 */

/*Config*/
const COLLEGE_NAME    = 'Visakha Institute of Engineering & Technology';
const COLLEGE_NAME_TE = 'విశాఖ ఇన్‌స్టిట్యూట్ ఆఫ్ ఇంజనీరింగ్ & టెక్నాలజీ';

const QUICK_ACTIONS = {
  en: [
    'How to apply for admission?',
    'What courses are offered?',
    'What is the fee structure?',
  ],
  te: [
    'అడ్మిషన్ కోసం ఎలా దరఖాస్తు చేయాలి?',
    'ఏ కోర్సులు అందుబాటులో ఉన్నాయి?',
    'ఫీజు నిర్మాణం ఏమిటి?',
  ],
  hi: [
    'प्रवेश के लिए आवेदन कैसे करें?',
    'कौन से कोर्स उपलब्ध हैं?',
    'फीस संरचना क्या है?',
  ],
};

const UI_LABELS = {
  en: {
    placeholder: 'Ask about admissions, fees, courses...',
    typing: 'VIET Bot is typing',
    offline: 'Offline Mode',
    suggestions: 'Quick Questions',
    reset: 'New Chat',
    footer: 'RAG + OCR Offline • Telugu, Hindi & English • VIET 2025-26',
  },
  te: {
    placeholder: 'అడ్మిషన్లు, ఫీజులు, కోర్సుల గురించి అడగండి...',
    typing: 'VIET బాట్ టైప్ చేస్తోంది',
    offline: 'ఆఫ్‌లైన్ మోడ్',
    suggestions: 'త్వరిత ప్రశ్నలు',
    reset: 'కొత్త చాట్',
    footer: 'RAG + OCR ఆఫ్‌లైన్ • తెలుగు, హిందీ & ఇంగ్లీష్ • VIET 2025-26',
  },
  hi: {
    placeholder: 'प्रवेश, फीस, कोर्स के बारे में पूछें...',
    typing: 'VIET बॉट टाइप कर रहा है',
    offline: 'ऑफ़लाइन मोड',
    suggestions: 'त्वरित प्रश्न',
    reset: 'नई चैट',
    footer: 'RAG + OCR ऑफ़लाइन • तेलुगु, हिंदी और अंग्रेजी • VIET 2025-26',
  },
};

/*App State*/
let currentLang = 'en';
let isTyping = false;
let isListening = false;
let msgCounter = 0;
let recognition = null;

function nextId() { return `msg-${++msgCounter}`; }

/*Greeting*/
function getBotGreeting(lang) {
  const name = lang === 'te' ? COLLEGE_NAME_TE : COLLEGE_NAME;
  let content;
  if (lang === 'te') {
    content = `👋 **VIET కళాశాల విచారణ బాట్‌కు స్వాగతం!**\n\nనేను **${name}**, నారావ, విశాఖపట్నం కోసం మీ వర్చువల్ అసిస్టెంట్‌ని. నేను మీకు ఈ విషయాలలో సహాయపడగలను:\n\n• 🎓 అడ్మిషన్లు & AP EAMCET కౌన్సెలింగ్\n• 📚 కోర్సులు & ప్రోగ్రామ్‌లు (B.Tech, M.Tech, MBA, MCA)\n• 💰 ఫీజు నిర్మాణం & AP స్కాలర్‌షిప్‌లు\n\nమీకు ఎలా సహాయపడగలను? OCR టెక్స్ట్ వెలికితీతకు స్కాన్ బటన్ ఉపయోగించి **పత్రాన్ని అప్‌లోడ్** కూడా చేయవచ్చు!`;
  } else if (lang === 'hi') {
    content = `👋 **VIET कॉलेज पूछताछ बॉट में आपका स्वागत है!**\n\nमैं **${name}**, नारावा, विशाखापट्टनम के लिए आपका वर्चुअल असिस्टेंट हूँ। मैं इन विषयों में आपकी सहायता कर सकता हूँ:\n\n• 🎓 प्रवेश और AP EAMCET काउंसलिंग\n• 📚 कोर्स और प्रोग्राम (B.Tech, M.Tech, MBA, MCA)\n• 💰 फीस संरचना और AP छात्रवृत्ति\n\nआज मैं आपकी कैसे सहायता कर सकता हूँ?`;
  } else {
    content = `👋 **Welcome to VIET College Enquiry Bot!**\n\nI'm your virtual assistant for **${name}**, Narava, Visakhapatnam. I can help you with:\n\n• 🎓 Admissions & AP EAMCET Counselling\n• 📚 Courses & Programs (B.Tech, M.Tech, MBA, MCA)\n• 💰 Fee Structure & AP Scholarships\n\nHow can I assist you today? You can also **upload a document** using the scan button for OCR text extraction!`;
  }

  return { id: nextId(), role: 'bot', content, timestamp: new Date(), category: 'greeting', confidence: 100 };
}

/*API call*/
async function fetchBotResponse(userMessage, lang) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, lang }),
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  return res.json();
}

async function fetchOCRResponse(ocrText, lang) {
  const res = await fetch('/api/ocr-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: ocrText, lang }),
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  return res.json();
}

/*Send Message*/
async function sendMessage(text) {
  if (!text.trim() || isTyping) return;

  const userMsg = { id: nextId(), role: 'user', content: text.trim(), timestamp: new Date() };
  appendMessage(userMsg);
  setInput('');
  hideSuggestions();
  showTyping(true);

  // Small delay for realistic feel
  await sleep(600 + Math.random() * 400);

  try {
    const result = await fetchBotResponse(text.trim(), currentLang);
    showTyping(false);
    const botMsg = {
      id: nextId(),
      role: 'bot',
      content: result.response,
      timestamp: new Date(),
      category: result.category,
      confidence: result.confidence,
    };
    appendMessage(botMsg);
  } catch (err) {
    showTyping(false);
    const errMsg = {
      id: nextId(),
      role: 'bot',
      content: currentLang === 'te'
        ? '⚠️ క్షమించండి, ఒక లోపం జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
        : '⚠️ Sorry, an error occurred. Please try again.',
      timestamp: new Date(),
      category: 'error',
      confidence: 0,
    };
    appendMessage(errMsg);
    console.error('Chat error:', err);
  }
}

/*OCR Complete handler*/
async function handleOCRComplete(ocrText, imagePreview) {
  const userMsg = {
    id: nextId(),
    role: 'user',
    content: currentLang === 'te' ? '📄 OCR ద్వారా పత్రం అప్‌లోడ్ చేయబడింది'
      : currentLang === 'hi' ? '📄 OCR स्कैनिंग के लिए दस्तावेज़ अपलोड किया गया'
      : '📄 Document uploaded for OCR scanning',
    timestamp: new Date(),
    imagePreview,
  };
  appendMessage(userMsg);
  hideSuggestions();
  showTyping(true);

  await sleep(800);

  try {
    const result = await fetchOCRResponse(ocrText, currentLang);
    showTyping(false);
    const botMsg = {
      id: nextId(),
      role: 'bot',
      content: result.response,
      timestamp: new Date(),
      category: result.category || 'ocr',
      confidence: result.confidence,
    };
    appendMessage(botMsg);
  } catch (err) {
    showTyping(false);
    console.error('OCR response error:', err);
  }
}

/*Language Switch*/
function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const input = document.getElementById('chat-input');
  if (lang === 'te') {
    input.classList.add('telugu');
  } else {
    input.classList.remove('telugu');
  }

  const t = UI_LABELS[lang];
  input.placeholder = t.placeholder;
  document.getElementById('typing-label').textContent = t.typing;
  document.getElementById('offline-label').textContent = t.offline;
  document.getElementById('suggestions-title').textContent = t.suggestions;
  document.getElementById('footer-note').textContent = t.footer;
  document.getElementById('reset-btn').title = t.reset;

  // Rebuild suggestions
  renderSuggestions(lang);

  // Reset chat
  clearMessages();
  const greeting = getBotGreeting(lang);
  appendMessage(greeting);
  showSuggestions();
}

/*Reset Chat*/
function resetChat() {
  clearMessages();
  const greeting = getBotGreeting(currentLang);
  appendMessage(greeting);
  showSuggestions();
  setInput('');
}

/*Suggestions*/
function renderSuggestions(lang) {
  const list = document.getElementById('suggestions-list');
  if (!list) return;
  list.innerHTML = '';
  QUICK_ACTIONS[lang].forEach(q => {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip';
    chip.textContent = q;
    chip.addEventListener('click', () => sendMessage(q));
    list.appendChild(chip);
  });
}

function showSuggestions() {
  const bar = document.getElementById('suggestions-bar');
  if (bar) bar.classList.remove('hidden');
}

function hideSuggestions() {
  const bar = document.getElementById('suggestions-bar');
  if (bar) bar.classList.add('hidden');
}

/*Typing Indicator*/
function showTyping(show) {
  isTyping = show;
  const indicator = document.getElementById('typing-indicator');
  if (!indicator) return;
  if (show) {
    indicator.classList.remove('hidden');
    scrollToBottom();
  } else {
    indicator.classList.add('hidden');
  }
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    const input = document.getElementById('chat-input');
    sendBtn.disabled = show || !input.value.trim();
  }
}

/*Input helpers*/
function setInput(val) {
  const input = document.getElementById('chat-input');
  if (!input) return;
  input.value = val;
  input.style.height = 'auto';
  document.getElementById('send-btn').disabled = !val.trim() || isTyping;
}

/*Voice input*/
function toggleVoice() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert(currentLang === 'te'
      ? 'మీ బ్రౌజర్ వాయిస్ ఇన్‌పుట్‌కు మద్దతు ఇవ్వదు.'
      : 'Your browser does not support voice input.');
    return;
  }

  if (isListening) {
    recognition && recognition.stop();
    setListening(false);
    return;
  }

  recognition = new SpeechRec();
  recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => setListening(true);
  recognition.onend = () => setListening(false);
  recognition.onerror = () => setListening(false);
  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById('chat-input');
    input.value += transcript;
    input.dispatchEvent(new Event('input'));
    input.focus();
  };
  recognition.start();
}

function setListening(listening) {
  isListening = listening;
  const btn = document.getElementById('voice-btn');
  const micIcon = document.getElementById('mic-icon');
  const micOffIcon = document.getElementById('mic-off-icon');
  if (!btn) return;
  btn.classList.toggle('listening', listening);
  micIcon.classList.toggle('hidden', listening);
  micOffIcon.classList.toggle('hidden', !listening);
}

/*Utilities*/
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/*DOM Ready*/
document.addEventListener('DOMContentLoaded', () => {
  //Initial greeting
  const greeting = getBotGreeting('en');
  appendMessage(greeting);
  renderSuggestions('en');
  showSuggestions();

  //Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLang(btn.dataset.lang));
  });

  //Reset button
  document.getElementById('reset-btn').addEventListener('click', resetChat);

  //OCR button
  document.getElementById('ocr-btn').addEventListener('click', () => {
    openOCR(currentLang, handleOCRComplete);
  });

  //Voice button
  document.getElementById('voice-btn').addEventListener('click', toggleVoice);

  //Send button
  document.getElementById('send-btn').addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    sendMessage(input.value);
  });

  //Textarea
  const chatInput = document.getElementById('chat-input');

  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
    document.getElementById('send-btn').disabled = !chatInput.value.trim() || isTyping;
  });

  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });
});
