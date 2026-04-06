# AquaSense AI - Local Setup & Ollama Integration Guide

## Prerequisites
- **Python 3.11+** (required for ML models)
- **Node.js 18+** and **Yarn**
- **MongoDB** (local or cloud)
- **Git**

---

## 1. MongoDB Setup

### Option A: Install MongoDB Locally

**Ubuntu/Debian:**
```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:**
Download installer from https://www.mongodb.com/try/download/community and follow the setup wizard.

### MongoDB Connection URL
After installation, your local MongoDB URL is:
```
mongodb://localhost:27017
```

### Do I need to create a database or collections?
**No!** MongoDB creates databases and collections automatically when the app first writes data. The app uses a database called `aquasense` - it will be created on first run.

### Option B: Use MongoDB Atlas (Cloud - Free Tier)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Copy the connection string: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aquasense`

---

## 2. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd aquasense-ai
```

### Backend Setup
```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings (see below)
```

### Backend .env Configuration
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="aquasense"
CORS_ORIGINS="*"
JWT_SECRET="your-secret-key-change-this"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS="24"
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key

# ESP32 Camera Feeds (leave empty if not connected)
ROVER_FEED_URL=
DRONE_FEED_URL=

# Ollama (for local AI - see Section 4)
OLLAMA_URL=
OLLAMA_MODEL=llama3
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
# Edit .env:
```

### Frontend .env Configuration
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 3. Running the Application

### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Start Frontend (in a new terminal)
```bash
cd frontend
yarn start
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api

### First Time Use
1. Open http://localhost:3000
2. Click "Get Started" to create an account
3. Login with your credentials
4. The dashboard will show mock data until you connect ESP32 sensors

---

## 4. Ollama Integration (Local AI Chatbot)

Ollama lets you run AI models locally on your machine - no internet required!

### Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

**Windows:**
Download from https://ollama.com/download

### Pull an AI Model
```bash
# Recommended models (choose one):
ollama pull llama3           # 4.7GB - Best quality, needs 8GB+ RAM
ollama pull llama3:8b        # Same as above
ollama pull mistral          # 4.1GB - Great alternative
ollama pull phi3             # 2.2GB - Lightweight, works on 4GB RAM
ollama pull gemma2:2b        # 1.6GB - Very lightweight option
```

### Start Ollama Server
```bash
# Start the Ollama server (runs on port 11434 by default)
ollama serve
```

### Configure AquaSense to Use Ollama

Edit your `backend/.env` file:
```env
# Enable Ollama (comment out or remove GEMINI_API_KEY if you want Ollama only)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### How It Works
- If `OLLAMA_URL` is set and non-empty in `.env`, the chatbot uses **Ollama** (local)
- If `OLLAMA_URL` is empty, the chatbot uses **Gemini** (online, requires API key)
- The system auto-detects which mode to use on each request
- You can check the active mode at: `GET /api/chat/mode`

### Test Ollama Connection
```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# Test a chat directly
curl http://localhost:11434/api/chat -d '{
  "model": "llama3",
  "messages": [{"role": "user", "content": "What crops grow best in clay soil?"}],
  "stream": false
}'
```

---

## 5. ESP32 Camera Feed Configuration

### Rover Camera (ESP32-CAM)
In `backend/.env`, set your rover camera URL:
```env
ROVER_FEED_URL=http://192.168.1.100/frame
```
Replace `192.168.1.100` with your ESP32-CAM IP address.

### Drone Camera (ESP32-CAM)
```env
DRONE_FEED_URL=http://192.168.1.101/frame
```

### ESP32 Sensor Data Endpoint
Your ESP32 sensor device should POST data to:
```
POST http://localhost:8001/api/iot/sensor-data
Content-Type: application/json

{
  "soil_moisture": 2500,       // Raw ADC value (0-4095) or percentage (0-100)
  "temperature": 28.5,         // Celsius
  "humidity": 65.2,            // Percentage
  "soil_temp": 24.1,           // Celsius
  "device_id": "ESP32_FIELD1"  // Optional
}
```

The system automatically converts raw ADC values (>100) to percentage.

---

## 6. ML Models

The following models must be present in `backend/models/`:
- `irrigation_model.pkl` - Irrigation decision model
- `crop_model.pkl` - Crop recommendation model (22 classes)
- `final_drone_model.pth` - Drone image segmentation (PyTorch UNet-ResNet34)
- `rover_model.h5` - Crop health analysis (TensorFlow MobileNetV2)

These are loaded automatically on server startup. Check logs for confirmation:
```
Drone segmentation model loaded successfully
Rover crop health model loaded successfully
Crop model loaded: 22 classes, 6 features
```

---

## 7. API Key Requirements

| Service | Key | Required? | Where to Get |
|---------|-----|-----------|--------------|
| OpenWeather | `OPENWEATHER_API_KEY` | Optional | https://openweathermap.org/api |
| Gemini (Online AI) | `GEMINI_API_KEY` | Only if not using Ollama | Via Emergent Platform |
| Ollama (Local AI) | N/A | Free, no key needed | https://ollama.com |

---

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### MongoDB connection refused
```bash
# Check if MongoDB is running
sudo systemctl status mongod
# Or on Mac
brew services list
```

### Ollama "connection refused"
```bash
# Make sure Ollama server is running
ollama serve
# In another terminal, verify
curl http://localhost:11434/api/tags
```

### ML model load failures
- Ensure Python 3.11 is used (models were trained with 3.11)
- Check that model files exist in `backend/models/`
- TensorFlow requires: `pip install tensorflow-cpu h5py`
- PyTorch requires: `pip install torch torchvision`
