"""
Iteration 4 Tests - New Features Testing
Tests for:
1. Sidebar shows 'AGRICULTURE' instead of 'KrishiRakshak' section header
2. GET /api/config/camera-feeds returns rover_feed_url and drone_feed_url from env
3. GET /api/chat/mode returns current LLM mode (gemini when OLLAMA_URL is empty)
4. POST /api/crop/predict with valid parameters returns crop prediction with model_type, confidence, top_3
5. Login flow works with test credentials
6. Dashboard loads with sensor data
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCameraFeedConfig:
    """Tests for camera feed configuration endpoint"""
    
    def test_camera_feeds_endpoint_returns_200(self):
        """GET /api/config/camera-feeds should return 200"""
        response = requests.get(f"{BASE_URL}/api/config/camera-feeds")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Camera feeds endpoint returns 200")
    
    def test_camera_feeds_returns_rover_url(self):
        """Response should contain rover_feed_url field"""
        response = requests.get(f"{BASE_URL}/api/config/camera-feeds")
        data = response.json()
        assert "rover_feed_url" in data, "Missing rover_feed_url in response"
        # URL should be empty string as per env config
        assert data["rover_feed_url"] == "", f"Expected empty rover_feed_url, got {data['rover_feed_url']}"
        print(f"✓ rover_feed_url returned: '{data['rover_feed_url']}' (empty as expected)")
    
    def test_camera_feeds_returns_drone_url(self):
        """Response should contain drone_feed_url field"""
        response = requests.get(f"{BASE_URL}/api/config/camera-feeds")
        data = response.json()
        assert "drone_feed_url" in data, "Missing drone_feed_url in response"
        # URL should be empty string as per env config
        assert data["drone_feed_url"] == "", f"Expected empty drone_feed_url, got {data['drone_feed_url']}"
        print(f"✓ drone_feed_url returned: '{data['drone_feed_url']}' (empty as expected)")


class TestChatMode:
    """Tests for chat mode endpoint (Gemini vs Ollama)"""
    
    def test_chat_mode_endpoint_returns_200(self):
        """GET /api/chat/mode should return 200"""
        response = requests.get(f"{BASE_URL}/api/chat/mode")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Chat mode endpoint returns 200")
    
    def test_chat_mode_returns_gemini_when_ollama_empty(self):
        """Mode should be 'gemini' when OLLAMA_URL is empty"""
        response = requests.get(f"{BASE_URL}/api/chat/mode")
        data = response.json()
        assert "mode" in data, "Missing 'mode' in response"
        assert data["mode"] == "gemini", f"Expected mode 'gemini', got '{data['mode']}'"
        print(f"✓ Chat mode is '{data['mode']}' (gemini as expected since OLLAMA_URL is empty)")
    
    def test_chat_mode_ollama_url_is_null(self):
        """ollama_url should be null when not configured"""
        response = requests.get(f"{BASE_URL}/api/chat/mode")
        data = response.json()
        assert "ollama_url" in data, "Missing 'ollama_url' in response"
        assert data["ollama_url"] is None, f"Expected ollama_url to be null, got {data['ollama_url']}"
        print("✓ ollama_url is null (not configured)")


class TestCropPrediction:
    """Tests for crop prediction ML model endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@aquasense.ai",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_crop_predict_returns_200(self, auth_token):
        """POST /api/crop/predict should return 200 with valid params"""
        response = requests.post(
            f"{BASE_URL}/api/crop/predict",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "nitrogen": 90,
                "potassium": 40,
                "phosphorus": 40,
                "temperature": 25,
                "humidity": 80,
                "rainfall": 200
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Crop prediction endpoint returns 200")
    
    def test_crop_predict_returns_crop_name(self, auth_token):
        """Response should contain crop name"""
        response = requests.post(
            f"{BASE_URL}/api/crop/predict",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "nitrogen": 90,
                "potassium": 40,
                "phosphorus": 40,
                "temperature": 25,
                "humidity": 80,
                "rainfall": 200
            }
        )
        data = response.json()
        assert "crop" in data, "Missing 'crop' in response"
        assert isinstance(data["crop"], str), "crop should be a string"
        assert len(data["crop"]) > 0, "crop should not be empty"
        print(f"✓ Predicted crop: {data['crop']}")
    
    def test_crop_predict_returns_confidence(self, auth_token):
        """Response should contain confidence score"""
        response = requests.post(
            f"{BASE_URL}/api/crop/predict",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "nitrogen": 90,
                "potassium": 40,
                "phosphorus": 40,
                "temperature": 25,
                "humidity": 80,
                "rainfall": 200
            }
        )
        data = response.json()
        assert "confidence" in data, "Missing 'confidence' in response"
        assert isinstance(data["confidence"], (int, float)), "confidence should be a number"
        assert 0 <= data["confidence"] <= 1, f"confidence should be between 0 and 1, got {data['confidence']}"
        print(f"✓ Confidence: {data['confidence']}")
    
    def test_crop_predict_returns_top_3(self, auth_token):
        """Response should contain top_3 predictions"""
        response = requests.post(
            f"{BASE_URL}/api/crop/predict",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "nitrogen": 90,
                "potassium": 40,
                "phosphorus": 40,
                "temperature": 25,
                "humidity": 80,
                "rainfall": 200
            }
        )
        data = response.json()
        assert "top_3" in data, "Missing 'top_3' in response"
        assert isinstance(data["top_3"], list), "top_3 should be a list"
        assert len(data["top_3"]) == 3, f"top_3 should have 3 items, got {len(data['top_3'])}"
        print(f"✓ Top 3 predictions: {data['top_3']}")
    
    def test_crop_predict_returns_model_type(self, auth_token):
        """Response should contain model_type indicating RandomForest"""
        response = requests.post(
            f"{BASE_URL}/api/crop/predict",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "nitrogen": 90,
                "potassium": 40,
                "phosphorus": 40,
                "temperature": 25,
                "humidity": 80,
                "rainfall": 200
            }
        )
        data = response.json()
        assert "model_type" in data, "Missing 'model_type' in response"
        assert "RandomForest" in data["model_type"], f"Expected RandomForest in model_type, got {data['model_type']}"
        print(f"✓ Model type: {data['model_type']}")


