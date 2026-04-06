# AquaSense AI - Smart Irrigation Platform PRD

## Original Problem Statement
Build a full-stack "AquaSense AI - Smart Irrigation Platform" integrating KrishiRakshak X features. A comprehensive agriculture intelligence platform combining IoT sensors, AI/ML models, drone/rover monitoring, crop prediction, mandi pricing, and financial tools.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Framer Motion, Shadcn UI
- **Backend**: FastAPI, Motor (async MongoDB), TensorFlow, PyTorch, joblib
- **Database**: MongoDB (aquasense)
- **ML Models**: irrigation_model.pkl, final_drone_model.pth, rover_model.h5, crop_model.pkl
- **AI Chatbot**: Gemini 3 Pro (online via Emergent LLM Key) + Ollama (local, optional)

## Implemented Features

### Core (AquaSense AI)
- Dashboard with real-time sensor data (3s auto-refresh), AI decision, zones, alerts, schedule
- Irrigation Intelligence with ML-powered predictions (RandomForest)
- Farm Zones with drone model image upload analysis
- Drone Monitoring with configurable live feed (DRONE_FEED_URL env)
- Rover Monitoring with configurable live camera (ROVER_FEED_URL env) + MobileNetV2 crop health analysis
- Water Analytics
- AI Advisor (Gemini chatbot + Ollama local support)
- ESP32 IoT data ingestion via REST + WebSocket broadcast

### Agriculture Intelligence (formerly KrishiRakshak X - unified)
- Crop Prediction (RandomForest ML model - 22 crop classes)
- Yield Prediction (rule-based estimation)
- Mandi Pricing (state/district/category filtering, bar charts, tables) - Punjab/Maharashtra data
- Market Trends (30-day history + 7-day prediction charts)
- Equipment Rental (list + search with MongoDB)
- Financial Support (Loan Calculator, Govt Schemes, Insurance, P&L Analytics)

### Landing Page
- Premium dark-themed hero with floating cards
- Problem, Solution, How it Works, Features, Impact, Why Different sections
- Framer Motion animations

## Test Credentials
- Email: test@aquasense.ai | Password: test123

## ESP32 Camera Configuration
- Rover: Set `ROVER_FEED_URL=http://<ip>/frame` in backend/.env
- Drone: Set `DRONE_FEED_URL=http://<ip>/frame` in backend/.env
- Sensor data: POST to /api/iot/sensor-data

## Chatbot Dual Mode
- Gemini (online): Default when OLLAMA_URL is empty
- Ollama (local): Set OLLAMA_URL=http://localhost:11434 and OLLAMA_MODEL=llama3

## Key API Endpoints
- POST /api/auth/login, /api/auth/signup
- GET /api/sensors/latest, /api/sensors/history
- GET /api/irrigation/predict
- POST /api/chat (dual Gemini/Ollama)
- GET /api/chat/mode
- GET /api/config/camera-feeds
- POST /api/crop/predict
- POST /api/yield/predict
- GET /api/mandi/states, /api/mandi/prices
- POST /api/iot/sensor-data
- WS /api/ws/{user_id}

## Backlog
- P1: Local Setup Guide created at /app/LOCAL_SETUP_GUIDE.md
- P2: Real Mandi API integration (data.gov.in) instead of hardcoded data
- P2: Firebase Push Notifications for critical sensor alerts
- Future: Multi-farm support, Historical reports
