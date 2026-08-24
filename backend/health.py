import requests


def check_app(url: str = "http://localhost:8000/health") -> bool:
    try:
        r = requests.get(url, timeout=2)
        return r.status_code == 200
    except Exception:
        return False


def check_db(connection_string: str) -> bool:
    # naive placeholder; real implementation would attempt a DB connection
    return True


def check_all() -> bool:
    ok_app = check_app()
    ok_db = True  # placeholder
    return ok_app and ok_db
