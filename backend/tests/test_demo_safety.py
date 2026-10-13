import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.database import init_db
import backend.app.config as config

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_demo_safety_allows_when_disabled():
    """When DEMO_MODE is False (default local dev), reset and seed work freely."""
    config.DEMO_MODE = False
    config.ADMIN_API_KEY = ""

    resp_seed = client.post("/api/settings/seed-data")
    assert resp_seed.status_code == 200

    resp_reset = client.post("/api/settings/reset-data")
    assert resp_reset.status_code == 200

def test_demo_safety_blocks_when_enabled():
    """When DEMO_MODE is True (production demo), unauthenticated visitors are blocked with 403."""
    config.DEMO_MODE = True
    config.ADMIN_API_KEY = "test-secret-key-123"

    try:
        # 1. Unauthenticated reset request
        resp_reset = client.post("/api/settings/reset-data")
        assert resp_reset.status_code == 403
        assert "disabled in public demo mode" in resp_reset.json()["detail"]

        # 2. Unauthenticated seed request
        resp_seed = client.post("/api/settings/seed-data")
        assert resp_seed.status_code == 403
        assert "disabled in public demo mode" in resp_seed.json()["detail"]

        # 3. Request with wrong admin key
        resp_bad_key = client.post(
            "/api/settings/reset-data",
            headers={"X-Admin-Key": "wrong-key"}
        )
        assert resp_bad_key.status_code == 403

        # 4. Request with valid admin key succeeds
        resp_auth = client.post(
            "/api/settings/seed-data",
            headers={"X-Admin-Key": "test-secret-key-123"}
        )
        assert resp_auth.status_code == 200
    finally:
        # Revert config to default for other tests
        config.DEMO_MODE = False
        config.ADMIN_API_KEY = ""
