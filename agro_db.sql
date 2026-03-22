-- AgroSmart Database Schema
-- Run this file once: psql -U postgres -d agrosmart -f agro_db.sql

CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    phone TEXT UNIQUE NOT NULL,
    farm_size FLOAT,
    soil_ph FLOAT,
    soil_type VARCHAR(50),
    profile_pic TEXT
);

-- Add profile_pic to existing DBs (safe to run multiple times)
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_pic TEXT;

CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    action TEXT NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);