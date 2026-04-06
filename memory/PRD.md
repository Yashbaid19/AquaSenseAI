# AquaSense AI - Smart Irrigation Platform PRD

## Original Problem Statement
Build a full-stack "AquaSense AI - Smart Irrigation Platform" merged with KrishiRakshak X features. A comprehensive agriculture intelligence platform combining IoT sensors (ESP32), AI/ML models (irrigation, crop, drone, rover), a Gemini-powered chatbot, and agricultural analytics.

## Architecture
- **Frontend**: React 18, Tailwind CSS, Recharts, Framer Motion, Shadcn UI
- **Backend**: FastAPI (modular route architecture), Motor (async MongoDB)
- **Database**: MongoDB (aquasense)
- **ML Models**: irrigation_model.pkl, crop_model.pkl, final_drone_model.pth, rover_model.h5
- **ML Microservice**: Optional separate FastAPI server (ml_server.py) on port 8002
- **AI Chatbot**: Dual-mode — Gemini 3 Pro (online) + Ollama (local)
- **Notifications**: In-app + Firebase Push (placeholder)

## Backend Route Modules (Refactored)
```
backend/
├── server.py              # Slim: App, CORS, WebSocket, startup, route imports
├── routes/
│   ├── auth.py           # Login, Signup
│   ├── sensors.py        # Sensor latest, history
│   ├── irrigation.py     # Irrigation predict, zones, schedule, alerts
│   ├── monitoring.py     # Drone + Rover endpoints
│   ├── analytics.py      # Water analytics, advanced analytics
│   ├── chat.py           # AI chat (Gemini/Ollama dual mode)
│   ├── iot.py            # ESP32 sensor data ingestion
│   ├── notifications.py  # Notification CRUD
│   ├── krishi.py         # Crop predict, yield, mandi, market, equipment, finance
│   ├── farms.py          # Multi-farm CRUD (max 5 per user)
│   ├── reports.py        # Historical reporting (sensor, irrigation, water)
│   └── config.py         # Camera feeds, app settings
├── deps.py               # Shared app state (ws_manager, notification_service)
├── models.py             # Pydantic request/response models
├── database.py           # MongoDB collections + indexes
├── auth.py               # JWT + password hashing
├── ml_server.py          # Optional ML inference microservice
├── firebase_push.py      # Firebase push notification (placeholder)
└── models/               # ML model files (.pkl, .h5, .pth)
```

## Implemented Features

### Core Platform
- Dashboard with real-time sensor data (3s auto-refresh), AI decision, zones, alerts, schedule
- Multi-farm support (2-5 farms per user, switchable via header dropdown)
- Farm selector in top-right header with auto-default creation
- Irrigation Intelligence with ML-powered predictions
- Farm Zones with drone model image upload analysis
- Drone Monitoring with configurable ESP32-CAM live feed
- Rover Monitoring with configurable ESP32-CAM + MobileNetV2 crop health
- Water Analytics + Advanced Analytics
- AI Advisor (Gemini chatbot + Ollama local support)
- ESP32 IoT data ingestion via REST + WebSocket broadcast
- Historical Reports page with 3 tabs: Sensor Data, Irrigation, Water Efficiency

### Agriculture Intelligence
- Crop Prediction (RandomForest ML - 22 crop classes)
- Yield Prediction (rule-based estimation)
- Mandi Pricing (Punjab/Maharashtra data with category filtering)
- Market Trends (30-day history + 7-day prediction)
- Equipment Rental (MongoDB-backed listing + search)
- Financial Support (Loan Calculator, Govt Schemes, Insurance, P&L)

### Settings & Configuration
- Profile management
- Multi-farm management (add/delete/set-default)
- ESP32 camera URL config from UI
- Ollama AI config from UI
- Notification preferences

### Notifications
- In-app alerts for critical sensor readings
- Firebase push notification infrastructure (PLACEHOLDER — requires Firebase credentials)

## Key API Endpoints
- Auth: POST /api/auth/login, /api/auth/signup
- Sensors: GET /api/sensors/latest, /api/sensors/history
- Irrigation: GET /api/irrigation/predict
- Farms: GET/POST /api/farms, PUT/DELETE /api/farms/{id}, POST /api/farms/{id}/set-default
- Reports: GET /api/reports/historical, /api/reports/irrigation-history, /api/reports/water-efficiency
- Chat: POST /api/chat, GET /api/chat/mode
- Config: GET/PUT /api/config/settings, GET /api/config/camera-feeds
- Agriculture: POST /api/crop/predict, /api/yield/predict, GET /api/mandi/*
- IoT: POST /api/iot/sensor-data
- WebSocket: WS /api/ws/{user_id}

## Test Credentials
- Email: test@aquasense.ai | Password: test123

## Configuration (backend/.env)
- ROVER_FEED_URL — ESP32-CAM rover stream endpoint
- DRONE_FEED_URL — ESP32-CAM drone stream endpoint
- OLLAMA_URL — Local Ollama server (empty = use Gemini)
- OLLAMA_MODEL — Ollama model name (default: llama3)
- FIREBASE_ENABLED — Enable push notifications (default: false)
- FIREBASE_CREDENTIALS_PATH — Path to Firebase service account JSON

## MOCKED APIs
- Yield Prediction: Rule-based estimation
- Market Trends: Randomized demo data
- Mandi Pricing: Hardcoded Punjab/Maharashtra data
- Firebase Push: Placeholder only (requires Firebase project setup)

## Documents
- /app/LOCAL_SETUP_GUIDE.md — Comprehensive local setup + Ollama integration guide
- /app/memory/PRD.md — This file
- /app/test_reports/ — Test iteration reports (1-5)

## Backlog
- P2: Real Mandi API integration (data.gov.in)
- P2: Start ML microservice via supervisor for production deployment
- Future: Advanced multi-farm analytics with cross-farm comparisons
