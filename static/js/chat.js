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
let detectionRunning       = false;

// ─────────────────────────────────────────────────────────────────
// FRONTEND STABILITY GATE
//
// The heavy smoothing is done on the backend (12-frame prob average).
// The frontend adds a second, lighter gate:
//
//   DISPLAY_STREAK = 4
//     The displayed emotion only changes after the backend returns
//     the SAME label 4 times in a row.  At 300ms polling that means
//     the label must be stable for ~1.2 s before the UI updates.
//     This stops single-frame blips from changing what the user sees.
//
//   CHAT_STREAK = 6
//     lastEmotion (sent to /chat) only updates after 6 consecutive
//     matching labels (~1.8 s).  The chatbot context is therefore
//     immune to sub-2-second emotion flickers.
//
//   POLL_MS = 300
//     Reduced from 150 ms.  300 ms is fast enough for real-time
//     feel but cuts the number of requests in half, giving the
//     backend more time to run the VGG16 cleanly.
// ─────────────────────────────────────────────────────────────────
const POLL_MS      = 300;
const DISPLAY_STREAK = 4;
const CHAT_STREAK    = 6;

let streakLabel = null;
let streakCount = 0;

function updateStreak(newLabel) {
    if (newLabel === streakLabel) {
        streakCount++;
    } else {
        streakLabel = newLabel;
        streakCount = 1;
    }
}

// Hidden canvas — raw un-mirrored frames for Flask / OpenCV
const captureCanvas = document.createElement("canvas");
const captureCtx    = captureCanvas.getContext("2d");

const avatars = {
    happy:"😄", sad:"😢", angry:"😡", surprise:"😲",
    neutral:"🤖", fear:"😨", disgust:"🤢"
};
const emotionNames = {
    happy:"Happy 😊",   sad:"Sad 😢",     angry:"Angry 😠",
    surprise:"Surprised 😲", fear:"Worried 😰",
    disgust:"Uncomfortable 😣", neutral:"Calm 😐"
};

// ─────────────────────────────────────────────────────────────────
// START CAMERA
// ─────────────────────────────────────────────────────────────────
function startVideo() {
    navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
    })
    .then(stream => {
        video.srcObject = stream;
        console.log("✅ Camera started!");
        emotionLabel.innerText = "Analysing your face…";
        video.addEventListener("loadedmetadata", () => {
            captureCanvas.width  = video.videoWidth;
            captureCanvas.height = video.videoHeight;
            console.log(`📐 ${video.videoWidth}×${video.videoHeight}`);
            startDetectionLoop();
        });
    })
    .catch(err => {
        console.error("❌ Camera error:", err);
        emotionLabel.innerText = "Camera unavailable";
        if (!hasGreeted) { hasGreeted = true; addMessage("bot", "Hello! Ready to chat 🤖"); }
    });
}

// ─────────────────────────────────────────────────────────────────
// DETECTION LOOP
// ─────────────────────────────────────────────────────────────────
function startDetectionLoop() {
    console.log(`🎥 Detection loop: ${POLL_MS}ms | display_streak=${DISPLAY_STREAK} | chat_streak=${CHAT_STREAK}`);

    const detect = async () => {
        if (!emotionDetectionActive || detectionRunning) {
            setTimeout(detect, POLL_MS);
            return;
        }
        detectionRunning = true;

        try {
            captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
            // 0.7 quality — slightly higher than before for better face detail
            const base64Frame = captureCanvas.toDataURL("image/jpeg", 0.7);

            const res = await fetch("/predict_emotion", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ image: base64Frame })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const { emotion, confidence, face_count, all_probs } = await res.json();

            if (face_count === 0) {
                // Show warning but DON'T reset streak — single missed frame is normal
                emotionLabel.innerHTML =
                    'No face detected 😕 <small style="font-weight:normal">— face the camera</small>';
                emotionLabel.style.color = "#ffcc00";
                avatar.innerText = "😕";

            } else {
                // ── Update streak counter ──────────────────────────
                updateStreak(emotion);

                // ── Update display only after DISPLAY_STREAK matches ──
                if (streakCount >= DISPLAY_STREAK) {
                    const pct = (confidence * 100).toFixed(1);
                    updateEmotion(emotion, pct, all_probs);
                    emotionLabel.style.color = "#ffffff";
                }

                // ── Update chatbot context only after CHAT_STREAK ──
                if (streakCount >= CHAT_STREAK) {
                    lastEmotion = emotion;
                }

                // ── First greeting: wait for DISPLAY_STREAK confidence ──
                if (!hasGreeted && streakCount >= DISPLAY_STREAK) {
                    hasGreeted = true;
                    console.log(`🎉 Stable first emotion: ${emotion} (streak=${streakCount})`);
                    respondToEmotion(emotion);
                }
            }

        } catch (err) {
            console.error("Detection error:", err);
        }

        detectionRunning = false;
        setTimeout(detect, POLL_MS);
    };

    // Fallback greet if no stable detection in 8 s
    setTimeout(() => {
        if (!hasGreeted) { hasGreeted = true; respondToEmotion("neutral"); }
    }, 8000);

    setTimeout(detect, 500);   // slight delay to let camera warm up
}

