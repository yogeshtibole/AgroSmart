from flask import Flask, render_template, request, redirect, flash, jsonify, session
from database import get_connection
import requests, os, hashlib

app = Flask(__name__)
app.secret_key = "agrosmart_secret_2025"
API_KEY = "c77ad771da8c51df70707890f376e2d5"

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def hash_pwd(p): return hashlib.sha256(p.encode()).hexdigest()

# ── DB ──────────────────────────────────────────────────────────────────────
def db_exec(query, params=(), fetch=None):
    conn = cur = None
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute(query, params)
        if fetch == 'one':  return cur.fetchone()
        if fetch == 'all':  return cur.fetchall()
        conn.commit(); return True
    except Exception as e:
        print("DB Error:", e); return None if fetch else False
    finally:
        if cur: cur.close()
        if conn: conn.close()

def ensure_tables():
    db_exec("""
        CREATE TABLE IF NOT EXISTS farmers (
            id SERIAL PRIMARY KEY, name VARCHAR(100), location VARCHAR(100),
            phone TEXT, farm_size FLOAT, soil_ph FLOAT,
            soil_type VARCHAR(50), profile_pic TEXT, password TEXT,
            theme VARCHAR(20) DEFAULT 'light', language VARCHAR(10) DEFAULT 'en',
            bio TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='farmers_phone_unique') THEN
                ALTER TABLE farmers ADD CONSTRAINT farmers_phone_unique UNIQUE (phone);
            END IF;
        END$$;
    """)
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_pic TEXT")
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS password TEXT")
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light'")
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en'")
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS bio TEXT")
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    db_exec("""
        CREATE TABLE IF NOT EXISTS login_history (
            id SERIAL PRIMARY KEY, phone TEXT NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id SERIAL PRIMARY KEY, phone TEXT NOT NULL,
            action TEXT NOT NULL, page VARCHAR(50) DEFAULT 'general',
            action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS page VARCHAR(50) DEFAULT 'general'")
    db_exec("""
        CREATE TABLE IF NOT EXISTS crop_diary (
            id SERIAL PRIMARY KEY, phone TEXT NOT NULL,
            title VARCHAR(200) DEFAULT 'Field Note', crop VARCHAR(100),
            note TEXT NOT NULL, mood VARCHAR(20) DEFAULT 'good',
            note_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS crop_calendar_entries (
            id SERIAL PRIMARY KEY, phone TEXT NOT NULL,
            crop VARCHAR(100) NOT NULL, region VARCHAR(100),
            sow_date DATE, harvest_date DATE, notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS community_posts (
            id SERIAL PRIMARY KEY, phone TEXT NOT NULL,
            title VARCHAR(300) NOT NULL, body TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'general', image_path TEXT,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_path TEXT")
    db_exec("""
        CREATE TABLE IF NOT EXISTS community_likes (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
            phone TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, phone)
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS community_replies (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
            phone TEXT NOT NULL, body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS community_messages (
            id SERIAL PRIMARY KEY, sender_phone TEXT NOT NULL,
            receiver_phone TEXT NOT NULL, message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS community_follows (
            id SERIAL PRIMARY KEY, follower_phone TEXT NOT NULL,
            following_phone TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_phone, following_phone)
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS community_shares (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
            phone TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            owner_phone TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'like',
            actor_phone TEXT,
            actor_name TEXT,
            text TEXT,
            link TEXT DEFAULT '',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ All tables ready")

def farmer_exists(phone):
    return db_exec("SELECT 1 FROM farmers WHERE phone=%s", (phone,), fetch='one') is not None

def get_user(phone):
    r = db_exec(
        "SELECT name, location, phone, farm_size, soil_ph, soil_type, profile_pic, password, theme, language, bio FROM farmers WHERE phone=%s",
        (phone,), fetch='one')
    return r

def log_activity(phone, action, page='general'):
    db_exec("INSERT INTO activity_log (phone, action, page) VALUES (%s,%s,%s)", (phone, action, page))

def page_icon(page):
    return {'dashboard':'📊','weather':'🌦','crop_advisor':'🌱','irrigation':'💧',
            'yield_calculator':'📈','ai_diagnosis':'🧠','profile':'👨‍🌾',
            'history':'🕒','login':'🔑','general':'⚡'}.get(page or 'general','⚡')
app.jinja_env.globals['page_icon'] = page_icon

# ✅ Called at module level so gunicorn also runs it on startup
try:
    ensure_tables()
except Exception as e:
    print(f"⚠️ ensure_tables warning: {e}")

# ── WEATHER ADVICE ──────────────────────────────────────────────────────────
def get_weather_advice(temp, humidity, desc):
    d = desc.lower()
    if temp < 0:   return "🥶 Freezing! Protect crops with covers/mulch.", "danger"
    if temp < 5:   return "❄️ Very cold. High frost risk. Cover seedlings.", "danger"
    if temp < 10:  return "🌨️ Cold. Good for spinach, mustard, wheat.", "info"
    if temp < 15:  return "🌡️ Cool. Excellent for Rabi crops (wheat, gram).", "info"
    if "thunderstorm" in d: return "⛈️ Thunderstorm! Stay off the field.", "danger"
    if "snow" in d:         return "❄️ Snowfall! Cover crops immediately.", "danger"
    if "fog" in d or "mist" in d or "haze" in d: return "🌫️ Foggy. Risk of fungal disease.", "warning"
    if "drizzle" in d: return "🌦️ Light drizzle. Skip irrigation today.", "info"
    if "rain" in d:    return "🌧️ Rain expected. Do NOT irrigate today.", "info"
    if humidity > 90:  return "💧 Extremely high humidity! Apply fungicide.", "danger"
    if humidity > 80:  return "💦 High humidity. Monitor for fungal disease.", "warning"
    if temp > 45:  return "🔥 Extreme heat! Irrigate immediately.", "danger"
    if temp > 40:  return "🥵 Very high temp! Irrigate morning and evening.", "danger"
    if temp > 35:  return "🌡️ High temperature. Increase irrigation.", "warning"
    if temp > 30:  return "☀️ Warm. Good for Kharif crops.", "warning"
    if humidity < 20: return "🏜️ Very dry air. Increase irrigation.", "warning"
    return "✅ Ideal farming conditions! Good time for sowing or fertilizer.", "success"

# ── ROUTES ──────────────────────────────────────────────────────────────────
@app.route("/")
def home(): return redirect("/login")

@app.route("/login")
def login(): return render_template("login.html")

@app.route('/simple_login', methods=['POST'])
def simple_login():
    data     = request.get_json(silent=True) or {}
    mobile   = data.get('mobile','').strip()
    password = data.get('password','').strip()
    mode     = data.get('mode','phone_only')
    if not mobile: return jsonify({"status":"fail","msg":"No mobile number"})

    if mode == 'with_password':
        user = db_exec("SELECT name,location,phone,farm_size,soil_ph,soil_type,profile_pic,password FROM farmers WHERE phone=%s",(mobile,),fetch='one')
        if not user: return jsonify({"status":"fail","msg":"Phone not registered. Please register first."})
        if not user[7]: return jsonify({"status":"fail","msg":"No password set. Use phone login."})
        if user[7] != hash_pwd(password): return jsonify({"status":"fail","msg":"Wrong password."})
        session['user'] = mobile
        db_exec("INSERT INTO login_history (phone) VALUES (%s)",(mobile,))
        log_activity(mobile,"Logged in with password","login")
        return jsonify({"status":"success","name":user[0] or "","phone":mobile,
                        "location":user[1] or "","farm_size":str(user[3]) if user[3] else "",
                        "soil_ph":str(user[4]) if user[4] else "","soil_type":user[5] or ""})

    session['user'] = mobile
    if not farmer_exists(mobile): db_exec("INSERT INTO farmers (phone) VALUES (%s)",(mobile,))
    db_exec("INSERT INTO login_history (phone) VALUES (%s)",(mobile,))
    log_activity(mobile,"Logged in","login")
    user = get_user(mobile)
    return jsonify({"status":"success","name":user[0] if user and user[0] else "",
                    "phone":mobile,"location":user[1] if user and user[1] else "",
                    "farm_size":str(user[3]) if user and user[3] else "",
                    "soil_ph":str(user[4]) if user and user[4] else "",
                    "soil_type":user[5] if user and user[5] else "",
                    "profile_pic":user[6] if user and user[6] else ""})

@app.route("/set_password", methods=["POST"])
def set_password():
    if 'user' not in session: return redirect("/login")
    phone    = session['user']
    curr     = request.form.get("current_password","").strip()
    new_pwd  = request.form.get("new_password","").strip()
    confirm  = request.form.get("confirm_password","").strip()
    if len(new_pwd) < 6:
        flash("❌ Password must be at least 6 characters.","danger"); return redirect("/settings")
    if new_pwd != confirm:
        flash("❌ Passwords do not match.","danger"); return redirect("/settings")
    user = get_user(phone)
    if user and user[7]:
        if not curr or user[7] != hash_pwd(curr):
            flash("❌ Current password is wrong.","danger"); return redirect("/settings")
    db_exec("UPDATE farmers SET password=%s WHERE phone=%s",(hash_pwd(new_pwd), phone))
    log_activity(phone,"Changed password","settings")
    flash("✅ Password updated successfully!","success")
    return redirect("/settings")

@app.route("/save_profile", methods=["POST"])
def save_profile():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    name      = request.form.get("name","").strip()
    location  = request.form.get("location","").strip()
    farm_size = request.form.get("farm_size") or None
    soil_ph   = request.form.get("soil_ph") or None
    soil_type = request.form.get("soil_type","").strip()
    bio       = request.form.get("bio","").strip()
    pic_path  = None
    if 'profile_pic' in request.files:
        f = request.files['profile_pic']
        if f and f.filename:
            ext = os.path.splitext(f.filename)[1].lower()
            filename = f"pic_{phone}{ext}"
            f.save(os.path.join(UPLOAD_FOLDER, filename))
            pic_path = f"uploads/{filename}"
    if farmer_exists(phone):
        if pic_path: ok = db_exec("UPDATE farmers SET name=%s,location=%s,farm_size=%s,soil_ph=%s,soil_type=%s,profile_pic=%s,bio=%s WHERE phone=%s",(name,location,farm_size,soil_ph,soil_type,pic_path,bio,phone))
        else:        ok = db_exec("UPDATE farmers SET name=%s,location=%s,farm_size=%s,soil_ph=%s,soil_type=%s,bio=%s WHERE phone=%s",(name,location,farm_size,soil_ph,soil_type,bio,phone))
    else:
        if pic_path: ok = db_exec("INSERT INTO farmers (phone,name,location,farm_size,soil_ph,soil_type,profile_pic,bio) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",(phone,name,location,farm_size,soil_ph,soil_type,pic_path,bio))
        else:        ok = db_exec("INSERT INTO farmers (phone,name,location,farm_size,soil_ph,soil_type,bio) VALUES (%s,%s,%s,%s,%s,%s,%s)",(phone,name,location,farm_size,soil_ph,soil_type,bio))
    if ok: log_activity(phone,"Updated profile","profile")
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        user = get_user(phone)
        return jsonify({"status":"success" if ok else "fail",
            "name":user[0] if user and user[0] else name,
            "location":user[1] if user and user[1] else location,
            "farm_size":str(user[3]) if user and user[3] else "",
            "soil_ph":str(user[4]) if user and user[4] else "",
            "soil_type":user[5] if user and user[5] else soil_type,
            "profile_pic":user[6] if user and user[6] else ""})
    if ok: flash("✅ Profile saved!","success")
    else:  flash("Something went wrong.","danger")
    return redirect("/profile")

# ── SETTINGS ─────────────────────────────────────────────────────────────────
@app.route("/settings", methods=["GET"])
def settings():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited Settings","settings")
    return render_template("settings.html", user=get_user(session['user']))

@app.route("/save_settings", methods=["POST"])
def save_settings():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone    = session['user']
    theme    = request.form.get("theme","light").strip()
    language = request.form.get("language","en").strip()
    db_exec("UPDATE farmers SET theme=%s, language=%s WHERE phone=%s",(theme, language, phone))
    log_activity(phone,"Updated settings","settings")
    flash("✅ Settings saved!","success")
    return redirect("/settings")

@app.route("/dashboard")
def dashboard():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited Dashboard","dashboard")
    return render_template("dashboard.html", user=get_user(session['user']))

@app.route("/profile", methods=["GET"])
def profile():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited Profile","profile")
    return render_template("profile.html", user=get_user(session['user']))

@app.route("/history")
def history():
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    logins   = db_exec("SELECT id, login_time FROM login_history WHERE phone=%s ORDER BY login_time DESC LIMIT 50",(phone,),fetch='all') or []
    activity = db_exec("SELECT id, action, action_time, page FROM activity_log WHERE phone=%s ORDER BY action_time DESC LIMIT 200",(phone,),fetch='all') or []
    return render_template("history.html", user=get_user(phone), login_history=logins, activity=activity)

@app.route("/delete_history", methods=["POST"])
def delete_history():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    mode  = data.get("mode"); hid = data.get("id"); htype = data.get("type")
    if mode == "all":
        db_exec("DELETE FROM login_history WHERE phone=%s",(phone,))
        db_exec("DELETE FROM activity_log WHERE phone=%s",(phone,))
    elif mode == "all_logins":   db_exec("DELETE FROM login_history WHERE phone=%s",(phone,))
    elif mode == "all_activity": db_exec("DELETE FROM activity_log WHERE phone=%s",(phone,))
    elif hid and htype == "login":    db_exec("DELETE FROM login_history WHERE id=%s AND phone=%s",(hid,phone))
    elif hid and htype == "activity": db_exec("DELETE FROM activity_log WHERE id=%s AND phone=%s",(hid,phone))
    else: return jsonify({"status":"fail"})
    return jsonify({"status":"success"})

@app.route("/weather", methods=["GET","POST"])
def weather():
    if 'user' not in session: return redirect("/login")
    user, weather_data = get_user(session['user']), None
    if request.method == "POST":
        city = request.form.get("city","").strip()
        if not city: flash("Please enter a city name!","warning")
        else:
            try:
                data = requests.get(f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric",timeout=5).json()
                if data.get("cod")==200:
                    temp,humidity = data["main"]["temp"],data["main"]["humidity"]
                    desc = data["weather"][0]["description"].title()
                    advice,atype = get_weather_advice(temp,humidity,desc)
                    weather_data = {"city":city.title(),"temp":temp,"humidity":humidity,
                                    "description":desc,"icon":data["weather"][0]["icon"],
                                    "wind":data["wind"]["speed"],"feels":data["main"]["feels_like"],
                                    "advice":advice,"advice_type":atype}
                    log_activity(session['user'],f"Searched weather: {city.title()}","weather")
                else: flash("City not found!","danger")
            except Exception as e: print("Weather Error:",e); flash("Error fetching weather!","danger")
    return render_template("weather.html", weather=weather_data, user=user)

@app.route("/crop_advisor")
def crop_advisor():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited Crop Advisor","crop_advisor")
    return render_template("crop_advisor.html", user=get_user(session['user']))

@app.route("/irrigation")
def irrigation():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited Irrigation","irrigation")
    return render_template("irrigation.html", user=get_user(session['user']))

@app.route("/yield_calculator")
def yield_calculator():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited Yield Calculator","yield_calculator")
    return render_template("yield_calculator.html", user=get_user(session['user']))

@app.route("/ai_diagnosis")
def ai_diagnosis():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'],"Visited AI Diagnosis","ai_diagnosis")
    return render_template("ai_diagnosis.html", user=get_user(session['user']))

@app.route("/set_password_ajax", methods=["POST"])
def set_password_ajax():
    if 'user' not in session:
        return jsonify({"status":"fail","msg":"Not logged in"}), 401
    phone   = session['user']
    data    = request.get_json(silent=True) or {}
    new_pwd = data.get('new_password','').strip()
    if len(new_pwd) < 6:
        return jsonify({"status":"fail","msg":"Password too short"})
    db_exec("UPDATE farmers SET password=%s WHERE phone=%s", (hash_pwd(new_pwd), phone))
    log_activity(phone, "Set password during registration", "login")
    return jsonify({"status":"success"})

@app.route("/logout")
def logout():
    if 'user' in session: log_activity(session['user'],"Logged out","login")
    session.clear(); return redirect("/login")

# ── CROP CALENDAR ─────────────────────────────────────────────────────────────
@app.route("/crop_calendar")
def crop_calendar():
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    saved = db_exec("SELECT id, crop, region, sow_date, harvest_date, notes, created_at FROM crop_calendar_entries WHERE phone=%s ORDER BY created_at DESC",(phone,),fetch='all') or []
    log_activity(phone, "Visited Crop Calendar", "crop_calendar")
    return render_template("crop_calendar.html", user=get_user(phone), saved_entries=saved)

@app.route("/crop_calendar/save", methods=["POST"])
def save_calendar_entry():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    crop  = data.get('crop','').strip()
    region= data.get('region','').strip()
    notes = data.get('notes','').strip()
    if not crop: return jsonify({"status":"fail","msg":"Crop required"})
    db_exec("INSERT INTO crop_calendar_entries (phone,crop,region,notes) VALUES (%s,%s,%s,%s)",(phone,crop,region,notes))
    log_activity(phone,f"Saved calendar entry: {crop}","crop_calendar")
    return jsonify({"status":"success"})

@app.route("/crop_calendar/delete", methods=["POST"])
def delete_calendar_entry():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    eid   = data.get('id')
    if not eid: return jsonify({"status":"fail"})
    db_exec("DELETE FROM crop_calendar_entries WHERE id=%s AND phone=%s",(eid,phone))
    return jsonify({"status":"success"})

# ── FERTILIZER ────────────────────────────────────────────────────────────────
@app.route("/fertilizer")
def fertilizer():
    if 'user' not in session: return redirect("/login")
    log_activity(session['user'], "Visited Fertilizer Calculator", "fertilizer")
    return render_template("fertilizer.html", user=get_user(session['user']))

# ── CROP DIARY ────────────────────────────────────────────────────────────────
@app.route("/crop_diary")
def crop_diary():
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    notes = db_exec(
        "SELECT id, title, crop, note, mood, note_date, created_at FROM crop_diary WHERE phone=%s ORDER BY note_date DESC, created_at DESC LIMIT 100",
        (phone,), fetch='all') or []
    log_activity(phone, "Visited Crop Diary", "crop_diary")
    return render_template("crop_diary.html", user=get_user(phone), notes=notes)

@app.route("/crop_diary/add", methods=["POST"])
def add_diary_note():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    title = data.get('title','').strip()
    crop  = data.get('crop','').strip()
    note  = data.get('note','').strip()
    mood  = data.get('mood','good')
    date  = data.get('date','')
    if not note: return jsonify({"status":"fail","msg":"Note cannot be empty"})
    db_exec(
        "INSERT INTO crop_diary (phone,title,crop,note,mood,note_date) VALUES (%s,%s,%s,%s,%s,%s)",
        (phone, title or 'Field Note', crop, note, mood, date or None))
    log_activity(phone, f"Added diary note: {title or 'Field Note'}", "crop_diary")
    return jsonify({"status":"success"})

@app.route("/crop_diary/delete", methods=["POST"])
def delete_diary_note():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    nid   = data.get('id')
    if not nid: return jsonify({"status":"fail"})
    db_exec("DELETE FROM crop_diary WHERE id=%s AND phone=%s", (nid, phone))
    return jsonify({"status":"success"})

# ── COMMUNITY (Instagram-style) ───────────────────────────────────────────────
@app.route("/community")
def community():
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    q     = request.args.get('q','').strip()
    search_results = []
    if q:
        search_results = db_exec("""
            SELECT phone, name, location, profile_pic,
                   (SELECT COUNT(*) FROM community_posts WHERE phone=f.phone) AS posts,
                   (SELECT COUNT(*) FROM community_follows WHERE following_phone=f.phone) AS followers
            FROM farmers f
            WHERE LOWER(name) LIKE %s OR phone LIKE %s
            LIMIT 20
        """, (f'%{q.lower()}%', f'%{q}%'), fetch='all') or []

    posts = db_exec("""
        SELECT p.id, p.phone, f.name, p.title, p.body, p.category, p.likes,
               p.created_at, p.image_path,
               (SELECT COUNT(*) FROM community_replies r WHERE r.post_id=p.id) AS reply_count,
               f.profile_pic,
               EXISTS(SELECT 1 FROM community_likes l WHERE l.post_id=p.id AND l.phone=%s) AS liked
        FROM community_posts p
        LEFT JOIN farmers f ON f.phone=p.phone
        ORDER BY p.created_at DESC LIMIT 50
    """, (phone,), fetch='all') or []

    farmers_list = db_exec("""
        SELECT phone, name, location, profile_pic,
               (SELECT COUNT(*) FROM community_posts WHERE phone=f.phone) AS posts,
               (SELECT COUNT(*) FROM community_follows WHERE following_phone=f.phone) AS followers
        FROM farmers f
        WHERE phone != %s
        ORDER BY (SELECT COUNT(*) FROM community_follows WHERE following_phone=f.phone) DESC
        LIMIT 10
    """, (phone,), fetch='all') or []

    log_activity(phone, "Visited Community", "community")
    return render_template("community.html", user=get_user(phone), posts=posts,
                           farmers_list=farmers_list, search_results=search_results, search_query=q)

@app.route("/community/farmer/<farmer_phone>")
def farmer_profile(farmer_phone):
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    farmer = db_exec(
        "SELECT name, location, phone, farm_size, soil_ph, soil_type, profile_pic, bio FROM farmers WHERE phone=%s",
        (farmer_phone,), fetch='one')
    if not farmer: return redirect("/community")
    posts = db_exec("""
        SELECT p.id, p.phone, f.name, p.title, p.body, p.category, p.likes, p.created_at, p.image_path,
               (SELECT COUNT(*) FROM community_replies r WHERE r.post_id=p.id) AS reply_count
        FROM community_posts p LEFT JOIN farmers f ON f.phone=p.phone
        WHERE p.phone=%s ORDER BY p.created_at DESC
    """, (farmer_phone,), fetch='all') or []
    followers = db_exec("SELECT COUNT(*) FROM community_follows WHERE following_phone=%s",(farmer_phone,),fetch='one')
    following = db_exec("SELECT COUNT(*) FROM community_follows WHERE follower_phone=%s",(farmer_phone,),fetch='one')
    is_following = db_exec("SELECT 1 FROM community_follows WHERE follower_phone=%s AND following_phone=%s",(phone,farmer_phone),fetch='one') is not None
    return render_template("farmer_profile.html", user=get_user(phone), farmer=farmer, posts=posts,
                           followers=followers[0] if followers else 0,
                           following_count=following[0] if following else 0,
                           is_following=is_following)

@app.route("/community/post", methods=["POST"])
def community_post():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    title = request.form.get('title','').strip()
    body  = request.form.get('body','').strip()
    cat   = request.form.get('category','general')
    img_path = None
    if 'image' in request.files:
        f = request.files['image']
        if f and f.filename:
            ext = os.path.splitext(f.filename)[1].lower()
            filename = f"post_{phone}_{int(__import__('time').time())}{ext}"
            f.save(os.path.join(UPLOAD_FOLDER, filename))
            img_path = f"uploads/{filename}"
    if not title or not body: return jsonify({"status":"fail","msg":"Title and message required"})
    db_exec("INSERT INTO community_posts (phone,title,body,category,image_path) VALUES (%s,%s,%s,%s,%s)",
            (phone, title, body, cat, img_path))
    log_activity(phone, f"Posted in community: {title}", "community")
    return jsonify({"status":"success"})

@app.route("/community/delete_post", methods=["POST"])
def delete_community_post():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    pid   = data.get('post_id')
    if not pid: return jsonify({"status":"fail"})
    db_exec("DELETE FROM community_posts WHERE id=%s AND phone=%s",(pid,phone))
    return jsonify({"status":"success"})

@app.route("/community/reply", methods=["POST"])
def community_reply():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    post_id = data.get('post_id')
    body    = data.get('body','').strip()
    if not post_id or not body: return jsonify({"status":"fail","msg":"Missing data"})
    db_exec("INSERT INTO community_replies (post_id,phone,body) VALUES (%s,%s,%s)",(post_id, phone, body))
    log_activity(phone, "Replied in community", "community")
    # Notify post owner
    user_row = get_user(phone)
    actor_name = user_row[0] if user_row else "A farmer"
    post_row = db_exec("SELECT phone FROM community_posts WHERE id=%s",(post_id,),fetch='one')
    if post_row:
        create_notification(post_row[0], 'comment', phone, actor_name,
            actor_name+" commented on your post", "/community/post/"+str(post_id))
    return jsonify({"status":"success"})

@app.route("/community/like", methods=["POST"])
def community_like():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone   = session['user']
    data    = request.get_json(silent=True) or {}
    post_id = data.get('post_id')
    if not post_id: return jsonify({"status":"fail"})
    existing = db_exec("SELECT 1 FROM community_likes WHERE post_id=%s AND phone=%s",(post_id,phone),fetch='one')
    if existing:
        db_exec("DELETE FROM community_likes WHERE post_id=%s AND phone=%s",(post_id,phone))
        db_exec("UPDATE community_posts SET likes=GREATEST(0,likes-1) WHERE id=%s",(post_id,))
        liked = False
    else:
        db_exec("INSERT INTO community_likes (post_id,phone) VALUES (%s,%s)",(post_id,phone))
        db_exec("UPDATE community_posts SET likes=likes+1 WHERE id=%s",(post_id,))
        liked = True
        # Notify post owner on like
        user_row = get_user(phone)
        actor_name = user_row[0] if user_row else "A farmer"
        post_row = db_exec("SELECT phone FROM community_posts WHERE id=%s",(post_id,),fetch='one')
        if post_row:
            create_notification(post_row[0], 'like', phone, actor_name,
                actor_name+" liked your post", "/community/post/"+str(post_id))
    row = db_exec("SELECT likes FROM community_posts WHERE id=%s",(post_id,),fetch='one')
    return jsonify({"status":"success","likes":row[0] if row else 0,"liked":liked})

@app.route("/community/share", methods=["POST"])
def community_share():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    pid   = data.get('post_id')
    if not pid: return jsonify({"status":"fail"})
    db_exec("INSERT INTO community_shares (post_id,phone) VALUES (%s,%s)",(pid,phone))
    # Notify post owner on share
    user_row = get_user(phone)
    actor_name = user_row[0] if user_row else "A farmer"
    post_row = db_exec("SELECT phone FROM community_posts WHERE id=%s",(pid,),fetch='one')
    if post_row:
        create_notification(post_row[0], 'share', phone, actor_name,
            actor_name+" shared your post", "/community/post/"+str(pid))
    return jsonify({"status":"success"})

@app.route("/community/follow", methods=["POST"])
def community_follow():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    target = data.get('phone')
    if not target or target == phone: return jsonify({"status":"fail"})
    existing = db_exec("SELECT 1 FROM community_follows WHERE follower_phone=%s AND following_phone=%s",(phone,target),fetch='one')
    if existing:
        db_exec("DELETE FROM community_follows WHERE follower_phone=%s AND following_phone=%s",(phone,target))
        return jsonify({"status":"success","action":"unfollowed"})
    else:
        db_exec("INSERT INTO community_follows (follower_phone,following_phone) VALUES (%s,%s)",(phone,target))
        # Notify the followed user
        user_row = get_user(phone)
        actor_name = user_row[0] if user_row else "A farmer"
        create_notification(target, 'follow', phone, actor_name,
            actor_name+" started following you", "/community/farmer/"+phone)
        return jsonify({"status":"success","action":"followed"})

@app.route("/community/message", methods=["POST"])
def send_message():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    to    = data.get('to','').strip()
    msg   = data.get('message','').strip()
    if not to or not msg: return jsonify({"status":"fail","msg":"Missing data"})
    db_exec("INSERT INTO community_messages (sender_phone,receiver_phone,message) VALUES (%s,%s,%s)",(phone,to,msg))
    # Create a message notification for the recipient
    sender = db_exec("SELECT name FROM farmers WHERE phone=%s", (phone,), fetch='one')
    sender_name = sender[0] if sender else "A farmer"
    create_notification(to, 'message', phone, sender_name,
                        f"{sender_name} sent you a message",
                        f"/community/farmer/{phone}")
    return jsonify({"status":"success"})

@app.route("/community/messages/<other_phone>")
def get_messages(other_phone):
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    msgs = db_exec("""
        SELECT sender_phone, message, created_at FROM community_messages
        WHERE (sender_phone=%s AND receiver_phone=%s) OR (sender_phone=%s AND receiver_phone=%s)
        ORDER BY created_at ASC LIMIT 100
    """,(phone,other_phone,other_phone,phone),fetch='all') or []
    db_exec("UPDATE community_messages SET is_read=TRUE WHERE receiver_phone=%s AND sender_phone=%s",(phone,other_phone))
    return jsonify({"status":"success","messages":[{"from":m[0],"text":m[1],"time":str(m[2])} for m in msgs]})

@app.route("/community/post/<int:post_id>")
def community_thread(post_id):
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    post = db_exec("""
        SELECT p.id, p.phone, f.name, p.title, p.body, p.category, p.likes, p.created_at, p.image_path, f.profile_pic
        FROM community_posts p LEFT JOIN farmers f ON f.phone=p.phone WHERE p.id=%s
    """, (post_id,), fetch='one')
    replies = db_exec("""
        SELECT r.id, r.phone, f.name, r.body, r.created_at, f.profile_pic
        FROM community_replies r LEFT JOIN farmers f ON f.phone=r.phone
        WHERE r.post_id=%s ORDER BY r.created_at ASC
    """, (post_id,), fetch='all') or []
    if not post: return redirect("/community")
    return render_template("community_thread.html", user=get_user(phone), post=post, replies=replies)

@app.route("/community/search")
def community_search():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    q = request.args.get('q','').strip()
    if not q: return jsonify({"status":"success","results":[]})
    results = db_exec("""
        SELECT phone, name, location, profile_pic FROM farmers
        WHERE LOWER(name) LIKE %s OR phone LIKE %s LIMIT 10
    """, (f'%{q.lower()}%', f'%{q}%'), fetch='all') or []
    return jsonify({"status":"success","results":[
        {"phone":r[0],"name":r[1] or "Farmer","location":r[2] or "","profile_pic":r[3] or ""} for r in results
    ]})

# ─── NOTIFICATION ROUTES ────────────────────────────────────────────────────

@app.route("/notifications/list")
def notifications_list():
    if 'user' not in session: return jsonify({"notifications": []})
    phone = session['user']
    try:
        notifs = db_exec("""
            SELECT id, type, actor_phone, actor_name, text, link, is_read, created_at
            FROM notifications WHERE owner_phone=%s ORDER BY created_at DESC LIMIT 30
        """, (phone,), fetch='all') or []
        return jsonify({"notifications": [
            {"id": n[0], "type": n[1], "actor": n[3] or "Someone",
             "text": n[4] or "", "link": n[5] or "", "read": bool(n[6]),
             "created_at": str(n[7])} for n in notifs
        ]})
    except Exception:
        return jsonify({"notifications": []})

@app.route("/notifications/count")
def notifications_count():
    if 'user' not in session: return jsonify({"count": 0})
    phone = session['user']
    try:
        row = db_exec("SELECT COUNT(*) FROM notifications WHERE owner_phone=%s AND is_read=FALSE", (phone,), fetch='one')
        return jsonify({"count": row[0] if row else 0})
    except Exception:
        return jsonify({"count": 0})

@app.route("/notifications/read", methods=["POST"])
def notifications_read():
    if 'user' not in session: return jsonify({"status": "fail"})
    phone = session['user']
    data = request.get_json(silent=True) or {}
    nid = data.get('id')
    try:
        db_exec("UPDATE notifications SET is_read=TRUE WHERE id=%s AND owner_phone=%s", (nid, phone))
    except Exception:
        pass
    return jsonify({"status": "success"})

@app.route("/notifications/read_all", methods=["POST"])
def notifications_read_all():
    if 'user' not in session: return jsonify({"status": "fail"})
    phone = session['user']
    try:
        db_exec("UPDATE notifications SET is_read=TRUE WHERE owner_phone=%s", (phone,))
    except Exception:
        pass
    return jsonify({"status": "success"})

@app.route("/community/followers/<farmer_phone>")
def community_followers(farmer_phone):
    if 'user' not in session: return jsonify({"users": []}), 401
    rows = db_exec("""
        SELECT f.phone, f.name, f.location, f.profile_pic
        FROM community_follows cf
        JOIN farmers f ON f.phone = cf.follower_phone
        WHERE cf.following_phone = %s
        ORDER BY f.name ASC LIMIT 100
    """, (farmer_phone,), fetch='all') or []
    return jsonify({"users": [
        {"phone": r[0], "name": r[1] or "Farmer", "location": r[2] or "", "pic": r[3] or ""}
        for r in rows
    ]})

@app.route("/community/following/<farmer_phone>")
def community_following(farmer_phone):
    if 'user' not in session: return jsonify({"users": []}), 401
    rows = db_exec("""
        SELECT f.phone, f.name, f.location, f.profile_pic
        FROM community_follows cf
        JOIN farmers f ON f.phone = cf.following_phone
        WHERE cf.follower_phone = %s
        ORDER BY f.name ASC LIMIT 100
    """, (farmer_phone,), fetch='all') or []
    return jsonify({"users": [
        {"phone": r[0], "name": r[1] or "Farmer", "location": r[2] or "", "pic": r[3] or ""}
        for r in rows
    ]})

@app.route("/community/stats/<farmer_phone>")
def community_stats(farmer_phone):
    if 'user' not in session: return jsonify({"posts": 0, "followers": 0, "following": 0}), 401
    posts = db_exec("SELECT COUNT(*) FROM community_posts WHERE phone=%s", (farmer_phone,), fetch='one')
    followers = db_exec("SELECT COUNT(*) FROM community_follows WHERE following_phone=%s", (farmer_phone,), fetch='one')
    following = db_exec("SELECT COUNT(*) FROM community_follows WHERE follower_phone=%s", (farmer_phone,), fetch='one')
    return jsonify({
        "posts":     posts[0] if posts else 0,
        "followers": followers[0] if followers else 0,
        "following": following[0] if following else 0
    })

@app.route("/community/messages/preview")
def messages_preview():
    if 'user' not in session: return jsonify({"messages": []}), 401
    phone = session['user']
    try:
        rows = db_exec("""
            SELECT DISTINCT ON (cm.sender_phone)
                cm.sender_phone, f.name, f.profile_pic,
                cm.message, cm.created_at, cm.is_read
            FROM community_messages cm
            LEFT JOIN farmers f ON f.phone = cm.sender_phone
            WHERE cm.receiver_phone = %s
            ORDER BY cm.sender_phone, cm.created_at DESC
            LIMIT 10
        """, (phone,), fetch='all') or []
        return jsonify({"messages": [
            {"from_phone": r[0], "from_name": r[1] or "Farmer",
             "from_pic": r[2] or "", "text": r[3] or "",
             "created_at": str(r[4]), "read": bool(r[5])}
            for r in rows
        ]})
    except Exception:
        return jsonify({"messages": []})

@app.route("/community/messages/unread_count")
def messages_unread_count():
    if 'user' not in session: return jsonify({"count": 0})
    phone = session['user']
    try:
        row = db_exec(
            "SELECT COUNT(*) FROM community_messages WHERE receiver_phone=%s AND is_read=FALSE",
            (phone,), fetch='one'
        )
        return jsonify({"count": row[0] if row else 0})
    except Exception:
        return jsonify({"count": 0})

def create_notification(owner_phone, ntype, actor_phone, actor_name, text, link=""):
    """Helper to insert a notification. Called from like/follow/comment routes."""
    if owner_phone == actor_phone:
        return  # don't notify yourself
    try:
        db_exec("""
            INSERT INTO notifications (owner_phone, type, actor_phone, actor_name, text, link)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (owner_phone, ntype, actor_phone, actor_name, text, link))
    except Exception:
        pass  # silently ignore if table doesn't exist yet

if __name__ == "__main__":
    ensure_tables()
    app.run(debug=True, host='0.0.0.0', port=5000)