from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import random, os
from datetime import datetime, timedelta, date
from groq import Groq
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from collections import Counter
from werkzeug.utils import secure_filename

# ====================== LOAD REAL TRAINED MODELS ======================
import joblib
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

MODELS_DIR = os.path.join(os.path.dirname(__file__), "train_sentiment", "saved_models")

print("📦 Loading sentiment models...")
tfidf          = joblib.load(os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl"))
nb             = joblib.load(os.path.join(MODELS_DIR, "naive_bayes.pkl"))
lr             = joblib.load(os.path.join(MODELS_DIR, "logistic_regression.pkl"))
bert_tokenizer = DistilBertTokenizerFast.from_pretrained(os.path.join(MODELS_DIR, "distilbert"))
bert_model     = DistilBertForSequenceClassification.from_pretrained(os.path.join(MODELS_DIR, "distilbert"))
bert_model.eval()
print("✅ All sentiment models loaded!")

LABELS = ["negative", "positive"]

def predict_all(text: str) -> dict:
    vec     = tfidf.transform([text])
    nb_pred = LABELS[nb.predict(vec)[0]]
    nb_conf = round(float(nb.predict_proba(vec).max()), 3)
    lr_pred = LABELS[lr.predict(vec)[0]]
    lr_conf = round(float(lr.predict_proba(vec).max()), 3)
    inputs  = bert_tokenizer(text, return_tensors="pt", truncation=True, max_length=256, padding=True)
    with torch.no_grad():
        logits = bert_model(**inputs).logits
    probs     = torch.softmax(logits, dim=1)[0]
    bert_pred = LABELS[probs.argmax().item()]
    bert_conf = round(float(probs.max()), 3)
    votes     = [nb_pred, lr_pred, bert_pred]
    final     = max(set(votes), key=votes.count)
    return {
        "naive_bayes":         {"sentiment": nb_pred,   "confidence": nb_conf},
        "logistic_regression": {"sentiment": lr_pred,   "confidence": lr_conf},
        "distilbert":          {"sentiment": bert_pred, "confidence": bert_conf},
        "final_sentiment":     final,
        "agreement":           len(set(votes)) == 1
    }

def detect_conflict(face_emotion, text_sentiment):
    if face_emotion in {"happy"} and text_sentiment == "negative":
        return True
    if face_emotion in {"sad", "angry", "fearful", "disgusted"} and text_sentiment == "positive":
        return True
    return False


# ====================== FLASK + DB SETUP ======================
app = Flask(__name__)
app.secret_key = os.urandom(24)

# XAMPP MySQL — change password if yours is not empty
app.config['SQLALCHEMY_DATABASE_URI']        = 'mysql+pymysql://root:@localhost/emotion_chatbot'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db            = SQLAlchemy(app)
bcrypt        = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login_page'

# ====================== UPLOAD CONFIG ======================
UPLOAD_FOLDER      = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ====================== DATABASE MODELS ======================

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id              = db.Column(db.Integer, primary_key=True)
    username        = db.Column(db.String(50),  unique=True, nullable=False)
    email           = db.Column(db.String(100), unique=True, nullable=False)
    password        = db.Column(db.String(255), nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    sessions        = db.relationship('ChatSession', backref='user', lazy=True, cascade='all, delete-orphan')
    weekly_reports  = db.relationship('WeeklyReport', backref='user', lazy=True, cascade='all, delete-orphan')


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_title = db.Column(db.String(255), default='New Chat')
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    messages      = db.relationship('ChatMessage', backref='session', lazy=True, cascade='all, delete-orphan')


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False)
    sender     = db.Column(db.Enum('user', 'bot'), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    emotion    = db.Column(db.String(50),  nullable=True)
    sentiment  = db.Column(db.String(20),  nullable=True)
    conflict   = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    analytics  = db.relationship('EmotionAnalytics', backref='message', uselist=False, cascade='all, delete-orphan')


class EmotionAnalytics(db.Model):
    __tablename__ = 'emotion_analytics'
    id                     = db.Column(db.Integer, primary_key=True)
    message_id             = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    naive_bayes_sentiment  = db.Column(db.String(20))
    naive_bayes_confidence = db.Column(db.Float)
    logistic_sentiment     = db.Column(db.String(20))
    logistic_confidence    = db.Column(db.Float)
    bert_sentiment         = db.Column(db.String(20))
    bert_confidence        = db.Column(db.Float)
    final_sentiment        = db.Column(db.String(20))
    agreement              = db.Column(db.Boolean)
    created_at             = db.Column(db.DateTime, default=datetime.utcnow)


class WeeklyReport(db.Model):
    __tablename__ = 'weekly_reports'
    id                  = db.Column(db.Integer, primary_key=True)
    user_id             = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    week_start          = db.Column(db.Date)
    week_end            = db.Column(db.Date)
    dominant_emotion    = db.Column(db.String(50))
    positive_percentage = db.Column(db.Float)
    conclusion          = db.Column(db.Text)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ====================== GROQ ======================
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
]

#User must use their own Groq API keys. The following are placeholders and should be replaced with valid keys.
GROQ_API_KEYS = [
    "",
    "",
]

def create_groq_reply(messages):
    last_error = None
    for model_index, model_name in enumerate(GROQ_MODELS, start=1):
        for key_index, api_key in enumerate(GROQ_API_KEYS, start=1):
            try:
                client = Groq(api_key=api_key)
                response = client.chat.completions.create(
                    model       = model_name,
                    messages    = messages,
                    max_tokens  = 200,
                    temperature = 0.7
                )
                if model_index == 1 and key_index == 1:
                    print(f"✅ Groq model {model_name} succeeded with API key {key_index}")
                else:
                    print(f"✅ Groq model {model_name} succeeded with API key {key_index} after fallback")
                return response.choices[0].message.content
            except Exception as e:
                last_error = e
                print(f"❌ Groq model {model_name} with API key {key_index} failed: {e}")
    raise last_error

emotion_greetings = {
    "happy":     ["I can see you're smiling! 😊 What's making you happy today?",
                  "Your face looks so cheerful! 😄 I love your positive energy!"],
    "sad":       ["I notice you look sad today 😔 I'm here to listen. Want to talk about it?",
                  "Your face shows you're feeling down 😢 I'm here for you. How can I help?"],
    "angry":     ["I can see you're upset 😟 Take a deep breath. What's bothering you?",
                  "Your face shows you're angry right now 😠 Let's talk about what happened."],
    "surprised": ["Wow! You look surprised! 😲 Did something unexpected happen?",
                  "Your expression shows surprise! 😮 What's going on?"],
    "fearful":   ["I notice you look worried 😰 It's okay, I'm here. What's concerning you?",
                  "Your face shows you're anxious 😨 Let's talk through it together."],
    "disgusted": ["I can see you're not pleased 😣 What's bothering you?",
                  "Your expression shows disapproval 🤢 Want to talk about it?"],
    "neutral":   ["Hello! 🤖 How are you feeling today?",
                  "Hi there! 🙂 I'm here to chat. What's on your mind?"]
}


# ====================== AUTH ROUTES ======================

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data     = request.get_json()
        username = data.get("username", "").strip()
        email    = data.get("email", "").strip()
        password = data.get("password", "")

        if not username or not email or not password:
            return jsonify({"success": False, "message": "All fields are required"})
        if User.query.filter_by(username=username).first():
            return jsonify({"success": False, "message": "Username already exists"})
        if User.query.filter_by(email=email).first():
            return jsonify({"success": False, "message": "Email already registered"})

        hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
        new_user  = User(username=username, email=email, password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()
        print(f"✅ New user registered: {username}")
        return jsonify({"success": True, "message": "Registered successfully!"})

    return render_template("register.html")


# ====================== CHECK EMAIL AVAILABILITY ======================

@app.route("/check-email", methods=["POST"])
def check_email():
    data  = request.get_json()
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"taken": False})
    existing = User.query.filter_by(email=email).first()
    return jsonify({"taken": existing is not None})


