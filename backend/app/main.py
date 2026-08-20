"""Application entry point. Wires the API router and serves the built frontend."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import get_settings


def create_app() -> FastAPI:
    application = FastAPI(title="basic-db-viewer", docs_url="/api/docs", openapi_url="/api/openapi.json")
    application.include_router(router)

    static_dir = Path(get_settings().static_dir)
    if static_dir.is_dir():
        application.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

    return application


app = create_app()
