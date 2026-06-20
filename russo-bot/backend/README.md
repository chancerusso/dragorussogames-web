# RUSSO Backend

FastAPI service for the RUSSO persistent character ledger.

## Local Commands

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

## API

- `GET /api/health`
- `POST /api/characters`
- `GET /api/characters/by-discord/{discord_user_id}`