# ====================== LOGIN / LOGOUT ======================

@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        data     = request.get_json()
        email    = data.get("email", "").strip()
        password = data.get("password", "")
        user     = User.query.filter_by(email=email).first()

        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            print(f"✅ User logged in: {user.username}")
            return jsonify({"success": True, "username": user.username})
        return jsonify({"success": False, "message": "Invalid email or password"})

    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('login_page'))


# ====================== MAIN PAGE ======================

@app.route("/")
@login_required
def index():
    return render_template("index.html", username=current_user.username)


# ====================== PROFILE MANAGEMENT ======================

@app.route("/profile")
@login_required
def profile_page():
    return render_template("profile.html")


@app.route("/profile/get")
@login_required
def profile_get():
    return jsonify({
        "username":        current_user.username,
        "email":           current_user.email,
        "profile_picture": current_user.profile_picture,
        "created_at":      current_user.created_at.strftime("%b %d, %Y") if current_user.created_at else None
    })


@app.route("/profile/stats")
@login_required
def profile_stats():
    sessions_count = ChatSession.query.filter_by(user_id=current_user.id).count()
    messages       = ChatMessage.query.join(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatMessage.sender  == 'user'
    ).all()
    total       = len(messages)
    positive    = sum(1 for m in messages if m.sentiment == 'positive')
    emotions    = [m.emotion for m in messages if m.emotion]
    top_emotion = Counter(emotions).most_common(1)[0][0] if emotions else None
    return jsonify({
        "sessions":     sessions_count,
        "messages":     total,
        "positive_pct": round((positive / total) * 100, 1) if total > 0 else 0,
        "top_emotion":  top_emotion
    })


