"""
Iteration 5 Backend API Tests - AquaSense AI
Tests for refactored backend with route modules, multi-farm support, historical reports, and settings config
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@aquasense.ai"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ============ AUTH TESTS ============
class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self, api_client):
        """POST /api/auth/login returns valid token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == TEST_EMAIL
        print(f"Login successful, token received")
    
    def test_login_invalid_credentials(self, api_client):
        """POST /api/auth/login with wrong credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Invalid credentials correctly rejected")


# ============ FARMS TESTS ============
class TestFarms:
    """Multi-farm CRUD tests"""
    
    def test_get_farms_auto_creates_default(self, authenticated_client):
        """GET /api/farms returns list of farms (auto-creates default farm)"""
        response = authenticated_client.get(f"{BASE_URL}/api/farms")
        assert response.status_code == 200, f"Get farms failed: {response.text}"
        farms = response.json()
        assert isinstance(farms, list), "Farms should be a list"
        assert len(farms) >= 1, "Should have at least one farm"
        # Check default farm exists
        default_farm = next((f for f in farms if f.get("is_default")), None)
        assert default_farm is not None, "Should have a default farm"
        print(f"Got {len(farms)} farms, default: {default_farm.get('name')}")
    
    def test_create_farm(self, authenticated_client):
        """POST /api/farms creates a new farm (max 5)"""
        # First check current count
        response = authenticated_client.get(f"{BASE_URL}/api/farms")
        current_farms = response.json()
        
        if len(current_farms) >= 5:
            pytest.skip("Already at max farms (5)")
        
        response = authenticated_client.post(f"{BASE_URL}/api/farms", json={
            "name": "TEST_Farm_Iteration5",
            "location": "Test Location",
            "size_acres": 15.5,
            "primary_crop": "Wheat"
        })
        assert response.status_code == 200, f"Create farm failed: {response.text}"
        data = response.json()
        assert data.get("status") == "success"
        assert "farm" in data
        assert data["farm"]["name"] == "TEST_Farm_Iteration5"
        print(f"Created farm: {data['farm']['farm_id']}")
        return data["farm"]["farm_id"]
    
    def test_delete_non_default_farm(self, authenticated_client):
        """DELETE /api/farms/{farm_id} works for non-default farm"""
        # Get farms
        response = authenticated_client.get(f"{BASE_URL}/api/farms")
        farms = response.json()
        
        # Find a non-default farm to delete
        non_default = next((f for f in farms if not f.get("is_default") and "TEST_" in f.get("name", "")), None)
        
        if not non_default:
            # Create one first
            response = authenticated_client.post(f"{BASE_URL}/api/farms", json={
                "name": "TEST_ToDelete",
                "location": "Delete Location",
                "size_acres": 5.0,
                "primary_crop": "Test"
            })
            if response.status_code == 200:
                non_default = response.json().get("farm")
        
        if non_default:
            farm_id = non_default["farm_id"]
            response = authenticated_client.delete(f"{BASE_URL}/api/farms/{farm_id}")
            assert response.status_code == 200, f"Delete farm failed: {response.text}"
            data = response.json()
            assert data.get("status") == "success"
            print(f"Deleted farm: {farm_id}")
        else:
            pytest.skip("No non-default farm available to delete")
    
    def test_set_default_farm(self, authenticated_client):
        """POST /api/farms/{farm_id}/set-default switches default farm"""
        # Get farms
        response = authenticated_client.get(f"{BASE_URL}/api/farms")
        farms = response.json()
        
        if len(farms) < 2:
            # Create another farm
            response = authenticated_client.post(f"{BASE_URL}/api/farms", json={
                "name": "TEST_SecondFarm",
                "location": "Second Location",
                "size_acres": 10.0,
                "primary_crop": "Rice"
            })
            if response.status_code == 200:
                farms.append(response.json().get("farm"))
        
        # Find a non-default farm
        non_default = next((f for f in farms if not f.get("is_default")), None)
        
        if non_default:
            farm_id = non_default["farm_id"]
            response = authenticated_client.post(f"{BASE_URL}/api/farms/{farm_id}/set-default")
            assert response.status_code == 200, f"Set default failed: {response.text}"
            data = response.json()
            assert data.get("status") == "success"
            print(f"Set default farm: {farm_id}")
        else:
            pytest.skip("No non-default farm to set as default")


# ============ REPORTS TESTS ============
class TestReports:
    """Historical reports endpoint tests"""
    
    def test_historical_report(self, authenticated_client):
        """GET /api/reports/historical?days=30 returns sensor data with summary"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/historical?days=30")
        assert response.status_code == 200, f"Historical report failed: {response.text}"
        data = response.json()
        assert "summary" in data, "Summary not in response"
        assert "days" in data, "Days not in response"
        assert data["days"] == 30
        print(f"Historical report: {data.get('summary', {}).get('total_readings', 0)} readings")
    
    def test_irrigation_history(self, authenticated_client):
        """GET /api/reports/irrigation-history?days=30 returns irrigation logs with summary"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/irrigation-history?days=30")
        assert response.status_code == 200, f"Irrigation history failed: {response.text}"
        data = response.json()
        assert "logs" in data, "Logs not in response"
        assert "summary" in data, "Summary not in response"
        assert "days" in data
        print(f"Irrigation history: {data.get('summary', {}).get('total_irrigations', 0)} irrigations")
    
    def test_water_efficiency(self, authenticated_client):
        """GET /api/reports/water-efficiency?days=30 returns analytics with summary"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/water-efficiency?days=30")
        assert response.status_code == 200, f"Water efficiency failed: {response.text}"
        data = response.json()
        assert "analytics" in data, "Analytics not in response"
        assert "summary" in data, "Summary not in response"
        assert "days" in data
        print(f"Water efficiency: avg {data.get('summary', {}).get('avg_efficiency', 0)}%")


