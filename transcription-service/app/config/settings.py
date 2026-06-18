# Purpose: Load and expose configuration values.

import os
from pymongo import MongoClient

# Main flow: Execute core operations and return results.

_client = None

# Function: get_db - Returns db.
def get_db():
    global _client
    if _client is None:
        _client = MongoClient(os.getenv("MONGO_URI"))
    return _client.get_default_database()
