import sys
from pathlib import Path

# Add the parent directory to the Python path to allow importing 'app.database'
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_database

if __name__ == "__main__":
    init_database()
    print("Database initialized successfully at backend/data/aquashield.db")