@app.route("/profile/update-info", methods=["POST"])
@login_required
def profile_update_info():
    data     = request.get_json()
    username = data.get("username", "").strip()
    email    = data.get("email", "").strip()

    if not username or not email:
        return jsonify({"success": False, "message": "All fields are required."})

    existing_u = User.query.filter_by(username=username).first()
    if existing_u and existing_u.id != current_user.id:
        return jsonify({"success": False, "message": "Username already taken."})

    existing_e = User.query.filter_by(email=email).first()
    if existing_e and existing_e.id != current_user.id:
        return jsonify({"success": False, "message": "Email already in use."})

    current_user.username = username
    current_user.email    = email
    db.session.commit()
    return jsonify({"success": True, "message": "Profile updated successfully!"})


@app.route("/profile/update-password", methods=["POST"])
@login_required
def profile_update_password():
    data             = request.get_json()
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")

    if not bcrypt.check_password_hash(current_user.password, current_password):
        return jsonify({"success": False, "message": "Current password is incorrect."})
    if len(new_password) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters."})

    current_user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return jsonify({"success": True, "message": "Password updated successfully!"})


@app.route("/profile/upload-avatar", methods=["POST"])
@login_required
def profile_upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({"success": False, "message": "No file provided."})
    file = request.files['avatar']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type."})

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = secure_filename(f"avatar_{current_user.id}.{ext}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    current_user.profile_picture = f"/static/uploads/{filename}"
    db.session.commit()
    return jsonify({"success": True, "url": current_user.profile_picture})


@app.route("/profile/delete-account", methods=["POST"])
@login_required
def profile_delete_account():
    user = current_user._get_current_object()
    logout_user()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})


# ====================== SESSION MANAGEMENT ======================

@app.route("/new_session", methods=["POST"])
@login_required
def new_session():
    """Create a new chat session (like clicking 'New Chat' in ChatGPT)."""
    new_s = ChatSession(user_id=current_user.id, session_title="New Chat")
    db.session.add(new_s)
    db.session.commit()
    print(f"🆕 New session created: {new_s.id} for user {current_user.username}")
    return jsonify({"session_id": new_s.id, "title": new_s.session_title, "created_at": new_s.created_at.isoformat()})


@app.route("/get_sessions", methods=["GET"])
@login_required
def get_sessions():
    """Get all past chat sessions for the sidebar."""
    sessions = (ChatSession.query
                .filter_by(user_id=current_user.id)
                .order_by(ChatSession.created_at.desc())
                .all())
    result = []
    for s in sessions:
        first_msg = (ChatMessage.query
                     .filter_by(session_id=s.id, sender='user')
                     .order_by(ChatMessage.created_at.asc())
                     .first())
        preview = first_msg.message[:50] + "..." if first_msg and len(first_msg.message) > 50 else (first_msg.message if first_msg else "Empty chat")
        result.append({
            "session_id": s.id,
            "title":      s.session_title,
            "preview":    preview,
            "created_at": s.created_at.strftime("%b %d, %Y %H:%M")
        })
    return jsonify({"sessions": result})


