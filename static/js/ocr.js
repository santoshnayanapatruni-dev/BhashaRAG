/**
 * ocr.js – OCR Panel UI and Tesseract integration
 * VIET College Chatbot
 */

const OCR_LABELS = {
  en: {
    title: 'OCR Document Scanner',
    subtitle: 'Extract text from images (Telugu & English)',
    drag: 'Drag & drop a file here',
    or: 'or',
    browse: 'Browse Files',
    supported: 'Supports: JPG, PNG, WEBP, BMP, TIFF, PDF, DOCX',
    extractedTitle: 'Extracted Text:',
    useText: 'Use in Chat',
    clear: 'Clear',
    scanning: 'Scanning...',
    done: 'Extraction Complete!',
    chars: 'characters extracted',
    errorMsg: 'Failed to process image. Please try a clearer image.',
    tip: '💡 Tip: For best results, use high-resolution images with clear text',
    stages: [
      'Initializing OCR engine...',
      'Loading language data (Telugu + English)...',
      'Preprocessing image...',
      'Recognizing text...',
      'Finalizing results...',
    ],
  },
  te: {
    title: 'OCR డాక్యుమెంట్ స్కానర్',
    subtitle: 'చిత్రాల నుండి వచనాన్ని వెలికితీయండి (తెలుగు & ఇంగ్లీష్)',
    drag: 'ఇక్కడ ఫైల్‌ను డ్రాగ్ & డ్రాప్ చేయండి',
    or: 'లేదా',
    browse: 'ఫైల్‌లు బ్రౌజ్ చేయండి',
    supported: 'మద్దతు: JPG, PNG, WEBP, BMP, TIFF, PDF, DOCX',
    extractedTitle: 'వెలికితీసిన వచనం:',
    useText: 'చాట్‌లో ఉపయోగించండి',
    clear: 'క్లియర్',
    scanning: 'స్కాన్ చేస్తోంది...',
    done: 'వెలికితీత పూర్తయింది!',
    chars: 'అక్షరాలు వెలికితీయబడ్డాయి',
    errorMsg: 'చిత్రాన్ని ప్రాసెస్ చేయడం విఫలమైంది. దయచేసి స్పష్టమైన చిత్రాన్ని ప్రయత్నించండి.',
    tip: '💡 చిట్కా: ఉత్తమ ఫలితాల కోసం స్పష్టమైన వచనంతో అధిక-రిజల్యూషన్ చిత్రాలను ఉపయోగించండి',
    stages: [
      'OCR ఇంజిన్ ప్రారంభమవుతోంది...',
      'భాష డేటా లోడ్ అవుతోంది (తెలుగు + ఇంగ్లీష్)...',
      'చిత్రాన్ని ప్రీప్రాసెస్ చేస్తోంది...',
      'వచనాన్ని గుర్తిస్తోంది...',
      'ఫలితాలు ఖరారు చేస్తోంది...',
    ],
  },
  hi: {
    title: 'OCR दस्तावेज़ स्कैनर',
    subtitle: 'चित्रों से पाठ निकालें (हिंदी, तेलुगु और अंग्रेजी)',
    drag: 'यहाँ फ़ाइल ड्रैग और ड्रॉप करें',
    or: 'या',
    browse: 'फ़ाइलें ब्राउज़ करें',
    supported: 'समर्थित: JPG, PNG, WEBP, BMP, TIFF, PDF, DOCX',
    extractedTitle: 'निकाला गया पाठ:',
    useText: 'चैट में उपयोग करें',
    clear: 'साफ़ करें',
    scanning: 'स्कैन हो रहा है...',
    done: 'निकासी पूर्ण!',
    chars: 'अक्षर निकाले गए',
    errorMsg: 'चित्र प्रोसेस करने में विफल। कृपया स्पष्ट चित्र प्रयास करें।',
    tip: '💡 सुझाव: सर्वोत्तम परिणामों के लिए स्पष्ट पाठ वाले उच्च-रिज़ॉल्यूशन चित्र उपयोग करें',
    stages: [
      'OCR इंजन शुरू हो रहा है...',
      'भाषा डेटा लोड हो रहा है (हिंदी + तेलुगु + अंग्रेजी)...',
      'चित्र प्रीप्रोसेस हो रहा है...',
      'पाठ पहचाना जा रहा है...',
      'परिणाम अंतिम हो रहे हैं...',
    ],
  },
};

let ocrState = {
  status: 'idle',
  preview: null,
  extractedText: '',
  progress: 0,
  progressMsg: '',
  lang: 'en',
};

/*Render OCR Panel*/
function renderOCRPanel(lang) {
  ocrState.lang = lang;
  const t = OCR_LABELS[lang];
  const content = document.getElementById('ocr-panel-content');
  if (!content) return;

  content.innerHTML = `
    <div class="ocr-panel">
      <div class="ocr-header">
        <div class="ocr-header-info">
          <h2>${t.title}</h2>
          <p>${t.subtitle}</p>
        </div>
        <button class="ocr-close-btn" id="ocr-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="ocr-body" id="ocr-body">
        ${renderOCRBody(t)}
      </div>
    </div>
  `;

  document.getElementById('ocr-close-btn').addEventListener('click', closeOCR);
  bindOCREvents(t);
}

