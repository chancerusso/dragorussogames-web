from fastapi import FastAPI
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import router
from app.auth import require_admin
from app.config import cors_origin_list

app = FastAPI(title="RUSSO Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

SITE_ROOT = Path(__file__).resolve().parents[2]


@app.get("/1e/characters/")
def characters_index_route() -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "characters" / "index.html")


@app.get("/1e/characters/new/")
def character_new_route() -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "characters" / "new" / "index.html")


@app.get("/1e/characters/{character_id}/")
def character_sheet_route(character_id: int) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "characters" / "1" / "index.html")


@app.get("/1e/characters/{character_id}/edit/")
def character_edit_route(character_id: int) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "characters" / "1" / "edit" / "index.html")


@app.get("/1e/dm/campaigns/{campaign_id}/")
def campaign_route(campaign_id: int) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "dm" / "campaigns" / "1" / "index.html")


@app.get("/1e/dm/")
def dm_dashboard_route(_: dict = Depends(require_admin)) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "dm" / "index.html")


@app.get("/1e/dm/campaigns/")
def dm_campaigns_route(_: dict = Depends(require_admin)) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "dm" / "campaigns" / "index.html")


@app.get("/1e/dm/players/")
def dm_players_route(_: dict = Depends(require_admin)) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "dm" / "players" / "index.html")


@app.get("/1e/dm/characters/")
def dm_characters_route(_: dict = Depends(require_admin)) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "dm" / "characters" / "index.html")


@app.get("/1e/dm/equipment/")
def dm_equipment_route(_: dict = Depends(require_admin)) -> FileResponse:
    return FileResponse(SITE_ROOT / "1e" / "dm" / "equipment" / "index.html")


if SITE_ROOT.exists():
    app.mount("/", StaticFiles(directory=SITE_ROOT, html=True), name="site")
