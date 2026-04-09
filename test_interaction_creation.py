#!/usr/bin/env python3
"""Test script to verify interaction creation and UUID serialization"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from uuid import UUID, uuid4
from datetime import datetime
from app.schemas.crm import InteractionCreate, InteractionResponse

# Test 1: Create an InteractionCreate object with task_id
print("Test 1: Creating InteractionCreate with task_id")
try:
    interaction = InteractionCreate(
        interaction_type="note",
        description="Test note",
        interaction_date=datetime.now(),
        task_id=uuid4()
    )
    print(f"✓ InteractionCreate created successfully")
    print(f"  interaction_type: {interaction.interaction_type}")
    print(f"  description: {interaction.description}")
    print(f"  task_id: {interaction.task_id} (type: {type(interaction.task_id)})")
except Exception as e:
    print(f"✗ Error creating InteractionCreate: {e}")

# Test 2: Create an InteractionCreate object without task_id
print("\nTest 2: Creating InteractionCreate without task_id")
try:
    interaction = InteractionCreate(
        interaction_type="note",
        description="Test note",
        interaction_date=datetime.now()
    )
    print(f"✓ InteractionCreate created successfully")
    print(f"  interaction_type: {interaction.interaction_type}")
    print(f"  description: {interaction.description}")
    print(f"  task_id: {interaction.task_id} (type: {type(interaction.task_id)})")
except Exception as e:
    print(f"✗ Error creating InteractionCreate: {e}")

# Test 3: Model dump with exclude_none=True
print("\nTest 3: Model dump with exclude_none=True")
try:
    interaction = InteractionCreate(
        interaction_type="note",
        description="Test note",
        interaction_date=datetime.now(),
        task_id=uuid4()
    )
    data = interaction.model_dump(exclude_none=True)
    print(f"✓ Model dump successful")
    print(f"  interaction_type: {data['interaction_type']}")
    print(f"  description: {data['description']}")
    print(f"  task_id: {data['task_id']} (type: {type(data['task_id'])})")
except Exception as e:
    print(f"✗ Error dumping model: {e}")

# Test 4: Model dump with exclude_none=True and no task_id
print("\nTest 4: Model dump with exclude_none=True and no task_id")
try:
    interaction = InteractionCreate(
        interaction_type="note",
        description="Test note",
        interaction_date=datetime.now()
    )
    data = interaction.model_dump(exclude_none=True)
    print(f"✓ Model dump successful")
    print(f"  interaction_type: {data['interaction_type']}")
    print(f"  description: {data['description']}")
    print(f"  task_id in data: {'task_id' in data}")
except Exception as e:
    print(f"✗ Error dumping model: {e}")

# Test 5: Create InteractionResponse from dict
print("\nTest 5: Creating InteractionResponse from dict")
try:
    interaction_data = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "customer_id": uuid4(),
        "interaction_type": "note",
        "description": "Test note",
        "interaction_date": datetime.now(),
        "task_id": uuid4(),
        "created_by": uuid4(),
        "created_at": datetime.now()
    }
    response = InteractionResponse(**interaction_data)
    print(f"✓ InteractionResponse created successfully")
    print(f"  id: {response.id} (type: {type(response.id)})")
    print(f"  task_id: {response.task_id} (type: {type(response.task_id)})")
except Exception as e:
    print(f"✗ Error creating InteractionResponse: {e}")

# Test 6: Create InteractionResponse from dict with null task_id
print("\nTest 6: Creating InteractionResponse from dict with null task_id")
try:
    interaction_data = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "customer_id": uuid4(),
        "interaction_type": "note",
        "description": "Test note",
        "interaction_date": datetime.now(),
        "task_id": None,
        "created_by": None,
        "created_at": datetime.now()
    }
    response = InteractionResponse(**interaction_data)
    print(f"✓ InteractionResponse created successfully")
    print(f"  id: {response.id} (type: {type(response.id)})")
    print(f"  task_id: {response.task_id} (type: {type(response.task_id)})")
except Exception as e:
    print(f"✗ Error creating InteractionResponse: {e}")

# Test 7: Model dump of InteractionResponse
print("\nTest 7: Model dump of InteractionResponse")
try:
    interaction_data = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "customer_id": uuid4(),
        "interaction_type": "note",
        "description": "Test note",
        "interaction_date": datetime.now(),
        "task_id": uuid4(),
        "created_by": uuid4(),
        "created_at": datetime.now()
    }
    response = InteractionResponse(**interaction_data)
    data = response.model_dump()
    print(f"✓ Model dump successful")
    print(f"  id: {data['id']} (type: {type(data['id'])})")
    print(f"  task_id: {data['task_id']} (type: {type(data['task_id'])})")
except Exception as e:
    print(f"✗ Error dumping model: {e}")

print("\n" + "="*60)
print("All tests completed!")
