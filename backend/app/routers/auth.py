from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login")
def login():
    return {"message": "Login successful"}

@router.post("/logout")
def logout():
    return {"message": "Logout successful"}
