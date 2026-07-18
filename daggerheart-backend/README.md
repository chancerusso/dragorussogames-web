# Standalone Daggerheart Backend

This service owns Daggerheart accounts, characters, campaigns, membership, character assignment, and persistent VTT state. It does not import or share models, migrations, tables, or configuration with the OSRIC backend.

## Local development

```bash
cd daggerheart-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8020
```

API documentation is available at `http://127.0.0.1:8020/docs`.

Table state is revisioned to prevent one browser from silently overwriting a newer save. Player responses contain only `public_state`; `gm_state` is returned only to the campaign GM. The latest twenty prior revisions are retained as snapshots.