@app.route("/get_session_messages/<int:session_id>", methods=["GET"])
@login_required
def get_session_messages(session_id):
    """Load all messages from a specific session (view history)."""
    s = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not s:
        return jsonify({"error": "Session not found"}), 404

    messages = (ChatMessage.query
                .filter_by(session_id=session_id)
                .order_by(ChatMessage.created_at.asc())
                .all())
    result = []
    for msg in messages:
        entry = {
            "id":         msg.id,
            "sender":     msg.sender,
            "message":    msg.message,
            "emotion":    msg.emotion,
            "sentiment":  msg.sentiment,
            "conflict":   msg.conflict,
            "created_at": msg.created_at.strftime("%H:%M")
        }
        if msg.analytics:
            entry["analytics"] = {
                "naive_bayes":  {"sentiment": msg.analytics.naive_bayes_sentiment,  "confidence": msg.analytics.naive_bayes_confidence},
                "logistic":     {"sentiment": msg.analytics.logistic_sentiment,     "confidence": msg.analytics.logistic_confidence},
                "bert":         {"sentiment": msg.analytics.bert_sentiment,         "confidence": msg.analytics.bert_confidence},
                "final":        msg.analytics.final_sentiment,
                "agreement":    msg.analytics.agreement
            }
        result.append(entry)

    return jsonify({
        "session_id": session_id,
        "title":      s.session_title,
        "messages":   result
    })


@app.route("/rename_session/<int:session_id>", methods=["POST"])
@login_required
def rename_session(session_id):
    """Rename a session title."""
    s = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not s:
        return jsonify({"error": "Session not found"}), 404
    data  = request.get_json()
    title = data.get("title", "New Chat").strip()
    s.session_title = title[:255]
    db.session.commit()
    return jsonify({"success": True, "title": s.session_title})


@app.route("/delete_session/<int:session_id>", methods=["DELETE"])
@login_required
def delete_session(session_id):
    """Delete a session and all its messages."""
    s = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not s:
        return jsonify({"error": "Session not found"}), 404
    db.session.delete(s)
    db.session.commit()
    print(f"🗑️ Session {session_id} deleted")
    return jsonify({"success": True})


# ====================== EMOTION GREETING ======================

@app.route("/emotion_greeting", methods=["POST"])
@login_required
def emotion_greeting():
    data     = request.get_json()
    emotion  = data.get("emotion", "neutral")
    greeting = random.choice(emotion_greetings.get(emotion, emotion_greetings["neutral"]))
    return jsonify({"greeting": greeting, "emotion": emotion})


# ====================== MAIN CHAT ======================

