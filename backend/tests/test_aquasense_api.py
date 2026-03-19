"""
AquaSense AI - Backend API Tests
Tests for dashboard features including:
- Authentication (login)
- Sensor data endpoints
- Irrigation prediction
- Zones, Alerts, Schedule endpoints
- Water analytics
"""

import pytest
import requests
import os

# Use the external URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agritech-preview.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@aquasense.ai"
TEST_PASSWORD = "test123"


class TestHealthCheck:
    """Basic API health tests"""

    def test_api_root_returns_operational(self):
        """Test that API root endpoint is operational"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert "AquaSense" in data["message"]


class TestAuthentication:
    """Authentication endpoint tests"""

    def test_login_with_valid_credentials(self):
        """Test login with valid test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == TEST_EMAIL
        assert len(data["token"]) > 0

    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture
def auth_token():
    """Get authentication token for authenticated requests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestSensorEndpoints:
    """Sensor data endpoint tests"""

    def test_get_latest_sensor_data(self, auth_headers):
        """Test GET /api/sensors/latest returns sensor data"""
        response = requests.get(f"{BASE_URL}/api/sensors/latest", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Check required sensor fields
        assert "soil_moisture" in data
        assert "temperature" in data
        assert "humidity" in data
        assert "irrigation_status" in data
        
        # Validate ranges
        assert 0 <= data["soil_moisture"] <= 100
        assert -20 <= data["temperature"] <= 60
        assert 0 <= data["humidity"] <= 100

    def test_get_sensor_history(self, auth_headers):
        """Test GET /api/sensors/history returns array"""
        response = requests.get(f"{BASE_URL}/api/sensors/history", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0


class TestIrrigationPrediction:
    """Irrigation prediction endpoint tests"""

    def test_get_irrigation_prediction(self, auth_headers):
        """Test GET /api/irrigation/predict returns valid prediction"""
        response = requests.get(f"{BASE_URL}/api/irrigation/predict", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields
        assert "recommendation" in data
        assert "status" in data
        assert "confidence" in data
        assert "current_soil_moisture" in data
        
        # Validate confidence is a reasonable percentage (0-100, NOT thousands)
        assert 0 <= data["confidence"] <= 100, f"Confidence {data['confidence']} is not a valid percentage (0-100)"
        print(f"AI Decision Confidence: {data['confidence']}%")


class TestZonesEndpoint:
    """Farm zones endpoint tests"""

    def test_get_zones_returns_array(self, auth_headers):
        """Test GET /api/zones returns array of zones"""
        response = requests.get(f"{BASE_URL}/api/zones", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be an array"
        assert len(data) >= 1, "Should have at least 1 zone"
        
        # Validate zone structure
        for zone in data:
            assert "zone_name" in zone
            assert "status" in zone
            assert "soil_moisture" in zone
        
        print(f"Zones returned: {len(data)} zones")
        for zone in data:
            print(f"  - {zone['zone_name']}: {zone['status']} ({zone['soil_moisture']}% moisture)")


class TestAlertsEndpoint:
    """Smart alerts endpoint tests"""

    def test_get_alerts_returns_array(self, auth_headers):
        """Test GET /api/alerts returns array of alerts"""
        response = requests.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be an array"
        
        # If there are alerts, validate structure
        if len(data) > 0:
            for alert in data:
                assert "type" in alert
                assert "title" in alert
                assert "message" in alert
        
        print(f"Alerts returned: {len(data)} alerts")


class TestScheduleEndpoint:
    """Irrigation schedule endpoint tests"""

    def test_get_schedule_returns_array(self, auth_headers):
        """Test GET /api/schedule returns array of schedule items"""
        response = requests.get(f"{BASE_URL}/api/schedule", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be an array"
        
        # If there are schedule items, validate structure
        if len(data) > 0:
            for item in data:
                assert "zone" in item
                assert "date" in item
                assert "time" in item
                assert "priority" in item
        
        print(f"Schedule items returned: {len(data)} items")


class TestWaterAnalytics:
    """Water analytics endpoint tests"""

    def test_get_water_analytics(self, auth_headers):
        """Test GET /api/analytics/water returns valid analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/water", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields
        assert "efficiency_score" in data
        assert "water_saved_percent" in data
        assert "before_usage" in data
        assert "after_usage" in data
        assert "efficiency_average" in data
        
        # Validate water_saved_percent is a reasonable percentage (0-100, NOT thousands)
        water_saved = data["water_saved_percent"]
        assert 0 <= water_saved <= 100, f"Water saved percent {water_saved}% is not valid (expected 0-100)"
        
        # Validate before/after usage are positive numbers
        assert data["before_usage"] >= 0
        assert data["after_usage"] >= 0
        
        print(f"Water Analytics:")
        print(f"  - Efficiency Score: {data['efficiency_score']}%")
        print(f"  - Water Saved: {data['water_saved_percent']}%")
        print(f"  - Before Usage: {data['before_usage']} L")
        print(f"  - After Usage: {data['after_usage']} L")


class TestDroneEndpoint:
    """Drone monitoring endpoint tests"""

    def test_get_drone_latest(self, auth_headers):
        """Test GET /api/drone/latest returns drone analysis"""
        response = requests.get(f"{BASE_URL}/api/drone/latest", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "analysis_result" in data or "message" in data or "zones" in data


class TestAdvancedAnalytics:
    """Advanced analytics endpoint tests"""

    def test_get_advanced_analytics(self, auth_headers):
        """Test GET /api/analytics/advanced returns analytics data"""
        response = requests.get(f"{BASE_URL}/api/analytics/advanced", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "yield_prediction" in data
        assert "irrigation_analysis" in data
        assert "efficiency_metrics" in data

    def test_get_irrigation_patterns(self, auth_headers):
        """Test GET /api/analytics/irrigation-patterns returns pattern data"""
        response = requests.get(f"{BASE_URL}/api/analytics/irrigation-patterns", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "pattern_data" in data or "analysis" in data
