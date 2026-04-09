/**
 * chat.js – Message rendering, markdown parser, message management
 * VIET College Chatbot
 */

/*Markdown - HTML renderer*/
function renderMarkdown(text) {
  const lines = text.split('\n');
  const parts = [];
  let tableLines = [];
  let inTable = false;

  function flushTable() {
    if (tableLines.length < 2) {
      tableLines.forEach(l => parts.push(`<p>${escHtml(l)}</p>`));
      tableLines = [];
      inTable = false;
      return;
    }
    const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
    const rows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));
    let tbl = '<div class="msg-table-wrap"><table class="msg-table"><thead><tr>';
    headers.forEach(h => { tbl += `<th>${parseInline(h)}</th>`; });
    tbl += '</tr></thead><tbody>';
    rows.forEach(row => {
      tbl += '<tr>';
      row.forEach(cell => { tbl += `<td>${parseInline(cell)}</td>`; });
      tbl += '</tr>';
    });
    tbl += '</tbody></table></div>';
    parts.push(tbl);
    tableLines = [];
    inTable = false;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function parseInline(text) {
    //Bold:text
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  lines.forEach((line, idx) => {
    if (line.startsWith('|')) {
      inTable = true;
      tableLines.push(line);
      return;
    }
    if (inTable) flushTable();

    if (!line.trim()) {
      parts.push('<div style="height:6px"></div>');
      return;
    }

    if (line.startsWith('---')) {
      parts.push('<hr />');
      return;
    }

    if (line.startsWith('# ')) {
      parts.push(`<h3>${parseInline(escHtml(line.slice(2)))}</h3>`);
      return;
    }

    if (/^[•\-*]\s/.test(line)) {
      const content = line.replace(/^[•\-*]\s/, '');
      parts.push(
        `<div class="msg-bullet"><span class="bullet-dot">•</span><span class="bullet-text">${parseInline(escHtml(content))}</span></div>`
      );
      return;
    }

    if (line.startsWith('```')) {
      parts.push('<div style="height:2px"></div>');
      return;
    }

    parts.push(`<p>${parseInline(escHtml(line))}</p>`);
  });

  if (inTable) flushTable();
  return parts.join('');
}

/*Message Builder*/
function buildMessageEl(message) {
  const row = document.createElement('div');
  row.className = `message-row ${message.role}`;
  row.dataset.id = message.id;

  //Avatar
  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${message.role}`;

  if (message.role === 'bot') {
    avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#7baeff" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      <circle cx="9" cy="16" r="1" fill="#7baeff"/>
      <circle cx="15" cy="16" r="1" fill="#7baeff"/>
    </svg>`;
  } else {
    avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#a0b4d8" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`;
  }

  //Body
  const body = document.createElement('div');
  body.className = 'msg-body';

  //Image preview
  if (message.imagePreview) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'msg-image-preview';
    const img = document.createElement('img');
    img.src = message.imagePreview;
    img.alt = 'Uploaded';
    imgWrap.appendChild(img);
    body.appendChild(imgWrap);
  }

  //Bubble
  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${message.role}`;

  if (message.role === 'bot') {
    bubble.innerHTML = renderMarkdown(message.content);
  } else {
    const p = document.createElement('p');
    p.style.cssText = 'white-space:pre-wrap;color:#fff;margin:0;';
    p.textContent = message.content;
    bubble.appendChild(p);
  }

  body.appendChild(bubble);

  //Meta row(time, copy)
  const meta = document.createElement('div');
  meta.className = 'msg-meta';

  const timeEl = document.createElement('span');
  timeEl.className = 'msg-time';
  timeEl.textContent = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  meta.appendChild(timeEl);

  if (message.role === 'bot') {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Copy';
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(message.content).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="#4caf7d"/></svg>`;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        }, 2000);
      });
    });

    meta.appendChild(copyBtn);
  }

  body.appendChild(meta);

  row.appendChild(avatar);
  row.appendChild(body);
  return row;
}

/*Scroll helper*/
function scrollToBottom(smooth = true) {
  const end = document.getElementById('messages-end');
  if (end) {
    end.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }
}

/*Append message to DOM*/
function appendMessage(message) {
  const container = document.getElementById('messages-container');
  const end = document.getElementById('messages-end');
  const el = buildMessageEl(message);
  container.insertBefore(el, end);
  scrollToBottom();
}

/*Clear messages*/
function clearMessages() {
  const container = document.getElementById('messages-container');
  const end = document.getElementById('messages-end');
  container.innerHTML = '';
  container.appendChild(end);
}