// ─────────────────────────────────────────────────────────────────
// UPDATE EMOTION UI
// Top-3 bar chart.  Amber bar highlights a close second choice.
// ─────────────────────────────────────────────────────────────────
function updateEmotion(emotion, confidence, allProbs) {
    avatar.innerText = avatars[emotion] || "🤖";

    let barHTML = "";
    if (allProbs) {
        const sorted    = Object.entries(allProbs).sort((a, b) => b[1] - a[1]);
        const top3      = sorted.slice(0, 3);
        const gap       = top3.length >= 2 ? top3[0][1] - top3[1][1] : 1;
        const closeCall = gap < 0.12;   // within 12 pp → show amber warning

        barHTML = `<div style="font-size:10px;margin-top:4px;line-height:1.7">`;
        if (closeCall) {
            barHTML += `<span style="color:#f59e0b;font-size:9px">⚠️ close between top 2</span><br>`;
        }
        top3.forEach(([em, prob], idx) => {
            const pct   = (prob * 100).toFixed(0);
            const width = Math.max(2, Math.round(prob * 80));
            const color = idx === 0 ? "#4ade80"
                        : (idx === 1 && closeCall ? "#f59e0b" : "#94a3b8");
            barHTML += `
                <span style="display:inline-block;width:70px">${em}</span>
                <span style="display:inline-block;background:${color};height:6px;
                      width:${width}px;border-radius:3px;vertical-align:middle"></span>
                <span style="margin-left:4px">${pct}%</span><br>`;
        });
        barHTML += `</div>`;
    }

    emotionLabel.innerHTML =
        `You look: <strong>${emotionNames[emotion] || emotion}</strong> (${confidence}%)${barHTML}`;
}

// ─────────────────────────────────────────────────────────────────
// INITIAL GREETING
// ─────────────────────────────────────────────────────────────────
async function respondToEmotion(emotion) {
    showTypingIndicator();
    try {
        const res  = await fetch("/emotion_greeting", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emotion })
        });
        const data = await res.json();
        hideTypingIndicator();
        addMessage("bot", data.greeting);
    } catch {
        hideTypingIndicator();
        addMessage("bot", "Hello! 🤖 How can I help you today?");
    }
}

// ─────────────────────────────────────────────────────────────────
// SENTIMENT BADGE
// ─────────────────────────────────────────────────────────────────
function addSentimentBadge(data) {
    const sEmoji = { positive:"😊 Positive", negative:"😞 Negative", neutral:"😐 Neutral" };
    const fEmoji = { happy:"😊", sad:"😢", angry:"😠", surprise:"😲",
                     neutral:"😐", fear:"😰", disgust:"🤢" };

    const badge = document.createElement("div");
    badge.style.cssText = `font-size:11px;color:#888;text-align:right;
        margin:-6px 10px 10px 0;padding:4px 10px;
        background:rgba(0,0,0,0.04);border-radius:8px;line-height:1.8;white-space:pre-line`;

    const l1 = `Face: ${fEmoji[data.emotion]||"🤖"} ${data.emotion}  |  Text: ${sEmoji[data.sentiment]||data.sentiment}`;
    const l2 = data.conflict ? "⚡ Conflict! Face & text emotions disagree" : "";
    let   l3 = "";
    if (data.model_breakdown) {
        const b = data.model_breakdown;
        l3 = `${b.agreement ? "✅" : "⚠️"} NB:${b.naive_bayes.sentiment}(${b.naive_bayes.confidence})`
           + ` | LR:${b.logistic_regression.sentiment}(${b.logistic_regression.confidence})`
           + ` | BERT:${b.distilbert.sentiment}(${b.distilbert.confidence})`;
    }
    if (data.conflict) {
        badge.style.color      = "#e74c3c";
        badge.style.fontWeight = "bold";
        badge.style.background = "rgba(231,76,60,0.08)";
        badge.style.border     = "1px solid rgba(231,76,60,0.2)";
    }
    badge.innerText = [l1, l2, l3].filter(Boolean).join("\n");
    chatBox.appendChild(badge);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────────────────────────
messageInput.addEventListener("keypress", e => {
    if (e.key === "Enter" && !isProcessing) sendMessage();
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;

    isProcessing = true;
    sendBtn.disabled = true;
    addMessage("user", message);
    messageInput.value = "";
    showTypingIndicator();

    try {
        const res  = await fetch("/chat", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, emotion: lastEmotion })
        });
        const data = await res.json();
        hideTypingIndicator();
        addMessage("bot", data.reply);
        if (data.sentiment) addSentimentBadge(data);
    } catch {
        hideTypingIndicator();
        addMessage("bot", "Sorry, connection issue. Please try again.");
    }

    isProcessing = false;
    sendBtn.disabled = false;
    messageInput.focus();
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function addMessage(sender, text) {
    const div     = document.createElement("div");
    div.className = `message ${sender}-message`;
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerText = text;
    div.appendChild(content);
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    hideTypingIndicator();
    const ind      = document.createElement("div");
    ind.className  = "message bot-message";
    ind.id         = "typingIndicator";
    const dots     = document.createElement("div");
    dots.className = "typing-indicator active";
    dots.innerHTML = "<span></span><span></span><span></span>";
    ind.appendChild(dots);
    chatBox.appendChild(ind);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
}

async function clearHistory() {
    if (!confirm("Clear conversation history?")) return;
    try {
        await fetch("/clear_history", { method: "POST", headers: { "Content-Type": "application/json" } });
        chatBox.innerHTML = "";
        hasGreeted        = false;
        streakLabel       = null;
        streakCount       = 0;
        respondToEmotion(lastEmotion);
    } catch (e) { console.error(e); }
}

// ─────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────
startVideo();