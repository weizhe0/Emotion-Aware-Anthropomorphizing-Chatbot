const video        = document.getElementById("video");
const chatBox      = document.getElementById("chatBox");
const emotionLabel = document.getElementById("emotionLabel");
const avatar       = document.getElementById("avatar");
const messageInput = document.getElementById("messageInput");
const sendBtn      = document.getElementById("sendBtn");

let lastEmotion            = "neutral";
let isProcessing           = false;
let emotionDetectionActive = true;
let hasGreeted             = false;
let currentSessionId       = null;   // ← tracks active session

const avatars = {
    happy:     "😄",
    sad:       "😢",
    angry:     "😡",
    surprised: "😲",
    neutral:   "🤖",
    fearful:   "😨",
    disgusted: "🤢"
};

// ─────────────────────────────────────────
// LOAD FACE DETECTION MODELS
// ─────────────────────────────────────────
console.log("Loading face detection models...");
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/static/models')
]).then(() => {
    console.log("✅ Models loaded successfully!");
    startVideo();

    // Fallback: greet with neutral if no face in 5s
    setTimeout(() => {
        if (!hasGreeted) {
            hasGreeted = true;
            respondToEmotion("neutral");
        }
    }, 5000);

}).catch(err => {
    console.error("❌ Error loading models:", err);
    emotionLabel.innerText = "Model loading failed";
    hasGreeted = true;
    addMessage("bot", "Hello! I'm ready to chat with you! 🤖 (Emotion detection unavailable)");
});

// ─────────────────────────────────────────
// START CAMERA
// ─────────────────────────────────────────
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.style.transform = "scaleX(-1)";
            emotionLabel.innerText = "Analyzing your face...";
        })
        .catch(err => {
            console.error("❌ Camera error:", err);
            emotionLabel.innerText = "Camera unavailable";
            addMessage("bot", "Hello! I'm ready to chat! 🤖 (Camera not available)");
        });
}

// ─────────────────────────────────────────
// EMOTION DETECTION LOOP
// ─────────────────────────────────────────
video.addEventListener("play", () => {
    const detectEmotion = async () => {
        if (!emotionDetectionActive) return;
        try {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
                .withFaceExpressions();

            if (detections.length === 0) {
                emotionLabel.innerHTML   = 'No face detected 😕<br><small>Please face the camera</small>';
                emotionLabel.style.color = '#ffcc00';
            } else if (detections.length > 1) {
                emotionLabel.innerHTML   = 'Multiple faces detected 👥<br><small>Please show only ONE face</small>';
                emotionLabel.style.color = '#ffcc00';
            } else {
                const expressions = detections[0].expressions;
                const emotion = Object.keys(expressions)
                    .reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                updateEmotion(emotion);
                if (!hasGreeted) {
                    hasGreeted = true;
                    respondToEmotion(emotion);
                }
                lastEmotion = emotion;
            }
        } catch (error) {
            console.error("Detection error:", error);
        }
        setTimeout(detectEmotion, 400);
    };
    setTimeout(detectEmotion, 800);
});

// ─────────────────────────────────────────
// UPDATE EMOTION UI
// ─────────────────────────────────────────
function updateEmotion(emotion) {
    const emotionNames = {
        happy:     "Happy 😊",   sad:       "Sad 😢",
        angry:     "Angry 😠",   surprised: "Surprised 😲",
        fearful:   "Worried 😰", disgusted: "Uncomfortable 😣",
        neutral:   "Calm 😐"
    };
    emotionLabel.innerText   = `You look: ${emotionNames[emotion] || emotion}`;
    emotionLabel.style.color = '#ffffff';
    avatar.innerText         = avatars[emotion] || "🤖";
}

// ─────────────────────────────────────────
// INITIAL GREETING
// ─────────────────────────────────────────
async function respondToEmotion(emotion) {
    showTypingIndicator();
    try {
        const res  = await fetch("/emotion_greeting", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ emotion })
        });
        const data = await res.json();
        hideTypingIndicator();
        addMessage("bot", data.greeting);
    } catch (err) {
        hideTypingIndicator();
        const fallbacks = {
            happy:     "I can see you're happy! 😊 How are you today?",
            sad:       "You look sad 😔 I'm here to listen.",
            angry:     "I see you're upset 😟 Want to talk about it?",
            surprised: "You look surprised! 😲 What happened?",
            fearful:   "You seem worried 😰 I'm here for you.",
            disgusted: "You look uncomfortable 😣 Everything okay?",
            neutral:   "Hello! 🤖 How can I help you today?"
        };
        addMessage("bot", fallbacks[emotion] || "Hello! How are you feeling?");
    }
}