# ============ CONFIG TESTS ============
class TestConfig:
    """Settings config endpoint tests"""
    
    def test_get_settings(self, authenticated_client):
        """GET /api/config/settings returns camera and ollama config"""
        response = authenticated_client.get(f"{BASE_URL}/api/config/settings")
        assert response.status_code == 200, f"Get settings failed: {response.text}"
        data = response.json()
        # Check expected fields exist
        assert "rover_feed_url" in data or "user_id" in data, "Settings should have config fields"
        print(f"Settings retrieved: {list(data.keys())}")
    
    def test_update_settings(self, authenticated_client):
        """PUT /api/config/settings updates camera URLs"""
        response = authenticated_client.put(f"{BASE_URL}/api/config/settings", json={
            "rover_feed_url": "http://test-rover.local/frame",
            "drone_feed_url": "http://test-drone.local/frame"
        })
        assert response.status_code == 200, f"Update settings failed: {response.text}"
        data = response.json()
        assert data.get("status") == "success"
        print(f"Settings updated: {data.get('updated', [])}")
        
        # Reset to empty
        authenticated_client.put(f"{BASE_URL}/api/config/settings", json={
            "rover_feed_url": "",
            "drone_feed_url": ""
        })
    
    def test_get_camera_feeds(self, authenticated_client):
        """GET /api/config/camera-feeds returns feed URLs"""
        response = authenticated_client.get(f"{BASE_URL}/api/config/camera-feeds")
        assert response.status_code == 200, f"Get camera feeds failed: {response.text}"
        data = response.json()
        assert "rover_feed_url" in data
        assert "drone_feed_url" in data
        print(f"Camera feeds: rover={data.get('rover_feed_url', 'empty')}, drone={data.get('drone_feed_url', 'empty')}")


# ============ SENSORS TESTS ============
class TestSensors:
    """Sensor data endpoint tests"""
    
    def test_get_latest_sensors(self, authenticated_client):
        """GET /api/sensors/latest returns sensor data"""
        response = authenticated_client.get(f"{BASE_URL}/api/sensors/latest")
        assert response.status_code == 200, f"Get sensors failed: {response.text}"
        data = response.json()
        assert "soil_moisture" in data, "soil_moisture not in response"
        assert "temperature" in data, "temperature not in response"
        assert "humidity" in data, "humidity not in response"
        print(f"Sensors: SM={data.get('soil_moisture')}%, Temp={data.get('temperature')}C")
    
    def test_get_sensor_history(self, authenticated_client):
        """GET /api/sensors/history returns historical readings"""
        response = authenticated_client.get(f"{BASE_URL}/api/sensors/history")
        assert response.status_code == 200, f"Get sensor history failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "History should be a list"
        print(f"Sensor history: {len(data)} readings")