@app.route("/chat", methods=["POST"])
@login_required
def chat():
    try:
        data         = request.get_json()
        user_message = data.get("message", "").strip()
        emotion      = data.get("emotion", "neutral")
        session_id   = data.get("session_id")

        if not user_message:
            return jsonify({"error": "Empty message"}), 400

        if session_id:
            chat_session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
        else:
            chat_session = None

        if not chat_session:
            chat_session = ChatSession(user_id=current_user.id, session_title="New Chat")
            db.session.add(chat_session)
            db.session.flush()

        if chat_session.session_title == "New Chat":
            chat_session.session_title = user_message[:40] + ("..." if len(user_message) > 40 else "")

        user_msg_row = ChatMessage(
            session_id = chat_session.id,
            sender     = 'user',
            message    = user_message,
            emotion    = emotion
        )
        db.session.add(user_msg_row)
        db.session.flush()

        emotion_context = {
            "happy":     "The user looks cheerful and positive",
            "sad":       "The user looks sad and needs support",
            "angry":     "The user looks upset and frustrated",
            "surprised": "The user looks surprised",
            "fearful":   "The user looks anxious or worried",
            "disgusted": "The user looks uncomfortable or displeased",
            "neutral":   "The user looks calm"
        }

        recent_msgs = (ChatMessage.query
                       .filter_by(session_id=chat_session.id)
                       .order_by(ChatMessage.created_at.desc())
                       .limit(10).all())[::-1]

        groq_messages = [
            {"role": "system", "content": (
                f"You are an empathetic chatbot. "
                f"{emotion_context.get(emotion, 'The user is talking to you.')} "
                f"Respond with empathy and emotional intelligence. "
                f"Keep responses friendly and supportive. "
                f"Always acknowledge their emotional state."
            )}
        ]
        for m in recent_msgs:
            role = "user" if m.sender == "user" else "assistant"
            groq_messages.append({"role": role, "content": m.message})

        try:
            reply = create_groq_reply(groq_messages)
        except Exception as e:
            print(f"❌ Groq error: {e}")
            reply = _fallback_response(emotion)

        try:
            sr              = predict_all(user_message)
            final_sentiment = sr["final_sentiment"]
            conflict        = detect_conflict(emotion, final_sentiment)
        except Exception as e:
            print(f"❌ Sentiment error: {e}")
            sr, final_sentiment, conflict = None, "positive", False

        user_msg_row.sentiment = final_sentiment
        user_msg_row.conflict  = conflict

        bot_msg_row = ChatMessage(
            session_id = chat_session.id,
            sender     = 'bot',
            message    = reply,
            emotion    = emotion,
            sentiment  = None,
            conflict   = False
        )
        db.session.add(bot_msg_row)
        db.session.flush()

        if sr:
            analytics_row = EmotionAnalytics(
                message_id             = user_msg_row.id,
                naive_bayes_sentiment  = sr["naive_bayes"]["sentiment"],
                naive_bayes_confidence = sr["naive_bayes"]["confidence"],
                logistic_sentiment     = sr["logistic_regression"]["sentiment"],
                logistic_confidence    = sr["logistic_regression"]["confidence"],
                bert_sentiment         = sr["distilbert"]["sentiment"],
                bert_confidence        = sr["distilbert"]["confidence"],
                final_sentiment        = sr["final_sentiment"],
                agreement              = sr["agreement"]
            )
            db.session.add(analytics_row)

        db.session.commit()

        print(f"💬 [{current_user.username}] Session {chat_session.id} | "
              f"Emotion: {emotion} | Sentiment: {final_sentiment} | Conflict: {conflict}")

        return jsonify({
            "reply":      reply,
            "sentiment":  final_sentiment,
            "emotion":    emotion,
            "conflict":   conflict,
            "session_id": chat_session.id,
            "model_breakdown": {
                "naive_bayes":         {"sentiment": sr["naive_bayes"]["sentiment"],         "confidence": str(sr["naive_bayes"]["confidence"])},
                "logistic_regression": {"sentiment": sr["logistic_regression"]["sentiment"], "confidence": str(sr["logistic_regression"]["confidence"])},
                "distilbert":          {"sentiment": sr["distilbert"]["sentiment"],          "confidence": str(sr["distilbert"]["confidence"])},
                "agreement":           sr["agreement"]
            } if sr else {}
        })

    except Exception as e:
        db.session.rollback()
        print(f"❌ Chat error: {e}")
        return jsonify({"reply": "Sorry, something went wrong. Please try again."})


def _fallback_response(emotion):
    responses = {
        "happy":     "That's wonderful! 😊 Tell me more!",
        "sad":       "I'm here for you 😔 Take your time.",
        "angry":     "I understand your frustration 😟 Let's work through it.",
        "surprised": "That sounds surprising! 😲 Tell me more!",
        "fearful":   "It's okay to feel worried 😰 I'm here with you.",
        "disgusted": "I can see you're uncomfortable 😣 What happened?",
        "neutral":   "Thanks for sharing 🙂 Go on..."
    }
    return responses.get(emotion, "I'm here for you. Tell me more.")


# ====================== WEEKLY SUMMARY ======================

