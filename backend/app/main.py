from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from urllib.parse import quote

from app.api import router
from app.auth import require_admin, verify_admin_token, verify_player_token
from app.config import cors_origin_list, settings
from app.services.canonical_content import get_canonical_content

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


@app.on_event("startup")
def load_canonical_content_if_enabled() -> None:
    if settings.canonical_content_enabled:
        canonical_content = get_canonical_content()
        canonical_content.enabled = True
        canonical_content.load_all()


def authenticated_role(request: Request) -> str | None:
    admin_session = request.cookies.get("drg_admin_session")
    player_session = request.cookies.get("drg_player_session")
    for role, token, verifier in (
        ("admin", admin_session, verify_admin_token),
        ("player", player_session, verify_player_token),
    ):
        if not token:
            continue
        try:
            verifier(token)
            return role
        except HTTPException:
            continue
    return None


def login_redirect(request: Request) -> RedirectResponse:

    destination = request.url.path
    if request.url.query:
        destination = f"{destination}?{request.url.query}"
    return RedirectResponse(url=f"/login?next={quote(destination, safe='')}", status_code=303)


@app.middleware("http")
async def protect_one_e_static_routes(request: Request, call_next):
    path = request.url.path
    if path == "/1e" or path.startswith("/1e/"):
        role = authenticated_role(request)
        if role is None:
            return login_redirect(request)
        if path.startswith("/1e/dm") and role != "admin":
            return JSONResponse(status_code=401, content={"detail": "Authentication required."})
    return await call_next(request)


@app.get("/1e/characters/")
def characters_index_route(request: Request) -> Response:
    if authenticated_role(request) is None:
        return login_redirect(request)
    return FileResponse(SITE_ROOT / "1e" / "characters" / "index.html")


@app.get("/1e/characters/new/")
def character_new_route(request: Request) -> Response:
    if authenticated_role(request) is None:
        return login_redirect(request)
    return FileResponse(SITE_ROOT / "1e" / "characters" / "new" / "index.html")


@app.get("/1e/characters/{character_id}/")
def character_sheet_route(character_id: int, request: Request) -> Response:
    if authenticated_role(request) is None:
        return login_redirect(request)
    return FileResponse(SITE_ROOT / "1e" / "characters" / "1" / "index.html")


@app.get("/1e/characters/{character_id}/edit/")
def character_edit_route(character_id: int, request: Request) -> Response:
    if authenticated_role(request) is None:
        return login_redirect(request)
    return FileResponse(SITE_ROOT / "1e" / "characters" / "1" / "edit" / "index.html")


@app.get("/1e/dm/campaigns/{campaign_id}/")
def campaign_route(campaign_id: int, _: dict = Depends(require_admin)) -> FileResponse:
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


@app.get("/docs/sources/{source_path:path}", include_in_schema=False)
def deny_source_material(source_path: str) -> None:
    raise HTTPException(status_code=404, detail="Not found.")


@app.get("/content/1e/source/{source_path:path}", include_in_schema=False)
def deny_one_e_source_material(source_path: str) -> None:
    raise HTTPException(status_code=404, detail="Not found.")


@app.get("/private-reference/{source_path:path}", include_in_schema=False)
def deny_private_reference(source_path: str) -> None:
    raise HTTPException(status_code=404, detail="Not found.")


if SITE_ROOT.exists():
    app.mount("/", StaticFiles(directory=SITE_ROOT, html=True), name="site")
