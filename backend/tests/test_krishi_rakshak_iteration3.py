"""
KrishiRakshak X - Iteration 3 Backend API Tests
Tests for: Crop Prediction, Yield Prediction, Mandi Pricing, Market Trends, Equipment Rental, Financial Support, Chatbot, Rover Analysis
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@aquasense.ai"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    # Try signup if login fails
    signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": "Test User",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "farm_location": "Test Farm",
        "farm_size": 10.0,
        "primary_crop": "rice"
    })
    if signup_response.status_code == 200:
        return signup_response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestCropPrediction:
    """Crop Prediction API tests"""
    
    def test_crop_predict_returns_recommendation(self, auth_headers):
        """POST /api/crop/predict returns crop recommendation with top_3 array"""
        payload = {
            "nitrogen": 80,
            "potassium": 40,
            "phosphorus": 40,
            "temperature": 28,
            "humidity": 65,
            "rainfall": 200
        }
        response = requests.post(f"{BASE_URL}/api/crop/predict", json=payload, headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "crop" in data, "Response should contain 'crop' field"
        assert "confidence" in data, "Response should contain 'confidence' field"
        assert "top_3" in data, "Response should contain 'top_3' array"
        assert isinstance(data["top_3"], list), "top_3 should be a list"
        assert len(data["top_3"]) == 3, "top_3 should have 3 items"
        
        # Validate top_3 structure
        for item in data["top_3"]:
            assert isinstance(item, list) and len(item) == 2, "Each top_3 item should be [crop, percentage]"
            assert isinstance(item[0], str), "Crop name should be string"
            assert isinstance(item[1], (int, float)), "Percentage should be numeric"
        
        print(f"Crop prediction: {data['crop']} with confidence {data['confidence']}")
        print(f"Top 3: {data['top_3']}")


class TestYieldPrediction:
    """Yield Prediction API tests"""
    
    def test_yield_predict_returns_yield(self, auth_headers):
        """POST /api/yield/predict returns yield_per_acre and total_yield_kg"""
        payload = {
            "crop_type": "rice",
            "area_hectares": 2.0,
            "rainfall_mm": 800,
            "avg_temp": 28,
            "soil_quality": "good"
        }
        response = requests.post(f"{BASE_URL}/api/yield/predict", json=payload, headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "yield_per_acre" in data, "Response should contain 'yield_per_acre'"
        assert "total_yield_kg" in data, "Response should contain 'total_yield_kg'"
        assert "factors" in data, "Response should contain 'factors'"
        assert isinstance(data["yield_per_acre"], (int, float)), "yield_per_acre should be numeric"
        assert isinstance(data["total_yield_kg"], (int, float)), "total_yield_kg should be numeric"
        assert data["yield_per_acre"] > 0, "yield_per_acre should be positive"
        assert data["total_yield_kg"] > 0, "total_yield_kg should be positive"
        
        print(f"Yield prediction: {data['yield_per_acre']} kg/acre, Total: {data['total_yield_kg']} kg")


class TestMandiPricing:
    """Mandi Pricing API tests"""
    
    def test_mandi_states_returns_array(self):
        """GET /api/mandi/states returns array of states"""
        response = requests.get(f"{BASE_URL}/api/mandi/states")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one state"
        assert "Maharashtra" in data, "Maharashtra should be in states list"
        
        print(f"States: {data}")
    
    def test_mandi_districts_returns_array(self):
        """GET /api/mandi/districts/{state} returns array of districts"""
        response = requests.get(f"{BASE_URL}/api/mandi/districts/Maharashtra")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one district"
        assert "Pune" in data, "Pune should be in Maharashtra districts"
        
        print(f"Maharashtra districts: {data}")
    
    def test_mandi_prices_returns_commodities(self):
        """GET /api/mandi/prices?state=Maharashtra&district=Pune&category=All returns array of commodities"""
        response = requests.get(f"{BASE_URL}/api/mandi/prices?state=Maharashtra&district=Pune&category=All")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one commodity"
        
        # Validate commodity structure
        commodity = data[0]
        assert "commodity" in commodity, "Should have 'commodity' field"
        assert "category" in commodity, "Should have 'category' field"
        assert "min_price" in commodity, "Should have 'min_price' field"
        assert "max_price" in commodity, "Should have 'max_price' field"
        assert "modal_price" in commodity, "Should have 'modal_price' field"
        
        print(f"Found {len(data)} commodities in Pune, Maharashtra")
        print(f"Sample: {commodity}")


class TestMarketTrends:
    """Market Trends API tests"""
    
    def test_market_trends_returns_history_and_predictions(self):
        """GET /api/market/trends?crop=rice returns history and predictions arrays"""
        response = requests.get(f"{BASE_URL}/api/market/trends?crop=rice")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "crop" in data, "Response should contain 'crop'"
        assert "history" in data, "Response should contain 'history' array"
        assert "predictions" in data, "Response should contain 'predictions' array"
        assert "current_price" in data, "Response should contain 'current_price'"
        assert "average_price" in data, "Response should contain 'average_price'"
        assert "predicted_change" in data, "Response should contain 'predicted_change'"
        
        assert isinstance(data["history"], list), "history should be a list"
        assert isinstance(data["predictions"], list), "predictions should be a list"
        assert len(data["history"]) > 0, "history should have data"
        assert len(data["predictions"]) > 0, "predictions should have data"
        
        # Validate history item structure
        hist_item = data["history"][0]
        assert "date" in hist_item, "History item should have 'date'"
        assert "price" in hist_item, "History item should have 'price'"
        
        print(f"Rice trends: current={data['current_price']}, avg={data['average_price']}, change={data['predicted_change']}%")
        print(f"History points: {len(data['history'])}, Prediction points: {len(data['predictions'])}")


class TestEquipmentRental:
    """Equipment Rental API tests"""
    
    def test_equipment_search_returns_array(self):
        """GET /api/equipment/search returns array (even if empty)"""
        response = requests.get(f"{BASE_URL}/api/equipment/search")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"Found {len(data)} equipment listings")
    
    def test_equipment_list_creates_listing(self, auth_headers):
        """POST /api/equipment/list creates a new equipment listing"""
        payload = {
            "name": "TEST_Tractor_JohnDeere",
            "equipment_type": "Tractor",
            "description": "Test listing for automated testing",
            "price_per_day": 500.0,
            "state": "Maharashtra",
            "district": "Pune",
            "contact": "+91 9876543210"
        }
        response = requests.post(f"{BASE_URL}/api/equipment/list", json=payload, headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] == "success", "Status should be 'success'"
        assert "equipment" in data, "Response should contain 'equipment'"
        
        print(f"Equipment listed: {data['equipment']['name']}")
    
    def test_equipment_search_with_filters(self):
        """GET /api/equipment/search with filters returns filtered results"""
        response = requests.get(f"{BASE_URL}/api/equipment/search?state=Maharashtra&equipment_type=Tractor")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # If results exist, verify they match filters
        for item in data:
            if "state" in item:
                assert item["state"] == "Maharashtra", "Filtered results should match state"
            if "equipment_type" in item:
                assert item["equipment_type"] == "Tractor", "Filtered results should match type"
        
        print(f"Found {len(data)} tractors in Maharashtra")


class TestFinancialSupport:
    """Financial Support API tests"""
    
    def test_finance_schemes_returns_central_and_state(self):
        """GET /api/finance/schemes?state=Maharashtra returns central and state schemes"""
        response = requests.get(f"{BASE_URL}/api/finance/schemes?state=Maharashtra")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "central" in data, "Response should contain 'central' schemes"
        assert "state" in data, "Response should contain 'state' schemes"
        assert isinstance(data["central"], list), "central should be a list"
        assert isinstance(data["state"], list), "state should be a list"
        assert len(data["central"]) > 0, "Should have central schemes"
        
        # Validate scheme structure
        scheme = data["central"][0]
        assert "name" in scheme, "Scheme should have 'name'"
        assert "description" in scheme, "Scheme should have 'description'"
        
        print(f"Central schemes: {len(data['central'])}, State schemes: {len(data['state'])}")
    
    def test_finance_insurance_returns_options(self):
        """GET /api/finance/insurance returns array of insurance options"""
        response = requests.get(f"{BASE_URL}/api/finance/insurance")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have insurance options"
        
        # Validate insurance structure
        insurance = data[0]
        assert "name" in insurance, "Insurance should have 'name'"
        assert "type" in insurance, "Insurance should have 'type'"
        assert "description" in insurance, "Insurance should have 'description'"
        
        print(f"Insurance options: {len(data)}")
        for ins in data:
            print(f"  - {ins['name']} ({ins['type']})")


class TestChatbot:
    """Chatbot API tests"""
    
    def test_chat_returns_ai_response(self, auth_headers):
        """POST /api/chat returns AI response"""
        payload = {
            "message": "What is the best time to irrigate rice crops?",
            "session_id": "test-session-123"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload, headers=auth_headers, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert "timestamp" in data, "Response should contain 'timestamp' field"
        assert isinstance(data["response"], str), "response should be a string"
        assert len(data["response"]) > 0, "response should not be empty"
        
        print(f"Chatbot response (first 200 chars): {data['response'][:200]}...")


class TestRoverAnalysis:
    """Rover Analysis API tests"""
    
    def test_rover_analyze_frame_returns_analysis(self, auth_headers):
        """GET /api/rover/analyze-frame returns crop health analysis from rover model"""
        response = requests.get(f"{BASE_URL}/api/rover/analyze-frame", headers=auth_headers, timeout=30)
        
        # May return 500 if rover feed is unavailable, or 200 with analysis
        if response.status_code == 200:
            data = response.json()
            assert "source" in data, "Response should contain 'source'"
            assert "timestamp" in data, "Response should contain 'timestamp'"
            print(f"Rover analysis: {data}")
        elif response.status_code == 500:
            # Expected if rover feed is unavailable
            print(f"Rover feed unavailable (expected): {response.text}")
        elif response.status_code == 502:
            # Expected if external rover camera is down
            print(f"Rover camera backend unavailable (expected): {response.text}")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}: {response.text}")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root_returns_operational(self):
        """GET /api/ returns operational status"""
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] == "operational", "Status should be 'operational'"
        
        print(f"API status: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
