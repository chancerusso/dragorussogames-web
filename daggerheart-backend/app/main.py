from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.config import cors_origin_list

app = FastAPI(title="Drago Russo Daggerheart Backend", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=cors_origin_list(), allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
