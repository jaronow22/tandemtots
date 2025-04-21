// script.js

const PIN                    = sessionStorage.getItem('pin') || '0';
const API_BASE_URL           = `https://jguides.onrender.com/api/tandemtots/${PIN}`;
const fontToggle             = document.getElementById('fontToggle');
const notesTimeline          = document.getElementById('notesTimeline');
const recentMessageElement   = document.getElementById('recentMessage');
const recentTimestampElement = document.getElementById('recentTimestamp');
const userMessageInput       = document.getElementById('userMessage');
const submitButton           = document.getElementById('submitMessageBtn');

// Apply initial handwriting font to the textarea
userMessageInput.classList.add(
  fontToggle.value === 'josh' ? 'josh-font' : 'ella-font'
);

// Swap textarea font when selection changes
fontToggle.addEventListener('change', () => {
  userMessageInput.classList.remove('josh-font','ella-font');
  userMessageInput.classList.add(
    fontToggle.value === 'josh' ? 'josh-font' : 'ella-font'
  );
});

// Basic HTML‐escape to avoid injection
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Helper to format a timestamp in Gambier Islands time (UTC−9)
function formatGambier(isoString) {
  if (!isoString) return '';
  const dt = new Date(isoString);
  return dt.toLocaleDateString('en-US', {
      timeZone: 'Pacific/Gambier',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    + ', '
    + dt.toLocaleTimeString('en-US', {
      timeZone: 'Pacific/Gambier',
      hour: 'numeric',
      minute: '2-digit'
    });
}

async function safeFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  if (res.status === 403) {
    sessionStorage.removeItem('pin');
    window.location.href = 'pin.html';
    throw new Error('Redirecting to PIN entry');
  }
  return res;
}

// Load and render all notes (newest first)
async function loadTandemTots() {
  try {
    const res  = await safeFetch(API_BASE_URL);
    if (!res.ok) throw new Error(`Load failed: ${res.status}`);
    const tots = await res.json();

    notesTimeline.innerHTML = '';
    tots.slice().reverse().forEach(tot => {
      const li = document.createElement('li');
      // set sender for CSS ::after
      li.dataset.sender = tot.josh ? 'From Josh' : 'From Ella';
      // apply handwriting font
      li.classList.add(tot.josh ? 'josh-font' : 'ella-font');

      const ts = formatGambier(tot.localDateTime);
      li.innerHTML = `
        <p>${escapeHtml(tot.contents)}</p>
        ${ts ? `<span class="timestamp">${ts}</span>` : ''}`;
      notesTimeline.appendChild(li);
    });

    // Update the "Most Recent" section
    if (tots.length) {
      const last = tots[tots.length - 1];
      // font + sender on message
      recentMessageElement.classList.remove('josh-font','ella-font');
      recentMessageElement.classList.add(last.josh ? 'josh-font' : 'ella-font');
      // **also** apply same font to timestamp
      recentTimestampElement.classList.remove('josh-font','ella-font');
      recentTimestampElement.classList.add(last.josh ? 'josh-font' : 'ella-font');

      recentMessageElement.parentElement.dataset.sender = last.josh
        ? 'From Josh'
        : 'From Ella';
      // content
      recentMessageElement.textContent = last.contents;
      // timestamp in Gambier time
      if (last.localDateTime) {
        recentTimestampElement.textContent = formatGambier(last.localDateTime);
      }
    }
  } catch (err) {
    console.error(err);
    alert('Could not load notes.');
  }
}

// Load only the most recent note
async function loadMostRecent() {
  try {
    const res = await safeFetch(`${API_BASE_URL}/recent`);
    if (res.status === 204) return;
    if (!res.ok) throw new Error(`Recent failed: ${res.status}`);
    const tot = await res.json();

    recentMessageElement.classList.remove('josh-font','ella-font');
    recentMessageElement.classList.add(tot.josh ? 'josh-font' : 'ella-font');
    // apply to timestamp too
    recentTimestampElement.classList.remove('josh-font','ella-font');
    recentTimestampElement.classList.add(tot.josh ? 'josh-font' : 'ella-font');

    recentMessageElement.parentElement.dataset.sender = tot.josh
      ? 'From Josh'
      : 'From Ella';
    recentMessageElement.textContent = tot.contents;
    if (tot.localDateTime) {
      recentTimestampElement.textContent = formatGambier(tot.localDateTime);
    }
  } catch (err) {
    console.error(err);
  }
}

// Send a new note to the backend
async function storeTandemTot(contents) {
  const isJosh = fontToggle.value === 'josh';
  try {
    const res = await safeFetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, isJosh })
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    alert('Could not send note.');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (PIN === '0') {
    window.location.href = 'pin.html';
    return;
  }
  loadTandemTots();
  loadMostRecent();
});

// Handle new note submission
submitButton.addEventListener('click', async () => {
  const contents = userMessageInput.value.trim();
  if (!contents) return alert('Please write a note before sending!');
  const saved = await storeTandemTot(contents);
  if (!saved) return;

  // Update most recent display
  recentMessageElement.classList.remove('josh-font','ella-font');
  recentMessageElement.classList.add(saved.josh ? 'josh-font' : 'ella-font');
  // apply to timestamp too
  recentTimestampElement.classList.remove('josh-font','ella-font');
  recentTimestampElement.classList.add(saved.josh ? 'josh-font' : 'ella-font');

  recentMessageElement.parentElement.dataset.sender = saved.josh
    ? 'From Josh'
    : 'From Ella';
  recentMessageElement.textContent = saved.contents;
  if (saved.localDateTime) {
    recentTimestampElement.textContent = formatGambier(saved.localDateTime);
  }

  // Prepend to timeline (no ID, with Gambier timestamp)
  const li = document.createElement('li');
  li.dataset.sender = saved.josh ? 'From Josh' : 'From Ella';
  li.classList.add(saved.josh ? 'josh-font' : 'ella-font');
  const ts = formatGambier(saved.localDateTime);
  li.innerHTML = `
    <p>${escapeHtml(saved.contents)}</p>
    ${ts ? `<span class="timestamp">${ts}</span>` : ''}`;
  notesTimeline.insertBefore(li, notesTimeline.firstChild);

  userMessageInput.value = '';
});