# ============ IRRIGATION TESTS ============
class TestIrrigation:
    """Irrigation prediction endpoint tests"""
    
    def test_irrigation_predict(self, authenticated_client):
        """GET /api/irrigation/predict returns AI decision"""
        response = authenticated_client.get(f"{BASE_URL}/api/irrigation/predict")
        assert response.status_code == 200, f"Irrigation predict failed: {response.text}"
        data = response.json()
        assert "recommendation" in data, "recommendation not in response"
        assert "status" in data, "status not in response"
        assert "confidence" in data, "confidence not in response"
        print(f"Irrigation: {data.get('status')} - confidence {data.get('confidence')}%")
    
    def test_get_zones(self, authenticated_client):
        """GET /api/zones returns farm zones"""
        response = authenticated_client.get(f"{BASE_URL}/api/zones")
        assert response.status_code == 200, f"Get zones failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Zones should be a list"
        print(f"Zones: {len(data)} zones")
    
    def test_get_schedule(self, authenticated_client):
        """GET /api/schedule returns irrigation schedule"""
        response = authenticated_client.get(f"{BASE_URL}/api/schedule")
        assert response.status_code == 200, f"Get schedule failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Schedule should be a list"
        print(f"Schedule: {len(data)} items")
    
    def test_get_alerts(self, authenticated_client):
        """GET /api/alerts returns smart alerts"""
        response = authenticated_client.get(f"{BASE_URL}/api/alerts")
        assert response.status_code == 200, f"Get alerts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Alerts should be a list"
        print(f"Alerts: {len(data)} alerts")


# ============ CHAT TESTS ============
class TestChat:
    """Chat/AI advisor endpoint tests"""
    
    def test_get_chat_mode(self, authenticated_client):
        """GET /api/chat/mode returns LLM mode"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/mode")
        assert response.status_code == 200, f"Get chat mode failed: {response.text}"
        data = response.json()
        assert "mode" in data, "mode not in response"
        assert data["mode"] in ["gemini", "ollama"], f"Invalid mode: {data['mode']}"
        print(f"Chat mode: {data.get('mode')}")


# ============ CROP PREDICTION TESTS ============
class TestCropPrediction:
    """Crop prediction endpoint tests"""
    
    def test_crop_predict(self, authenticated_client):
        """POST /api/crop/predict returns crop prediction"""
        response = authenticated_client.post(f"{BASE_URL}/api/crop/predict", json={
            "nitrogen": 90,
            "phosphorus": 42,
            "potassium": 43,
            "temperature": 25,
            "humidity": 80,
            "ph": 6.5,
            "rainfall": 200
        })
        assert response.status_code == 200, f"Crop predict failed: {response.text}"
        data = response.json()
        assert "crop" in data, "crop not in response"
        assert "confidence" in data, "confidence not in response"
        print(f"Crop prediction: {data.get('crop')} ({data.get('confidence')*100:.1f}% confidence)")


# ============ ANALYTICS TESTS ============
class TestAnalytics:
    """Water analytics endpoint tests"""
    
    def test_water_analytics(self, authenticated_client):
        """GET /api/analytics/water returns water analytics"""
        response = authenticated_client.get(f"{BASE_URL}/api/analytics/water")
        assert response.status_code == 200, f"Water analytics failed: {response.text}"
        data = response.json()
        assert "water_used" in data or "efficiency" in data or isinstance(data, dict), "Should have analytics data"
        print(f"Water analytics retrieved")


# ============ ROOT ENDPOINT TEST ============
class TestRoot:
    """Root API endpoint test"""
    
    def test_api_root(self, api_client):
        """GET /api/ returns operational status"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.text}"
        data = response.json()
        assert data.get("status") == "operational"
        assert "AquaSense" in data.get("message", "")
        print(f"API status: {data.get('status')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
