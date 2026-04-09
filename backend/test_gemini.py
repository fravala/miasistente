import asyncio
import os
import aiohttp
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def main():
    response = supabase.table("tenants").select("ai_provider, ai_api_key").eq("ai_provider", "gemini").execute()
    if not response.data:
        print("No gemini key found")
        return
    key = response.data[0]['ai_api_key']
    print(f"Key starts with {key[:5]}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            data = await resp.json()
            if 'models' in data:
                print("Available models supporting generateContent:")
                for m in data['models']:
                    if 'generateContent' in m.get('supportedGenerationMethods', []):
                        print(m['name'])
            else:
                print("API Error:", data)

asyncio.run(main())