class TestAuthentication:
    """Tests for authentication flow"""
    
    def test_login_with_valid_credentials(self):
        """Login should succeed with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@aquasense.ai",
            "password": "test123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "token" in data, "Missing 'token' in response"
        assert "user" in data, "Missing 'user' in response"
        print(f"✓ Login successful for {data['user']['email']}")
    
    def test_login_returns_user_info(self):
        """Login should return user information"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@aquasense.ai",
            "password": "test123"
        })
        data = response.json()
        user = data.get("user", {})
        assert user.get("email") == "test@aquasense.ai", "Email mismatch"
        assert "name" in user, "Missing 'name' in user"
        print(f"✓ User info returned: {user['name']} ({user['email']})")
    
    def test_login_with_invalid_credentials(self):
        """Login should fail with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")


class TestDashboardData:
    """Tests for dashboard sensor data"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@aquasense.ai",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_sensors_latest_returns_200(self, auth_token):
        """GET /api/sensors/latest should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/sensors/latest",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Sensors latest endpoint returns 200")
    
    def test_sensors_latest_returns_data(self, auth_token):
        """Sensor data should contain required fields"""
        response = requests.get(
            f"{BASE_URL}/api/sensors/latest",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        required_fields = ["soil_moisture", "temperature", "humidity"]
        for field in required_fields:
            assert field in data, f"Missing '{field}' in sensor data"
        print(f"✓ Sensor data: moisture={data['soil_moisture']}%, temp={data['temperature']}°C, humidity={data['humidity']}%")
    
    def test_irrigation_predict_returns_200(self, auth_token):
        """GET /api/irrigation/predict should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/irrigation/predict",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Irrigation predict endpoint returns 200")


class TestSidebarNavigation:
    """Tests for sidebar navigation links"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@aquasense.ai",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_zones_endpoint(self, auth_token):
        """GET /api/zones should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/zones",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Zones endpoint returns 200")
    
    def test_analytics_water_endpoint(self, auth_token):
        """GET /api/analytics/water should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/water",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Water analytics endpoint returns 200")
    
    def test_mandi_states_endpoint(self):
        """GET /api/mandi/states should return 200"""
        response = requests.get(f"{BASE_URL}/api/mandi/states")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Mandi states endpoint returns 200")
    
    def test_market_trends_endpoint(self):
        """GET /api/market/trends should return 200"""
        response = requests.get(f"{BASE_URL}/api/market/trends?crop=rice&frequency=daily")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Market trends endpoint returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
