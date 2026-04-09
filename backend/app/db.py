import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno desde el archivo .env
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("¡Faltan credenciales de Supabase en el archivo .env!")

# Instanciar el cliente oficial que conectará directamente con tu base de datos
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Dependencia para inyectar este cliente en nuestras rutas de FastAPI
def get_db():
    return supabase
