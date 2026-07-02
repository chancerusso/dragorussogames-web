from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any, Optional

from fastapi import Cookie, Header, HTTPException, status

from app.config import settings

TOKEN_TTL_SECONDS = 60 * 60 * 12
TOKEN_ALGORITHM = "HS256"


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _json_bytes(value: dict[str, Any]) -> bytes:
    return json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")


def _signature(signing_input: str) -> str:
    digest = hmac.new(settings.secret_key.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    return _base64url_encode(digest)


def create_admin_token() -> str:
    now = int(time.time())
    header = {"alg": TOKEN_ALGORITHM, "typ": "JWT"}
    payload = {
        "sub": "admin",
        "role": "admin",
        "iat": now,
        "exp": now + TOKEN_TTL_SECONDS,
    }
    signing_input = ".".join((_base64url_encode(_json_bytes(header)), _base64url_encode(_json_bytes(payload))))
    return f"{signing_input}.{_signature(signing_input)}"


def verify_admin_token(token: Optional[str]) -> dict[str, Any]:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    try:
        header_b64, payload_b64, signature = token.split(".", 2)
        signing_input = f"{header_b64}.{payload_b64}"
        if not hmac.compare_digest(signature, _signature(signing_input)):
            raise ValueError("bad signature")
        header = json.loads(_base64url_decode(header_b64))
        payload = json.loads(_base64url_decode(payload_b64))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.") from None
    if header.get("alg") != TOKEN_ALGORITHM or payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.")
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.")
    return payload


def require_admin(
    authorization: Optional[str] = Header(default=None),
    drg_admin_session: Optional[str] = Cookie(default=None),
) -> dict[str, Any]:
    token = drg_admin_session
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    return verify_admin_token(token)


def validate_admin_password(password: Optional[str]) -> None:
    if not settings.admin_password:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="ADMIN_PASSWORD is not configured.")
    if not password or not hmac.compare_digest(password, settings.admin_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin password.")
