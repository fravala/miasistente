from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_settings():
    return {"theme": "light", "language": "es"}
