import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    # Supabase data API doesn't support raw SQL easily unless using RPC or postgres directly.
    # We will use postgres python driver if available, or just instruct the user to run it.
    pass
except Exception as e:
    print(e)
