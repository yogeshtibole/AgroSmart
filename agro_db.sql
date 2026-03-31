-- AgroSmart Complete Database Schema
-- Run once on Neon: psql <connection_url> -f agro_db.sql
-- OR just deploy — ensure_tables() in app.py handles everything automatically

-- FARMERS
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    phone TEXT UNIQUE NOT NULL,
    farm_size FLOAT,
    soil_ph FLOAT,
    soil_type VARCHAR(50),
    profile_pic TEXT,
    password TEXT,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_pic TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- LOGIN & ACTIVITY
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    action TEXT NOT NULL,
    page VARCHAR(50) DEFAULT 'general',
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS page VARCHAR(50) DEFAULT 'general';

-- CROP DIARY
CREATE TABLE IF NOT EXISTS crop_diary (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    title VARCHAR(200) DEFAULT 'Field Note',
    crop VARCHAR(100),
    note TEXT NOT NULL,
    mood VARCHAR(20) DEFAULT 'good',
    note_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CROP CALENDAR
CREATE TABLE IF NOT EXISTS crop_calendar_entries (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    crop VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    sow_date DATE,
    harvest_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    title VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    image_path TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_path TEXT;

-- COMMUNITY LIKES
CREATE TABLE IF NOT EXISTS community_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, phone)
);

-- COMMUNITY REPLIES
CREATE TABLE IF NOT EXISTS community_replies (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMMUNITY MESSAGES
CREATE TABLE IF NOT EXISTS community_messages (
    id SERIAL PRIMARY KEY,
    sender_phone TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMMUNITY FOLLOWS
CREATE TABLE IF NOT EXISTS community_follows (
    id SERIAL PRIMARY KEY,
    follower_phone TEXT NOT NULL,
    following_phone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_phone, following_phone)
);

-- COMMUNITY SHARES
CREATE TABLE IF NOT EXISTS community_shares (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
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
);