function renderOCRBody(t) {
  if (ocrState.status === 'idle') {
    return `
      <div class="drop-zone" id="drop-zone">
        <div class="drop-zone-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 16 12 12 8 16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        </div>
        <h3>${t.drag}</h3>
        <p>${t.or}</p>
        <button class="browse-btn" id="browse-btn">${t.browse}</button>
        <input type="file" id="file-input" accept="image/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none" />
        <p class="supported-text">${t.supported}</p>
      </div>
      <p class="ocr-tip">${t.tip}</p>
    `;
  }

  if (ocrState.status === 'loading') {
    return `
      ${ocrState.preview ? `<img src="${ocrState.preview}" class="ocr-preview-img" alt="Preview" />` : ''}
      <p style="color:#c0d4ff;font-size:13px;font-weight:600;margin-bottom:10px;">${t.scanning}</p>
      <div class="ocr-progress">
        <div class="progress-track">
          <div class="progress-fill" id="progress-fill" style="width:${ocrState.progress}%"></div>
        </div>
        <p class="progress-msg" id="progress-msg">${ocrState.progressMsg}</p>
      </div>
    `;
  }

  if (ocrState.status === 'done') {
    return `
      ${ocrState.preview ? `<img src="${ocrState.preview}" class="ocr-preview-img" alt="Preview" />` : ''}
      <div class="ocr-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ${t.done}
      </div>
      <p class="ocr-result-label">${t.extractedTitle}</p>
      <div class="ocr-result-text">${escapeHtml(ocrState.extractedText)}</div>
      <p class="ocr-char-count">${ocrState.extractedText.length} ${t.chars}</p>
      <div class="ocr-actions">
        <button class="ocr-use-btn" id="ocr-use-btn">${t.useText}</button>
        <button class="ocr-clear-btn" id="ocr-clear-btn">${t.clear}</button>
      </div>
    `;
  }

  if (ocrState.status === 'error') {
    return `
      ${ocrState.preview ? `<img src="${ocrState.preview}" class="ocr-preview-img" alt="Preview" />` : ''}
      <div class="ocr-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        ${t.errorMsg}
      </div>
      <button class="browse-btn" id="retry-btn" style="margin-top:16px;">Try Again</button>
    `;
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/*Bind events after render*/
function bindOCREvents(t) {
  //Drop zone
  const dropZone = document.getElementById('drop-zone');
  const browseBtn = document.getElementById('browse-btn');
  const fileInput = document.getElementById('file-input');
  const ocrUseBtn = document.getElementById('ocr-use-btn');
  const ocrClearBtn = document.getElementById('ocr-clear-btn');
  const retryBtn = document.getElementById('retry-btn');

  if (dropZone) {
    dropZone.addEventListener('click', e => {
      if (e.target !== browseBtn) fileInput && fileInput.click();
    });
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragging');
      const file = e.dataTransfer.files[0];
      if (file) processOCRFile(file, t);
    });
  }

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) processOCRFile(file, t);
    });
  }

  if (ocrUseBtn) {
    ocrUseBtn.addEventListener('click', () => {
      if (ocrState.extractedText && window._ocrCompleteCallback) {
        window._ocrCompleteCallback(ocrState.extractedText, ocrState.preview || '');
        closeOCR();
      }
    });
  }

  if (ocrClearBtn) {
    ocrClearBtn.addEventListener('click', () => {
      ocrState = { ...ocrState, status: 'idle', preview: null, extractedText: '', progress: 0, progressMsg: '' };
      const body = document.getElementById('ocr-body');
      const t2 = OCR_LABELS[ocrState.lang];
      if (body) body.innerHTML = renderOCRBody(t2);
      bindOCREvents(t2);
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      ocrState = { ...ocrState, status: 'idle', preview: null, extractedText: '', progress: 0, progressMsg: '' };
      const body = document.getElementById('ocr-body');
      const t2 = OCR_LABELS[ocrState.lang];
      if (body) body.innerHTML = renderOCRBody(t2);
      bindOCREvents(t2);
    });
  }
}

/*Process File*/
async function processOCRFile(file, t) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  //Route by file type
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return processPDFFile(file, t);
  }
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    return processDOCXFile(file, t);
  }
  if (fileType.startsWith('image/')) {
    return processImageFile(file, t);
  }

  //Unsupported file type
  ocrState.status = 'error';
  refreshOCRBody(t);
}

/*Process Image (original OCR flow)*/
async function processImageFile(file, t) {
  //Read preview
  const preview = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  ocrState = { ...ocrState, status: 'loading', preview, progress: 5, progressMsg: t.stages[0], extractedText: '' };
  refreshOCRBody(t);

  try {
    const { createWorker } = Tesseract;

    setOCRProgress(15, t.stages[1]);

    const worker = await createWorker('eng+tel+hin', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setOCRProgress(40 + Math.round(m.progress * 50), t.stages[3]);
        } else if (m.status === 'loading language traineddata') {
          setOCRProgress(20, t.stages[1]);
        } else if (m.status === 'initializing tesseract') {
          setOCRProgress(10, t.stages[0]);
        }
      },
    });

    setOCRProgress(40, t.stages[2]);

    const { data: { text } } = await worker.recognize(file);

    setOCRProgress(95, t.stages[4]);
    await worker.terminate();

    const cleanText = text.trim();
    setOCRProgress(100, t.stages[4]);

    ocrState = { ...ocrState, status: 'done', extractedText: cleanText };
    refreshOCRBody(t);

  } catch (err) {
    console.error('OCR error:', err);
    ocrState = { ...ocrState, status: 'error' };
    refreshOCRBody(t);
  }
}

