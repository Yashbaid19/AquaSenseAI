# AquaSense AI - Smart Irrigation Platform PRD

## Original Problem Statement
Build a full-stack "AquaSense AI - Smart Irrigation Platform" with:
- React frontend + FastAPI backend + MongoDB
- IoT ESP32 sensor data ingestion
- ML model integration for irrigation prediction and drone image analysis
- Real-time dashboard with sensor data, AI decisions, zone maps, alerts, schedules
- AI chatbot (Gemini), advanced analytics, drone monitoring
- Collapsible left sidebar navigation

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Framer Motion, D3.js, Axios
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic, joblib, PyTorch
- **Database**: MongoDB (aquasense)
- **Auth**: JWT-based
- **ML Models**: 
  - `irrigation_model.pkl` - RandomForestRegressor (5 features: soil_moisture, temperature, humidity, rain_forecast, time_of_day) loaded via joblib
  - `final_drone_model.pth` - UNet with ResNet34 encoder for 4-class moisture zone segmentation loaded via custom architecture

## What's Been Implemented

### Core Features
- User authentication (signup/login) with JWT
- Dashboard with sensor data, AI decision, zone map, schedule, alerts, water analytics, sensor trends
- Real-time 3s auto-refresh + WebSocket endpoint for instant ESP32 push updates
- ML-powered irrigation prediction using RandomForest model
- ML-powered drone image segmentation using UNet-ResNet34 model  
- Farm zones management with image upload
- Drone monitoring with live feed
- Water analytics, Advanced analytics with D3 heatmap
- AI Chat (Gemini via emergent integrations)
- IoT data ingestion endpoint for ESP32
- Settings page

### Bug Fixes (Mar 19, 2026)
- Fixed water analytics showing 8994% -> correct ~22%
- Fixed AI confidence showing 8930% -> correct ~87%
- Fixed missing Zone Map, Schedule, Smart Alerts sections
- Fixed missing Soil Temperature card
- Fixed Before/After usage blank -> proper values with "L" suffix
- Fixed Advanced Analytics heatmap zero-domain edge case
- Fixed ML model loading: joblib for irrigation, UNet architecture for drone
- Added WebSocket for real-time sensor updates

## Key API Endpoints
- POST /api/auth/signup, /api/auth/login
- GET /api/sensors/latest, /api/sensors/history
- GET /api/irrigation/predict (ML model powered)
- GET /api/zones, /api/schedule, /api/alerts
- GET /api/analytics/water, /api/analytics/advanced
- POST /api/iot/sensor-data (ESP32 endpoint, no auth required)
- POST /api/drone/upload-image (ML model powered)
- WS /api/ws/{user_id} (WebSocket for real-time updates)

## Test Credentials
- Email: test@aquasense.ai | Password: test123

## Prioritized Backlog

### P1
- Verify AI Chatbot functionality (Gemini integration)

### P2
- Explain "Predicted Yield vs Base Yield" logic in Advanced Analytics

### Future
- Firebase push notifications
- Multi-farm support
- Historical report generation
- Mobile-responsive optimizations