// ─────────────────────────────────────────
// SENTIMENT BADGE
// ─────────────────────────────────────────
function addSentimentBadge(data) {
    const sentimentEmoji = { positive: "😊 Positive", negative: "😞 Negative", neutral: "😐 Neutral" };
    const faceEmoji      = { happy: "😊", sad: "😢", angry: "😠", surprised: "😲", neutral: "😐", fearful: "😰", disgusted: "🤢" };

    const badge = document.createElement("div");
    badge.style.cssText = `
        font-size: 11px; color: #888; text-align: right;
        margin: -6px 10px 10px 0; padding: 4px 10px;
        background: rgba(0,0,0,0.04); border-radius: 8px;
        line-height: 1.8; white-space: pre-line;
    `;

    let line1 = `Face: ${faceEmoji[data.emotion] || "🤖"} ${data.emotion}  |  Text: ${sentimentEmoji[data.sentiment] || data.sentiment}`;
    let line2 = "";
    if (data.conflict) {
        line2                  = "⚡ Conflict! Face & text emotions disagree";
        badge.style.color      = "#e74c3c";
        badge.style.fontWeight = "bold";
        badge.style.background = "rgba(231,76,60,0.08)";
        badge.style.border     = "1px solid rgba(231,76,60,0.2)";
    }
    let line3 = "";
    if (data.model_breakdown) {
        const b    = data.model_breakdown;
        const icon = b.agreement ? "✅" : "⚠️";
        line3 = `${icon} NB: ${b.naive_bayes.sentiment} (${b.naive_bayes.confidence})`
              + ` | LR: ${b.logistic_regression.sentiment} (${b.logistic_regression.confidence})`
              + ` | BERT: ${b.distilbert.sentiment} (${b.distilbert.confidence})`;
    }
    badge.innerText = [line1, line2, line3].filter(l => l !== "").join("\n");
    chatBox.appendChild(badge);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ─────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !isProcessing) sendMessage();
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;

    isProcessing     = true;
    sendBtn.disabled = true;
    addMessage("user", message);
    messageInput.value = "";
    showTypingIndicator();

    try {
        const res = await fetch("/chat", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                message,
                emotion:    lastEmotion,
                session_id: currentSessionId   // ← always send current session
            })
        });

        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        hideTypingIndicator();

        // Save session id returned from backend
        if (data.session_id) {
            currentSessionId = data.session_id;
            updateActiveSidebarItem(currentSessionId);
        }

        addMessage("bot", data.reply);
        if (data.sentiment) addSentimentBadge(data);

        // Refresh sidebar title after first message auto-titles the session
        loadSessions();

    } catch (err) {
        console.error("❌ Error:", err);
        hideTypingIndicator();
        addMessage("bot", "Sorry, I'm having trouble connecting. Please try again.");
    }

    isProcessing     = false;
    sendBtn.disabled = false;
    messageInput.focus();
}

