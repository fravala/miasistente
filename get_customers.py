import sys
import os
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from dotenv import load_dotenv
load_dotenv("/home/francisco/Proyectos/Proyectos/miasistente/backend/.env")
from supabase import create_client, Client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print(supabase.table("crm_customers").select("*").execute().data)
