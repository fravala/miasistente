import asyncio
from httpx import AsyncClient, ASGITransport
import sys
sys.path.append("/home/francisco/Proyectos/Proyectos/miasistente/backend")
from app.main import app
from app.assistant_router import UserContext

async def run():
    transport = ASGITransport(app=app)
    app.dependency_overrides.clear()
    
    from app.assistant_router import get_current_user
    app.dependency_overrides[get_current_user] = lambda: UserContext(
        user_id="28e940fd-9d73-4b0e-acc8-af0af011548b",
        role="admin",
        tenant_id="1ff29a18-5148-44ec-9ae2-99b3813921e4"
    )
    
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/crm/customers")
        print(response.status_code)
        print(response.json())

if __name__ == "__main__":
    asyncio.run(run())
