from fastapi import FastAPI

from app.api import router

app = FastAPI(title="RUSSO Backend", version="0.1.0")
app.include_router(router)
