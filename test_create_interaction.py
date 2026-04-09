#!/usr/bin/env python3
"""Test script to verify interaction creation with UUID serialization"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CUSTOMERS_URL = f"{BASE_URL}/api/crm/customers"
INTERACTIONS_URL = f"{CUSTOMERS_URL}/{{customer_id}}/interactions"

# Test credentials
TEST_EMAIL = "admin@miasistente.com"
TEST_PASSWORD = "admin123"

def login():
    """Login and get access token"""
    print("Logging in...")
    response = requests.post(LOGIN_URL, json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Login successful")
        return data["access_token"]
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

def get_customers(token):
    """Get list of customers"""
    print("\nGetting customers...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(CUSTOMERS_URL, headers=headers)
    
    if response.status_code == 200:
        customers = response.json()
        print(f"✓ Got {len(customers)} customers")
        return customers
    else:
        print(f"✗ Failed to get customers: {response.status_code}")
        print(f"  Response: {response.text}")
        return []

def create_interaction(token, customer_id, interaction_data):
    """Create an interaction"""
    print(f"\nCreating interaction for customer {customer_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    url = INTERACTIONS_URL.format(customer_id=customer_id)
    
    response = requests.post(url, json=interaction_data, headers=headers)
    
    if response.status_code == 201:
        interaction = response.json()
        print(f"✓ Interaction created successfully")
        print(f"  ID: {interaction.get('id')}")
        print(f"  Type: {interaction.get('interaction_type')}")
        print(f"  Description: {interaction.get('description')}")
        print(f"  Task ID: {interaction.get('task_id')}")
        return interaction
    else:
        print(f"✗ Failed to create interaction: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

def main():
    print("="*60)
    print("Test Script: Interaction Creation with UUID Serialization")
    print("="*60)
    
    # Login
    token = login()
    if not token:
        return
    
    # Get customers
    customers = get_customers(token)
    if not customers:
        return
    
    # Use first customer
    customer = customers[0]
    customer_id = customer["id"]
    print(f"\nUsing customer: {customer.get('first_name')} {customer.get('last_name')} ({customer_id})")
    
    # Test 1: Create interaction without task_id
    print("\n" + "-"*60)
    print("Test 1: Create interaction without task_id")
    print("-"*60)
    interaction_data_1 = {
        "interaction_type": "note",
        "description": "Test note without task"
    }
    interaction_1 = create_interaction(token, customer_id, interaction_data_1)
    
    # Test 2: Create interaction with task_id
    print("\n" + "-"*60)
    print("Test 2: Create interaction with task_id")
    print("-"*60)
    interaction_data_2 = {
        "interaction_type": "note",
        "description": "Test note with task",
        "task_id": "00000000-0000-0000-0000-000000000000"  # Invalid UUID, just for testing
    }
    interaction_2 = create_interaction(token, customer_id, interaction_data_2)
    
    # Test 3: Create interaction with interaction_date
    print("\n" + "-"*60)
    print("Test 3: Create interaction with interaction_date")
    print("-"*60)
    from datetime import datetime
    interaction_data_3 = {
        "interaction_type": "meeting",
        "description": "Test meeting",
        "interaction_date": datetime.now().isoformat()
    }
    interaction_3 = create_interaction(token, customer_id, interaction_data_3)
    
    print("\n" + "="*60)
    print("All tests completed!")
    print("="*60)

if __name__ == "__main__":
    main()