@app.route("/weekly_summary", methods=["GET"])
@login_required
def weekly_summary():
    week_end_dt   = datetime.utcnow()
    week_start_dt = week_end_dt - timedelta(days=7)

    msgs = (ChatMessage.query
            .join(ChatSession)
            .filter(
                ChatSession.user_id    == current_user.id,
                ChatMessage.sender     == 'user',
                ChatMessage.created_at >= week_start_dt
            )
            .all())

    if not msgs:
        return jsonify({
            "summary": "No chat data found this week. Start chatting! 🤖",
            "stats":   {}
        })

    emotions   = [m.emotion   for m in msgs if m.emotion]
    sentiments = [m.sentiment for m in msgs if m.sentiment]
    conflicts  = sum(1 for m in msgs if m.conflict)
    total      = len(msgs)

    emotion_counts   = dict(Counter(emotions))
    sentiment_counts = dict(Counter(sentiments))

    positive_count   = sentiments.count("positive")
    negative_count   = sentiments.count("negative")
    happy_pct        = round((positive_count / total) * 100, 1) if total > 0 else 0
    dominant_emotion = Counter(emotions).most_common(1)[0][0] if emotions else "neutral"

    if happy_pct >= 70:
        conclusion = (f"😊 Overall this week you were mostly HAPPY! "
                      f"{happy_pct}% of your messages were positive. "
                      f"Keep up the great mood!")
        mood = "positive"
    elif happy_pct >= 40:
        conclusion = (f"😐 You had a mixed week. "
                      f"{happy_pct}% positive vs {100 - happy_pct}% negative messages. "
                      f"Some ups and downs — that's normal!")
        mood = "mixed"
    else:
        conclusion = (f"😔 This week seemed a bit tough. "
                      f"Only {happy_pct}% positive messages. "
                      f"I hope next week is better! 💙")
        mood = "negative"

    stats = {
        "total_messages":   total,
        "positive_count":   positive_count,
        "negative_count":   negative_count,
        "happy_pct":        happy_pct,
        "conflicts":        conflicts,
        "dominant_emotion": dominant_emotion,
        "emotion_counts":   emotion_counts,
        "sentiment_counts": sentiment_counts,
        "period":           f"{week_start_dt.strftime('%b %d')} – {week_end_dt.strftime('%b %d, %Y')}"
    }

    if request.args.get("save") == "1":
        existing = WeeklyReport.query.filter_by(
            user_id    = current_user.id,
            week_start = week_start_dt.date(),
            week_end   = week_end_dt.date()
        ).first()
        if not existing:
            report = WeeklyReport(
                user_id             = current_user.id,
                week_start          = week_start_dt.date(),
                week_end            = week_end_dt.date(),
                dominant_emotion    = dominant_emotion,
                positive_percentage = happy_pct,
                conclusion          = conclusion
            )
            db.session.add(report)
            db.session.commit()
            print(f"📊 Weekly report saved for {current_user.username}")

    return jsonify({
        "summary": conclusion,
        "mood":    mood,
        "stats":   stats
    })


@app.route("/weekly_report_history", methods=["GET"])
@login_required
def weekly_report_history():
    """View all past saved weekly reports."""
    reports = (WeeklyReport.query
               .filter_by(user_id=current_user.id)
               .order_by(WeeklyReport.created_at.desc())
               .all())
    result = [{
        "id":                  r.id,
        "week_start":          r.week_start.strftime("%b %d, %Y") if r.week_start else "-",
        "week_end":            r.week_end.strftime("%b %d, %Y")   if r.week_end   else "-",
        "dominant_emotion":    r.dominant_emotion,
        "positive_percentage": r.positive_percentage,
        "conclusion":          r.conclusion,
        "created_at":          r.created_at.strftime("%b %d, %Y")
    } for r in reports]
    return jsonify({"reports": result})


# ====================== CLEAR / UTILITY ======================

@app.route("/clear_history", methods=["POST"])
@login_required
def clear_history():
    """Clear in-memory context only (DB history kept)."""
    return jsonify({"status": "cleared"})


# ====================== RUN ======================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ All database tables ready!")

    print("\n" + "=" * 70)
    print("🤖 Emotion-Aware Chatbot  |  Groq + Real Sentiment Models")
    print("✅ Groq: llama-3.3-70b-versatile → fallback openai/gpt-oss-120b")
    print("✅ Sentiment: NB + LR + DistilBERT (majority vote)")
    print("✅ Storage: MySQL via XAMPP")
    print("=" * 70 + "\n")

    import webbrowser, threading
    threading.Timer(2.0, lambda: webbrowser.open_new_tab("http://127.0.0.1:5000/")).start()
    app.run(debug=True, use_reloader=False, port=5000)
