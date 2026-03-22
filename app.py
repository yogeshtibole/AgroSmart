from flask import Flask, render_template, request, redirect, flash, jsonify, session
from database import get_connection
import requests, os

app = Flask(__name__)
app.secret_key = "agrosmart_secret_2025"
API_KEY = "c77ad771da8c51df70707890f376e2d5"

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── DB HELPERS ──────────────────────────────────────────────────────────────

def db_exec(query, params=(), fetch=None):
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(query, params)
        if fetch == 'one':  return cur.fetchone()
        if fetch == 'all':  return cur.fetchall()
        conn.commit()
        return True
    except Exception as e:
        print("DB Error:", e)
        return None if fetch else False
    finally:
        if cur:  cur.close()
        if conn: conn.close()


def ensure_tables():
    # Create farmers table (without UNIQUE first for safety)
    db_exec("""
        CREATE TABLE IF NOT EXISTS farmers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            location VARCHAR(100),
            phone TEXT,
            farm_size FLOAT,
            soil_ph FLOAT,
            soil_type VARCHAR(50),
            profile_pic TEXT
        )
    """)
    # ✅ Add UNIQUE constraint on phone if it doesn't exist yet
    # This is safe to run multiple times — it won't fail if already exists
    db_exec("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'farmers_phone_unique'
            ) THEN
                ALTER TABLE farmers ADD CONSTRAINT farmers_phone_unique UNIQUE (phone);
            END IF;
        END$$;
    """)
    # Add profile_pic column if missing (for old DBs)
    db_exec("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_pic TEXT")

    db_exec("""
        CREATE TABLE IF NOT EXISTS login_history (
            id SERIAL PRIMARY KEY,
            phone TEXT NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db_exec("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id SERIAL PRIMARY KEY,
            phone TEXT NOT NULL,
            action TEXT NOT NULL,
            action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ Tables ready")


def farmer_exists(phone):
    """Check if a farmer row exists for this phone."""
    r = db_exec("SELECT 1 FROM farmers WHERE phone=%s", (phone,), fetch='one')
    return r is not None


def get_user(phone):
    r = db_exec(
        "SELECT name, location, phone, farm_size, soil_ph, soil_type, profile_pic FROM farmers WHERE phone=%s",
        (phone,), fetch='one'
    )
    print(f"get_user({phone}) => {r}")
    return r


def log_activity(phone, action):
    db_exec("INSERT INTO activity_log (phone, action) VALUES (%s, %s)", (phone, action))


# ── WEATHER ADVICE ──────────────────────────────────────────────────────────

def get_weather_advice(temp, humidity, desc):
    d = desc.lower()
    if temp < 0:   return "🥶 Freezing! Protect crops with covers/mulch. Avoid irrigation.", "danger"
    if temp < 5:   return "❄️ Very cold. High frost risk. Cover seedlings.", "danger"
    if temp < 10:  return "🌨️ Cold weather. Good for spinach, mustard, wheat.", "info"
    if temp < 15:  return "🌡️ Cool. Excellent for Rabi crops (wheat, gram).", "info"
    if "thunderstorm" in d: return "⛈️ Thunderstorm! Stay off the field.", "danger"
    if "snow" in d:         return "❄️ Snowfall! Cover crops immediately.", "danger"
    if "fog" in d or "mist" in d or "haze" in d:
        return "🌫️ Foggy. Risk of fungal disease. Apply fungicide.", "warning"
    if "drizzle" in d: return "🌦️ Light drizzle. Skip irrigation today.", "info"
    if "rain" in d:    return "🌧️ Rain expected. Do NOT irrigate today.", "info"
    if humidity > 90:  return "💧 Extremely high humidity! Apply fungicide.", "danger"
    if humidity > 80:  return "💦 High humidity. Monitor for fungal disease.", "warning"
    if temp > 45:  return "🔥 Extreme heat! Irrigate immediately. Use shade nets.", "danger"
    if temp > 40:  return "🥵 Very high temp! Irrigate morning and evening.", "danger"
    if temp > 35:  return "🌡️ High temperature. Increase irrigation.", "warning"
    if temp > 30:  return "☀️ Warm. Good for Kharif crops (rice, maize, cotton).", "warning"
    if humidity < 20: return "🏜️ Very dry air. Increase irrigation.", "warning"
    return "✅ Ideal farming conditions! Good time for sowing or fertilizer.", "success"


# ── ROUTES ──────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return redirect("/login")

@app.route("/login")
def login():
    return render_template("login.html")


@app.route('/simple_login', methods=['POST'])
def simple_login():
    data   = request.get_json(silent=True) or {}
    mobile = data.get('mobile', '').strip()
    if not mobile:
        return jsonify({"status": "fail", "msg": "No mobile number"})

    session['user'] = mobile

    # ✅ FIX: Check if row exists first, then insert — no ON CONFLICT needed
    if not farmer_exists(mobile):
        db_exec("INSERT INTO farmers (phone) VALUES (%s)", (mobile,))

    db_exec("INSERT INTO login_history (phone) VALUES (%s)", (mobile,))
    log_activity(mobile, "Logged in")

    user = get_user(mobile)
    return jsonify({
        "status":      "success",
        "name":        user[0] if user and user[0] else "",
        "phone":       mobile,
        "location":    user[1] if user and user[1] else "",
        "farm_size":   str(user[3]) if user and user[3] else "",
        "soil_ph":     str(user[4]) if user and user[4] else "",
        "soil_type":   user[5] if user and user[5] else "",
        "profile_pic": user[6] if user and user[6] else ""
    })


@app.route("/save_profile", methods=["POST"])
def save_profile():
    if 'user' not in session:
        return jsonify({"status": "fail", "msg": "Not logged in"}), 401

    phone     = session['user']
    name      = request.form.get("name", "").strip()
    location  = request.form.get("location", "").strip()
    farm_size = request.form.get("farm_size") or None
    soil_ph   = request.form.get("soil_ph") or None
    soil_type = request.form.get("soil_type", "").strip()

    # Handle profile picture upload
    pic_path = None
    if 'profile_pic' in request.files:
        f = request.files['profile_pic']
        if f and f.filename:
            ext      = os.path.splitext(f.filename)[1].lower()
            filename = f"pic_{phone}{ext}"
            f.save(os.path.join(UPLOAD_FOLDER, filename))
            pic_path = f"uploads/{filename}"

    # ✅ FIX: Check if row exists, then UPDATE or INSERT — no ON CONFLICT needed
    if farmer_exists(phone):
        if pic_path:
            ok = db_exec("""
                UPDATE farmers
                SET name=%s, location=%s, farm_size=%s, soil_ph=%s, soil_type=%s, profile_pic=%s
                WHERE phone=%s
            """, (name, location, farm_size, soil_ph, soil_type, pic_path, phone))
        else:
            ok = db_exec("""
                UPDATE farmers
                SET name=%s, location=%s, farm_size=%s, soil_ph=%s, soil_type=%s
                WHERE phone=%s
            """, (name, location, farm_size, soil_ph, soil_type, phone))
    else:
        # Row doesn't exist — create it with all data
        if pic_path:
            ok = db_exec("""
                INSERT INTO farmers (phone, name, location, farm_size, soil_ph, soil_type, profile_pic)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (phone, name, location, farm_size, soil_ph, soil_type, pic_path))
        else:
            ok = db_exec("""
                INSERT INTO farmers (phone, name, location, farm_size, soil_ph, soil_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (phone, name, location, farm_size, soil_ph, soil_type))

    print(f"save_profile: {phone} -> name='{name}', location='{location}', ok={ok}")

    if ok:
        log_activity(phone, "Updated profile")

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        user = get_user(phone)
        return jsonify({
            "status":    "success" if ok else "fail",
            "name":      user[0] if user and user[0] else name,
            "location":  user[1] if user and user[1] else location,
            "farm_size": str(user[3]) if user and user[3] else "",
            "soil_ph":   str(user[4]) if user and user[4] else "",
            "soil_type": user[5] if user and user[5] else soil_type,
        })

    if ok:
        flash("✅ Profile saved successfully!", "success")
    else:
        flash("Something went wrong. Please try again.", "danger")
    return redirect("/profile")


@app.route("/dashboard")
def dashboard():
    if 'user' not in session: return redirect("/login")
    return render_template("dashboard.html", user=get_user(session['user']))

@app.route("/profile", methods=["GET"])
def profile():
    if 'user' not in session: return redirect("/login")
    return render_template("profile.html", user=get_user(session['user']))

@app.route("/history")
def history():
    if 'user' not in session: return redirect("/login")
    phone = session['user']
    login_history = db_exec(
        "SELECT id, login_time FROM login_history WHERE phone=%s ORDER BY login_time DESC LIMIT 50",
        (phone,), fetch='all') or []
    activity = db_exec(
        "SELECT id, action, action_time FROM activity_log WHERE phone=%s ORDER BY action_time DESC LIMIT 100",
        (phone,), fetch='all') or []
    return render_template("history.html", user=get_user(phone),
                           login_history=login_history, activity=activity)

@app.route("/delete_history", methods=["POST"])
def delete_history():
    if 'user' not in session: return jsonify({"status":"fail"}), 401
    phone = session['user']
    data  = request.get_json(silent=True) or {}
    mode  = data.get("mode")
    hid   = data.get("id")
    htype = data.get("type")
    if mode == "all":
        db_exec("DELETE FROM login_history WHERE phone=%s", (phone,))
        db_exec("DELETE FROM activity_log WHERE phone=%s", (phone,))
    elif mode == "all_logins":
        db_exec("DELETE FROM login_history WHERE phone=%s", (phone,))
    elif mode == "all_activity":
        db_exec("DELETE FROM activity_log WHERE phone=%s", (phone,))
    elif hid and htype == "login":
        db_exec("DELETE FROM login_history WHERE id=%s AND phone=%s", (hid, phone))
    elif hid and htype == "activity":
        db_exec("DELETE FROM activity_log WHERE id=%s AND phone=%s", (hid, phone))
    else:
        return jsonify({"status": "fail"})
    return jsonify({"status": "success"})

@app.route("/weather", methods=["GET", "POST"])
def weather():
    if 'user' not in session: return redirect("/login")
    user, weather_data = get_user(session['user']), None
    if request.method == "POST":
        city = request.form.get("city", "").strip()
        if not city:
            flash("Please enter a city name!", "warning")
        else:
            try:
                url  = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
                data = requests.get(url, timeout=5).json()
                if data.get("cod") == 200:
                    temp, humidity = data["main"]["temp"], data["main"]["humidity"]
                    desc  = data["weather"][0]["description"].title()
                    advice, atype = get_weather_advice(temp, humidity, desc)
                    weather_data = {
                        "city": city.title(), "temp": temp, "humidity": humidity,
                        "description": desc, "icon": data["weather"][0]["icon"],
                        "wind": data["wind"]["speed"], "feels": data["main"]["feels_like"],
                        "advice": advice, "advice_type": atype
                    }
                    log_activity(session['user'], f"Checked weather for {city.title()}")
                else:
                    flash("City not found!", "danger")
            except Exception as e:
                print("Weather Error:", e)
                flash("Error fetching weather data!", "danger")
    return render_template("weather.html", weather=weather_data, user=user)

@app.route("/crop_advisor")
def crop_advisor():
    if 'user' not in session: return redirect("/login")
    return render_template("crop_advisor.html", user=get_user(session['user']))

@app.route("/irrigation")
def irrigation():
    if 'user' not in session: return redirect("/login")
    return render_template("irrigation.html", user=get_user(session['user']))

@app.route("/yield_calculator")
def yield_calculator():
    if 'user' not in session: return redirect("/login")
    return render_template("yield_calculator.html", user=get_user(session['user']))

@app.route("/ai_diagnosis")
def ai_diagnosis():
    if 'user' not in session: return redirect("/login")
    return render_template("ai_diagnosis.html", user=get_user(session['user']))

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

if __name__ == "__main__":
    ensure_tables()
    app.run(debug=True, host='0.0.0.0', port=5000)
