#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PackVote_APITester:
    def __init__(self, base_url="https://discoveryatra.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []
        self.test_trip_id = None
        self.test_invite_code = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.passed_tests.append(name)
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response: Dict with keys: {list(response_data.keys())[:5]}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_all_destinations(self):
        """Test getting all destinations"""
        success, data = self.run_test("Get All Destinations", "GET", "destinations", 200)
        if success and data:
            print(f"   Found {len(data)} destinations")
            if len(data) > 0:
                print(f"   Sample destination: {data[0].get('name', 'Unknown')}")
        return success, data

    def test_search_destinations(self):
        """Test destination search functionality"""
        test_queries = ["Delhi", "Goa", "Beach", "Temple"]
        all_passed = True
        
        for query in test_queries:
            success, data = self.run_test(
                f"Search Destinations - '{query}'", 
                "GET", 
                "destinations/search", 
                200, 
                params={"q": query}
            )
            if success and data:
                print(f"   Found {len(data)} results for '{query}'")
            all_passed = all_passed and success
            
        return all_passed

    def test_destination_details(self, destination_id="delhi"):
        """Test getting destination details"""
        return self.run_test(
            f"Get Destination Details - {destination_id}", 
            "GET", 
            f"destinations/{destination_id}", 
            200
        )

    def test_destination_hotels(self, destination_id="delhi"):
        """Test getting hotels for a destination"""
        success, data = self.run_test(
            f"Get Hotels - {destination_id}", 
            "GET", 
            f"destinations/{destination_id}/hotels", 
            200
        )
        if success and data:
            print(f"   Found {len(data)} hotels")
        return success, data

    def test_destination_attractions(self, destination_id="delhi"):
        """Test getting attractions for a destination"""
        success, data = self.run_test(
            f"Get Attractions - {destination_id}", 
            "GET", 
            f"destinations/{destination_id}/attractions", 
            200
        )
        if success and data:
            print(f"   Found {len(data)} attractions")
        return success, data

    def test_destination_shopping(self, destination_id="delhi"):
        """Test getting shopping places for a destination"""
        success, data = self.run_test(
            f"Get Shopping - {destination_id}", 
            "GET", 
            f"destinations/{destination_id}/shopping", 
            200
        )
        if success and data:
            print(f"   Found {len(data)} shopping places")
        return success, data

    def test_destination_transport(self, destination_id="delhi"):
        """Test getting transport options for a destination"""
        success, data = self.run_test(
            f"Get Transport - {destination_id}", 
            "GET", 
            f"destinations/{destination_id}/transport", 
            200
        )
        if success and data:
            print(f"   Found {len(data)} transport options")
        return success, data

    def test_ai_description(self, destination_name="Delhi", topic="overview"):
        """Test AI description generation"""
        return self.run_test(
            f"AI Description - {destination_name} ({topic})", 
            "POST", 
            "ai/description", 
            200,
            data={
                "destination_name": destination_name,
                "topic": topic
            }
        )

    # ============== NEW PACKVOTE API TESTS ==============
    
    def test_create_trip(self):
        """Test creating a new trip"""
        trip_data = {
            "name": "Test Group Trip to Goa",
            "creator_name": "Test User",
            "group_type": "friends",
            "budget_per_person": 15000
        }
        
        success, data = self.run_test(
            "Create Trip", 
            "POST", 
            "trips", 
            200,
            data=trip_data
        )
        
        if success and data:
            self.test_trip_id = data.get('trip_id')
            self.test_invite_code = data.get('invite_code')
            print(f"   Trip ID: {self.test_trip_id}")
            print(f"   Invite Code: {self.test_invite_code}")
        
        return success, data

    def test_join_trip(self):
        """Test joining an existing trip"""
        if not self.test_invite_code:
            print("❌ Skipping join trip test - no invite code available")
            return False, {}
            
        join_data = {
            "invite_code": self.test_invite_code,
            "member_name": "Test Member 2"
        }
        
        return self.run_test(
            "Join Trip", 
            "POST", 
            "trips/join", 
            200,
            data=join_data
        )

    def test_get_trip_details(self):
        """Test getting trip details"""
        if not self.test_trip_id:
            print("❌ Skipping trip details test - no trip ID available")
            return False, {}
            
        return self.run_test(
            "Get Trip Details", 
            "GET", 
            f"trips/{self.test_trip_id}", 
            200
        )

    def test_vote_on_destination(self):
        """Test voting on a destination"""
        if not self.test_trip_id:
            print("❌ Skipping vote test - no trip ID available")
            return False, {}
            
        vote_data = {
            "trip_id": self.test_trip_id,
            "voter_name": "Test User",
            "item_type": "destination",
            "item_id": "goa"
        }
        
        return self.run_test(
            "Vote on Destination", 
            "POST", 
            f"trips/{self.test_trip_id}/vote", 
            200,
            data=vote_data
        )

    def test_get_voting_results(self):
        """Test getting voting results"""
        if not self.test_trip_id:
            print("❌ Skipping voting results test - no trip ID available")
            return False, {}
            
        return self.run_test(
            "Get Voting Results", 
            "GET", 
            f"trips/{self.test_trip_id}/results", 
            200
        )

    def test_compare_destinations(self):
        """Test comparing destinations"""
        compare_data = {
            "item_type": "destinations",
            "item_ids": ["delhi", "goa", "jaipur"]
        }
        
        return self.run_test(
            "Compare Destinations", 
            "POST", 
            "compare", 
            200,
            data=compare_data
        )

    def test_ai_suggestions(self):
        """Test AI travel suggestions"""
        suggestion_data = {
            "group_type": "friends",
            "budget_per_person": 15000,
            "duration_days": 5,
            "interests": ["Beaches", "Adventure"],
            "group_size": 4
        }
        
        return self.run_test(
            "AI Travel Suggestions", 
            "POST", 
            "ai/suggestions", 
            200,
            data=suggestion_data
        )

    def test_packvote_features(self):
        """Test all PackVote specific features"""
        print("\n🎯 PACKVOTE FEATURES TESTS")
        
        # Test trip creation
        success1, _ = self.test_create_trip()
        
        # Test joining trip (depends on creation)
        success2, _ = self.test_join_trip()
        
        # Test trip details
        success3, _ = self.test_get_trip_details()
        
        # Test voting
        success4, _ = self.test_vote_on_destination()
        
        # Test voting results
        success5, _ = self.test_get_voting_results()
        
        # Test comparison
        success6, _ = self.test_compare_destinations()
        
        # Test AI suggestions
        success7, _ = self.test_ai_suggestions()
        
        return all([success1, success2, success3, success4, success5, success6, success7])

    def test_all_destinations_data(self):
        """Test all destination endpoints for multiple cities"""
        destinations = ["delhi", "jaipur", "goa", "kerala", "agra", "varanasi", "mumbai", "udaipur"]
        all_passed = True
        
        for dest_id in destinations[:3]:  # Test first 3 to avoid too many requests
            print(f"\n--- Testing {dest_id.upper()} ---")
            
            # Test destination details
            success1, _ = self.test_destination_details(dest_id)
            success2, _ = self.test_destination_hotels(dest_id)
            success3, _ = self.test_destination_attractions(dest_id)
            success4, _ = self.test_destination_shopping(dest_id)
            success5, _ = self.test_destination_transport(dest_id)
            
            all_passed = all_passed and success1 and success2 and success3 and success4 and success5
            
        return all_passed

def main():
    print("🎯 PackVote API Testing")
    print("=" * 50)
    
    # Setup
    tester = PackVote_APITester()
    
    # Run basic tests
    print("\n📋 BASIC API TESTS")
    tester.test_root_endpoint()
    
    # Test destinations (legacy functionality)
    print("\n🏛️ DESTINATIONS TESTS")
    success, destinations = tester.test_get_all_destinations()
    if not success:
        print("❌ Critical: Cannot fetch destinations, stopping tests")
        return 1
    
    # Test search
    print("\n🔍 SEARCH TESTS")
    tester.test_search_destinations()
    
    # Test detailed destination data
    print("\n📍 DESTINATION DETAILS TESTS")
    tester.test_all_destinations_data()
    
    # Test AI functionality
    print("\n🤖 AI DESCRIPTION TESTS")
    tester.test_ai_description("Delhi", "overview")
    tester.test_ai_description("Goa", "food")
    
    # Test PackVote specific features
    tester.test_packvote_features()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 TEST RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            else:
                print(f"   Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    if tester.passed_tests:
        print(f"\n✅ PASSED TESTS ({len(tester.passed_tests)}):")
        for test in tester.passed_tests:
            print(f"   • {test}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())