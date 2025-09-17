# SIH Local Development Setup

## Quick Start
1. Copy `.env.sample` to `.env` and customize.
2. Run `make up` to start infra (Postgres, MinIO, Redis, Keycloak).
3. (Optional) Run `make fabric` for Hyperledger Fabric dev network (or set FABRIC_DEV_MODE=true in .env to mock).
4. Run `make migrate` to apply DB migrations and seed demo data (zones, hotels, police units, digital_id).
5. Run `make start` to launch all FastAPI services locally via uvicorn.
6. Navigate to Next.js UI (not included) and connect to Dashboard at http://localhost:8006.

## Supabase (Optional)
Set `USE_SUPABASE=true` in .env, but Supabase requires its own setup:
- Clone https://github.com/supabase/supabase and run `docker compose up` in their docker/ dir.
- Update SUPABASE_URL and SUPABASE_KEY in .env.
- Services will check this env to use Supabase if enabled (implement conditional logic in code).

## HF Models for ML Service
ML Service may require Hugging Face models. Manually download via: pip install huggingface-hub
huggingface-cli download <model-name> --local-dir models/</model-name>

Avoid auto-downloads in compose to keep resources low.

## Testing
Run `make test` for unit tests (assumes pytest in each service).

## Notes
- Keycloak: Access at http://localhost:8080, login with admin creds, create realm/client manually if needed.
- MinIO: Console at http://localhost:9001, evidence bucket auto-created.
- Stop with `make down`.
- For containerized FastAPIs: Extend docker-compose.yml if preferred, but this uses local uvicorn for dev speed.