// ─────────────────────────────────────────
// ADD MESSAGE
// ─────────────────────────────────────────
function addMessage(sender, text) {
    const msgDiv     = document.createElement("div");
    msgDiv.className = `message ${sender}-message`;
    const content    = document.createElement("div");
    content.className = "message-content";
    content.innerText = text;
    msgDiv.appendChild(content);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ─────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────
function showTypingIndicator() {
    hideTypingIndicator();
    const indicator  = document.createElement("div");
    indicator.className = "message bot-message";
    indicator.id     = "typingIndicator";
    const dot        = document.createElement("div");
    dot.className    = "typing-indicator active";
    dot.innerHTML    = "<span></span><span></span><span></span>";
    indicator.appendChild(dot);
    chatBox.appendChild(indicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
}

// ─────────────────────────────────────────
// SESSION SIDEBAR — LOAD ALL SESSIONS
// ─────────────────────────────────────────
async function loadSessions() {
    try {
        const res  = await fetch("/get_sessions");
        const data = await res.json();
        renderSidebar(data.sessions);
    } catch (err) {
        console.error("❌ Failed to load sessions:", err);
    }
}

function renderSidebar(sessions) {
    const list = document.getElementById("sessionList");
    if (!list) return;
    list.innerHTML = "";

    if (sessions.length === 0) {
        list.innerHTML = `<div class="session-empty">No history yet.<br>Start a new chat!</div>`;
        return;
    }

    sessions.forEach(s => {
        const item       = document.createElement("div");
        item.className   = "session-item" + (s.session_id === currentSessionId ? " active" : "");
        item.dataset.id  = s.session_id;
        item.innerHTML   = `
            <div class="session-title" onclick="loadSession(${s.session_id})">${escapeHtml(s.title)}</div>
            <div class="session-preview" onclick="loadSession(${s.session_id})">${escapeHtml(s.preview)}</div>
            <div class="session-meta">
                <span>${s.created_at}</span>
                <div class="session-actions">
                    <button class="action-btn rename-btn" title="Rename" onclick="renameSession(${s.session_id}, event)">✏️</button>
                    <button class="action-btn delete-btn" title="Delete" onclick="deleteSession(${s.session_id}, event)">🗑️</button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateActiveSidebarItem(sessionId) {
    document.querySelectorAll(".session-item").forEach(el => {
        el.classList.toggle("active", parseInt(el.dataset.id) === sessionId);
    });
}

// ─────────────────────────────────────────
// LOAD A PAST SESSION (view history)
// ─────────────────────────────────────────
async function loadSession(sessionId) {
    try {
        const res  = await fetch(`/get_session_messages/${sessionId}`);
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();

        // Switch active session
        currentSessionId = sessionId;
        updateActiveSidebarItem(sessionId);

        // Clear chat and render all messages
        chatBox.innerHTML = "";

        // Date header
        const header       = document.createElement("div");
        header.className   = "session-date-header";
        header.innerText   = `📅 Session: ${data.title}`;
        chatBox.appendChild(header);

        data.messages.forEach(msg => {
            addMessage(msg.sender === "user" ? "user" : "bot", msg.message);

            // Re-render sentiment badge for user messages that have analytics
            if (msg.sender === "user" && msg.analytics) {
                addSentimentBadge({
                    emotion:         msg.emotion   || "neutral",
                    sentiment:       msg.sentiment || "positive",
                    conflict:        msg.conflict  || false,
                    model_breakdown: {
                        naive_bayes:         { sentiment: msg.analytics.naive_bayes.sentiment,  confidence: msg.analytics.naive_bayes.confidence },
                        logistic_regression: { sentiment: msg.analytics.logistic.sentiment,     confidence: msg.analytics.logistic.confidence },
                        distilbert:          { sentiment: msg.analytics.bert.sentiment,         confidence: msg.analytics.bert.confidence },
                        agreement:           msg.analytics.agreement
                    }
                });
            }
        });

        // If empty session
        if (data.messages.length === 0) {
            addMessage("bot", "This chat has no messages yet. Say something! 😊");
        }

        closeSidebar();

    } catch (err) {
        console.error("❌ Failed to load session:", err);
        addMessage("bot", "Sorry, couldn't load that conversation.");
    }
}

// ─────────────────────────────────────────
// NEW CHAT
// ─────────────────────────────────────────
async function startNewChat() {
    try {
        const res  = await fetch("/new_session", { method: "POST" });
        const data = await res.json();

        currentSessionId  = data.session_id;
        chatBox.innerHTML = "";
        hasGreeted        = false;
        respondToEmotion(lastEmotion);
        loadSessions();
        closeSidebar();

    } catch (err) {
        console.error("❌ Failed to create new session:", err);
    }
}

// ─────────────────────────────────────────
// RENAME SESSION
// ─────────────────────────────────────────
async function renameSession(sessionId, event) {
    event.stopPropagation();
    const newTitle = prompt("Enter new chat title:");
    if (!newTitle || !newTitle.trim()) return;

    try {
        await fetch(`/rename_session/${sessionId}`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ title: newTitle.trim() })
        });
        loadSessions();
    } catch (err) {
        console.error("❌ Rename failed:", err);
    }
}

// ─────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────
async function deleteSession(sessionId, event) {
    event.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;

    try {
        await fetch(`/delete_session/${sessionId}`, { method: "DELETE" });

        // If deleting the active session, start fresh
        if (sessionId === currentSessionId) {
            currentSessionId  = null;
            chatBox.innerHTML = "";
            hasGreeted        = false;
            respondToEmotion(lastEmotion);
        }
        loadSessions();
    } catch (err) {
        console.error("❌ Delete failed:", err);
    }
}

// ─────────────────────────────────────────
// WEEKLY SUMMARY MODAL
// ─────────────────────────────────────────
async function showWeeklySummary() {
    const modal = document.getElementById("summaryModal");
    const body  = document.getElementById("summaryBody");
    if (!modal || !body) return;

    body.innerHTML = `<div class="summary-loading">⏳ Generating your weekly report...</div>`;
    modal.style.display = "flex";

    try {
        // Pass ?save=1 to also persist this report to DB
        const res  = await fetch("/weekly_summary?save=1");
        const data = await res.json();
        const s    = data.stats || {};

        const moodColor = { positive: "#27ae60", mixed: "#f39c12", negative: "#e74c3c" };
        const color     = moodColor[data.mood] || "#667eea";

        // Build emotion breakdown pills
        let emotionPills = "";
        if (s.emotion_counts) {
            emotionPills = Object.entries(s.emotion_counts)
                .sort((a, b) => b[1] - a[1])
                .map(([e, c]) => `<span class="emotion-pill">${e}: ${c}</span>`)
                .join("");
        }

        body.innerHTML = `
            <div class="summary-period">📅 ${s.period || "This week"}</div>

            <div class="summary-conclusion" style="border-left: 4px solid ${color}">
                ${data.summary}
            </div>

            <div class="summary-stats">
                <div class="stat-card">
                    <div class="stat-number" style="color:${color}">${s.happy_pct || 0}%</div>
                    <div class="stat-label">Positive</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${s.total_messages || 0}</div>
                    <div class="stat-label">Messages</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color:#e74c3c">${s.conflicts || 0}</div>
                    <div class="stat-label">Conflicts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${s.dominant_emotion || "-"}</div>
                    <div class="stat-label">Top Emotion</div>
                </div>
            </div>

            <div class="summary-emotions">
                <strong>Emotion Breakdown:</strong><br>
                <div class="emotion-pills">${emotionPills || "No data"}</div>
            </div>

            <button class="view-history-btn" onclick="showReportHistory()">
                📚 View Past Reports
            </button>
        `;
    } catch (err) {
        body.innerHTML = `<div class="summary-error">❌ Failed to load summary. Please try again.</div>`;
    }
}

// ─────────────────────────────────────────
// PAST WEEKLY REPORTS
// ─────────────────────────────────────────
async function showReportHistory() {
    const body = document.getElementById("summaryBody");
    body.innerHTML = `<div class="summary-loading">⏳ Loading past reports...</div>`;

    try {
        const res  = await fetch("/weekly_report_history");
        const data = await res.json();

        if (!data.reports || data.reports.length === 0) {
            body.innerHTML = `<div class="summary-empty">No saved reports yet.<br>
                <button class="back-btn" onclick="showWeeklySummary()">← Back</button></div>`;
            return;
        }

        const moodColor = (pct) => pct >= 70 ? "#27ae60" : pct >= 40 ? "#f39c12" : "#e74c3c";

        body.innerHTML = `
            <h3 style="margin-bottom:12px">📚 Past Weekly Reports</h3>
            ${data.reports.map(r => `
                <div class="report-card">
                    <div class="report-period">${r.week_start} – ${r.week_end}</div>
                    <div class="report-conclusion">${r.conclusion}</div>
                    <div class="report-meta">
                        <span style="color:${moodColor(r.positive_percentage)}">
                            ${r.positive_percentage}% positive
                        </span>
                        &nbsp;·&nbsp; Top emotion: <strong>${r.dominant_emotion}</strong>
                    </div>
                </div>
            `).join("")}
            <button class="back-btn" onclick="showWeeklySummary()">← Back to This Week</button>
        `;
    } catch (err) {
        body.innerHTML = `<div class="summary-error">❌ Failed to load reports.</div>`;
    }
}

function closeModal() {
    const modal = document.getElementById("summaryModal");
    if (modal) modal.style.display = "none";
}

// ─────────────────────────────────────────
// SIDEBAR TOGGLE
// ─────────────────────────────────────────
function openSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.add("open");
    loadSessions();
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");
}

// ─────────────────────────────────────────
// CLEAR HISTORY (current session only)
// ─────────────────────────────────────────
async function clearHistory() {
    if (!confirm("Clear this conversation? (History is still saved in the database)")) return;
    chatBox.innerHTML = "";
    hasGreeted        = false;
    currentSessionId  = null;
    respondToEmotion(lastEmotion);
}

// ─────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────
function escapeHtml(text) {
    const d = document.createElement("div");
    d.innerText = text;
    return d.innerHTML;
}

// ─────────────────────────────────────────
// PAGE LOAD
// ─────────────────────────────────────────
window.addEventListener("load", () => {
    console.log("✅ Page loaded — waiting for emotion detection...");
    loadSessions();   // populate sidebar on load
});