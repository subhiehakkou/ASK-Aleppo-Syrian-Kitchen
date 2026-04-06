#!/usr/bin/env python3
"""
Aleppo Syrian Kitchen API Backend Test Suite
Tests all backend endpoints as specified in the review request.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend environment
BASE_URL = "https://aleppo-culinary-app.preview.emergentagent.com/api"

class APITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = []
        
    def log_result(self, test_name, success, details, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response_data'] = response_data
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_endpoint(self):
        """Test GET /api/health"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code != 200:
                self.log_result("Health Check", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if 'status' not in data or data['status'] != 'healthy':
                self.log_result("Health Check", False, f"Invalid response structure: {data}")
                return False
                
            if 'timestamp' not in data:
                self.log_result("Health Check", False, "Missing timestamp in response")
                return False
                
            self.log_result("Health Check", True, "Health endpoint working correctly", data)
            return True
            
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_categories_endpoint(self):
        """Test GET /api/categories - Should return 11 categories with multilingual names"""
        try:
            response = self.session.get(f"{self.base_url}/categories")
            
            if response.status_code != 200:
                self.log_result("Categories List", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify it's a list
            if not isinstance(data, list):
                self.log_result("Categories List", False, f"Expected list, got {type(data)}")
                return False
                
            # Verify count
            if len(data) != 11:
                self.log_result("Categories List", False, f"Expected 11 categories, got {len(data)}")
                return False
                
            # Verify structure of first category
            if data:
                category = data[0]
                required_fields = ['cat_id', 'name_ar', 'name_en', 'name_sv']
                missing_fields = [field for field in required_fields if field not in category]
                
                if missing_fields:
                    self.log_result("Categories List", False, f"Missing fields in category: {missing_fields}")
                    return False
                    
            self.log_result("Categories List", True, f"Found {len(data)} categories with correct multilingual structure")
            return True
            
        except Exception as e:
            self.log_result("Categories List", False, f"Exception: {str(e)}")
            return False
    
    def test_single_category_endpoint(self):
        """Test GET /api/categories/Keb - Should return the Kibbeh category"""
        try:
            response = self.session.get(f"{self.base_url}/categories/Keb")
            
            if response.status_code != 200:
                self.log_result("Single Category (Keb)", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify it's the correct category
            if data.get('cat_id') != 'Keb':
                self.log_result("Single Category (Keb)", False, f"Expected cat_id 'Keb', got '{data.get('cat_id')}'")
                return False
                
            # Verify multilingual fields
            required_fields = ['name_ar', 'name_en', 'name_sv']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Single Category (Keb)", False, f"Missing fields: {missing_fields}")
                return False
                
            self.log_result("Single Category (Keb)", True, f"Kibbeh category found with multilingual names")
            return True
            
        except Exception as e:
            self.log_result("Single Category (Keb)", False, f"Exception: {str(e)}")
            return False
    
    def test_recipes_by_category(self):
        """Test GET /api/recipes?category_id=Keb - Should return recipes for Kibbeh category"""
        try:
            response = self.session.get(f"{self.base_url}/recipes?category_id=Keb")
            
            if response.status_code != 200:
                self.log_result("Recipes by Category", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify it's a list
            if not isinstance(data, list):
                self.log_result("Recipes by Category", False, f"Expected list, got {type(data)}")
                return False
                
            # Verify all recipes belong to Keb category
            for recipe in data:
                if recipe.get('category_id') != 'Keb':
                    self.log_result("Recipes by Category", False, f"Found recipe with wrong category_id: {recipe.get('category_id')}")
                    return False
                    
            # Verify multilingual fields in first recipe if exists
            if data:
                recipe = data[0]
                multilingual_fields = ['name_ar', 'name_en', 'name_sv']
                missing_fields = [field for field in multilingual_fields if field not in recipe]
                
                if missing_fields:
                    self.log_result("Recipes by Category", False, f"Missing multilingual fields in recipe: {missing_fields}")
                    return False
                    
            self.log_result("Recipes by Category", True, f"Found {len(data)} Kibbeh recipes with multilingual content")
            return True
            
        except Exception as e:
            self.log_result("Recipes by Category", False, f"Exception: {str(e)}")
            return False
    
    def test_all_recipes_endpoint(self):
        """Test GET /api/recipes - Should return all 75 recipes"""
        try:
            response = self.session.get(f"{self.base_url}/recipes")
            
            if response.status_code != 200:
                self.log_result("All Recipes", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify it's a list
            if not isinstance(data, list):
                self.log_result("All Recipes", False, f"Expected list, got {type(data)}")
                return False
                
            # Verify count
            if len(data) != 75:
                self.log_result("All Recipes", False, f"Expected 75 recipes, got {len(data)}")
                return False
                
            # Verify multilingual structure in first recipe
            if data:
                recipe = data[0]
                multilingual_fields = ['name_ar', 'name_en', 'name_sv']
                missing_fields = [field for field in multilingual_fields if field not in recipe]
                
                if missing_fields:
                    self.log_result("All Recipes", False, f"Missing multilingual fields: {missing_fields}")
                    return False
                    
            self.log_result("All Recipes", True, f"Found all {len(data)} recipes with multilingual content")
            return True
            
        except Exception as e:
            self.log_result("All Recipes", False, f"Exception: {str(e)}")
            return False
    
    def test_about_endpoint(self):
        """Test GET /api/about - Should return about information with multilingual content"""
        try:
            response = self.session.get(f"{self.base_url}/about")
            
            if response.status_code != 200:
                self.log_result("About Info", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify multilingual fields
            required_fields = ['title_ar', 'slogan_ar', 'about_ar', 'title_en', 'slogan_en', 'about_en', 'title_sv', 'slogan_sv', 'about_sv']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("About Info", False, f"Missing multilingual fields: {missing_fields}")
                return False
                
            # Verify content is not empty for key fields
            if not data.get('title_ar') or not data.get('about_ar'):
                self.log_result("About Info", False, "Arabic content is empty")
                return False
                
            self.log_result("About Info", True, "About information with complete multilingual content")
            return True
            
        except Exception as e:
            self.log_result("About Info", False, f"Exception: {str(e)}")
            return False
    
    def test_contact_endpoint(self):
        """Test GET /api/contact - Should return contact info with email askmalmo@gmail.com"""
        try:
            response = self.session.get(f"{self.base_url}/contact")
            
            if response.status_code != 200:
                self.log_result("Contact Info", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify email field
            if 'email' not in data:
                self.log_result("Contact Info", False, "Missing email field")
                return False
                
            if data['email'] != 'askmalmo@gmail.com':
                self.log_result("Contact Info", False, f"Expected email 'askmalmo@gmail.com', got '{data['email']}'")
                return False
                
            # Verify other expected fields
            expected_fields = ['app_name', 'app_name_ar']
            missing_fields = [field for field in expected_fields if field not in data]
            
            if missing_fields:
                self.log_result("Contact Info", False, f"Missing fields: {missing_fields}")
                return False
                
            self.log_result("Contact Info", True, f"Contact info correct with email: {data['email']}")
            return True
            
        except Exception as e:
            self.log_result("Contact Info", False, f"Exception: {str(e)}")
            return False
    
    def test_feedback_submission(self):
        """Test POST /api/feedback - Submit test feedback"""
        try:
            feedback_data = {
                "name": "Ahmad Al-Halabi",
                "email": "ahmad.test@example.com",
                "message": "This is a test feedback for the Aleppo Syrian Kitchen app. The recipes look amazing!"
            }
            
            response = self.session.post(f"{self.base_url}/feedback", json=feedback_data)
            
            if response.status_code != 200:
                self.log_result("Feedback Submission", False, f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ['id', 'name', 'email', 'message', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Feedback Submission", False, f"Missing fields in response: {missing_fields}")
                return False
                
            # Verify data matches input
            if data['name'] != feedback_data['name']:
                self.log_result("Feedback Submission", False, f"Name mismatch: expected '{feedback_data['name']}', got '{data['name']}'")
                return False
                
            if data['email'] != feedback_data['email']:
                self.log_result("Feedback Submission", False, f"Email mismatch: expected '{feedback_data['email']}', got '{data['email']}'")
                return False
                
            if data['message'] != feedback_data['message']:
                self.log_result("Feedback Submission", False, f"Message mismatch")
                return False
                
            self.log_result("Feedback Submission", True, f"Feedback submitted successfully with ID: {data['id']}")
            return True
            
        except Exception as e:
            self.log_result("Feedback Submission", False, f"Exception: {str(e)}")
            return False
    
    def test_json_responses(self):
        """Verify all responses are valid JSON"""
        endpoints = [
            "/health",
            "/categories", 
            "/categories/Keb",
            "/recipes",
            "/recipes?category_id=Keb",
            "/about",
            "/contact"
        ]
        
        all_valid = True
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                response.json()  # This will raise an exception if not valid JSON
            except Exception as e:
                self.log_result("JSON Validation", False, f"Invalid JSON from {endpoint}: {str(e)}")
                all_valid = False
                
        if all_valid:
            self.log_result("JSON Validation", True, "All endpoints return valid JSON")
            
        return all_valid
    
    def run_all_tests(self):
        """Run all tests and return summary"""
        print(f"🚀 Starting Aleppo Syrian Kitchen API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        tests = [
            self.test_health_endpoint,
            self.test_categories_endpoint,
            self.test_single_category_endpoint,
            self.test_recipes_by_category,
            self.test_all_recipes_endpoint,
            self.test_about_endpoint,
            self.test_contact_endpoint,
            self.test_feedback_submission,
            self.test_json_responses
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"📊 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! The Aleppo Syrian Kitchen API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
            
        return passed == total, self.results

def main():
    """Main test execution"""
    tester = APITester(BASE_URL)
    success, results = tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/test_results_detailed.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_results_detailed.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())