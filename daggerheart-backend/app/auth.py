from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Optional

from fastapi import Header, HTTPException, status

from app.config import settings

TOKEN_TTL_SECONDS = 60 * 60 * 24
PASSWORD_ITERATIONS = 260_000


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${base64.b64encode(digest).decode()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations))
        return hmac.compare_digest(base64.b64encode(digest).decode(), expected)
    except (TypeError, ValueError):
        return False


def create_token(user_id: int, role: str) -> str:
    header = _encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _encode(json.dumps({"sub": user_id, "role": role, "exp": int(time.time()) + TOKEN_TTL_SECONDS}, separators=(",", ":")).encode())
    signing_input = f"{header}.{payload}"
    signature = _encode(hmac.new(settings.secret_key.encode(), signing_input.encode(), hashlib.sha256).digest())
    return f"{signing_input}.{signature}"


def verify_token(token: Optional[str]) -> dict[str, Any]:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    try:
        header, payload, signature = token.split(".", 2)
        signing_input = f"{header}.{payload}"
        expected = _encode(hmac.new(settings.secret_key.encode(), signing_input.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        claims = json.loads(_decode(payload))
        if int(claims.get("exp", 0)) < int(time.time()):
            raise ValueError
        return claims
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Invalid or expired session.") from None


def require_user(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    token = authorization.split(" ", 1)[1] if authorization and authorization.lower().startswith("bearer ") else None
    return verify_token(token)


def require_gm(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    claims = require_user(authorization)
    if claims.get("role") != "gm":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="GM access required.")
    return claims