/*Process PDF (pdf.js + Tesseract OCR per page)*/
async function processPDFFile(file, t) {
  ocrState = { ...ocrState, status: 'loading', preview: null, progress: 2, progressMsg: t.stages[0], extractedText: '' };
  refreshOCRBody(t);

  try {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    //Read PDF file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    setOCRProgress(10, t.stages[0]);

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const maxPages = Math.min(totalPages, 10); // cap at 10 pages

    //Initialize Tesseract worker
    setOCRProgress(15, t.stages[1]);
    const { createWorker } = Tesseract;
    const worker = await createWorker('eng+tel+hin', 1);
    setOCRProgress(25, t.stages[1]);

    const allTexts = [];

    for (let i = 1; i <= maxPages; i++) {
      const pageLabel = ocrState.lang === 'te'
        ? `పేజీ ${i} / ${maxPages} ప్రాసెస్ చేస్తోంది...`
        : `Processing page ${i} of ${maxPages}...`;
      const baseProgress = 25 + Math.round(((i - 1) / maxPages) * 65);
      setOCRProgress(baseProgress, pageLabel);

      //Render page to canvas
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); //high res for better OCR
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      //Use first page as preview
      if (i === 1) {
        ocrState.preview = canvas.toDataURL('image/png');
        refreshOCRBody(t);
      }

      //OCR the rendered page
      const { data: { text } } = await worker.recognize(canvas);
      const pageText = text.trim();
      if (pageText) {
        allTexts.push(`--- Page ${i} ---\n${pageText}`);
      }
    }

    await worker.terminate();

    let cleanText = allTexts.join('\n\n').trim();
    if (totalPages > maxPages) {
      const notice = ocrState.lang === 'te'
        ? `\n\n⚠️ గమనిక: మొదటి ${maxPages} పేజీలు మాత్రమే ప్రాసెస్ చేయబడ్డాయి (మొత్తం ${totalPages} పేజీలలో).`
        : `\n\n⚠️ Note: Only the first ${maxPages} pages were processed (out of ${totalPages} total).`;
      cleanText += notice;
    }

    setOCRProgress(100, t.stages[4]);
    ocrState = { ...ocrState, status: 'done', extractedText: cleanText || 'No text found in PDF.' };
    refreshOCRBody(t);

  } catch (err) {
    console.error('PDF OCR error:', err);
    ocrState = { ...ocrState, status: 'error' };
    refreshOCRBody(t);
  }
}

/*Process DOCX (mammoth.js direct text extraction)*/
async function processDOCXFile(file, t) {
  ocrState = { ...ocrState, status: 'loading', preview: null, progress: 10, progressMsg: t.stages[0], extractedText: '' };
  refreshOCRBody(t);

  try {
    const arrayBuffer = await file.arrayBuffer();
    setOCRProgress(30, ocrState.lang === 'te' ? 'పత్రం నుండి వచనాన్ని వెలికితీస్తోంది...' : 'Extracting text from document...');

    const result = await mammoth.extractRawText({ arrayBuffer });
    const cleanText = result.value.trim();

    setOCRProgress(100, t.stages[4]);
    ocrState = { ...ocrState, status: 'done', extractedText: cleanText || 'No text found in document.' };
    refreshOCRBody(t);

  } catch (err) {
    console.error('DOCX extraction error:', err);
    ocrState = { ...ocrState, status: 'error' };
    refreshOCRBody(t);
  }
}

function setOCRProgress(pct, msg) {
  ocrState.progress = pct;
  ocrState.progressMsg = msg;
  const fill = document.getElementById('progress-fill');
  const msgEl = document.getElementById('progress-msg');
  if (fill) fill.style.width = pct + '%';
  if (msgEl) msgEl.textContent = msg;
}

function refreshOCRBody(t) {
  const body = document.getElementById('ocr-body');
  if (body) {
    body.innerHTML = renderOCRBody(t);
    bindOCREvents(t);
  }
}

/*Open / Close*/
function openOCR(lang, onComplete) {
  ocrState = { status: 'idle', preview: null, extractedText: '', progress: 0, progressMsg: '', lang };
  window._ocrCompleteCallback = onComplete;

  const overlay = document.getElementById('ocr-overlay');
  overlay.classList.remove('hidden');
  renderOCRPanel(lang);
}

function closeOCR() {
  const overlay = document.getElementById('ocr-overlay');
  overlay.classList.add('hidden');
  ocrState = { status: 'idle', preview: null, extractedText: '', progress: 0, progressMsg: '', lang: 'en' };
}
