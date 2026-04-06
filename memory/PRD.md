# AquaSense AI - Smart Irrigation Platform PRD

## Original Problem Statement
Build a full-stack "AquaSense AI - Smart Irrigation Platform" integrating KrishiRakshak X features.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Framer Motion, D3.js
- **Backend**: FastAPI, Motor (async MongoDB), TensorFlow, PyTorch, joblib
- **Database**: MongoDB (aquasense)
- **ML Models**: irrigation_model.pkl, final_drone_model.pth, rover_model.h5, crop_model.pkl

## Implemented Features

### Core (AquaSense AI)
- Dashboard with real-time sensor data (3s auto-refresh), AI decision, zones, alerts, schedule
- Irrigation Intelligence with ML-powered predictions (RandomForest)
- Farm Zones with drone model image upload analysis
- Drone Monitoring with live feed
- Rover Monitoring with live camera + MobileNetV2 crop health analysis
- Water Analytics
- AI Advisor (Gemini chatbot)
- ESP32 IoT data ingestion

### KrishiRakshak X (Added Apr 6, 2026)
- Crop Prediction (RandomForest ML model - 22 crop classes)
- Yield Prediction (rule-based estimation)
- Mandi Pricing (state/district/category filtering, bar charts, tables)
- Market Trends (30-day history + 7-day prediction charts)
- Equipment Rental (list + search with MongoDB)
- Financial Support (Loan Calculator, Govt Schemes, Insurance, P&L Analytics)

## Test Credentials
- Email: test@aquasense.ai | Password: test123

## Backlog
- P1: Ollama integration for local AI chatbot
- P2: Real Mandi API integration (data.gov.in)
- Future: Firebase push notifications, Multi-farm support, Historical reports
