import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from models.user_model import UserCredentials, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])

_users_file = Path(__file__).resolve().parents[1] / "storage" / "users.json"


def _load_users() -> list[dict[str, str]]:
	if not _users_file.exists():
		return []

	try:
		users = json.loads(_users_file.read_text(encoding="utf-8"))
		return users if isinstance(users, list) else []
	except (json.JSONDecodeError, OSError):
		return []


def _save_users(users: list[dict[str, str]]) -> None:
	_users_file.parent.mkdir(parents=True, exist_ok=True)
	_users_file.write_text(json.dumps(users, indent=2), encoding="utf-8")


def _public_user(user: dict[str, str]) -> UserPublic:
		return UserPublic(name=user["name"], email=user["email"])


@router.post("/register", response_model=UserPublic)
def register(credentials: UserCredentials):
		name = (credentials.name or "").strip()
		email = credentials.email.strip().lower()
		password = credentials.password
		users_db = _load_users()

		if not name:
			raise HTTPException(status_code=400, detail="Name is required")
		if not email:
			raise HTTPException(status_code=400, detail="Email is required")
		if not password:
			raise HTTPException(status_code=400, detail="Password is required")
		if any(user["email"] == email for user in users_db):
			raise HTTPException(status_code=400, detail="An account with this email already exists")

		user = {"name": name, "email": email, "password": password}
		users_db.append(user)
		_save_users(users_db)
		return _public_user(user)


@router.post("/login", response_model=UserPublic)
def login(credentials: UserCredentials):
		email = credentials.email.strip().lower()
		password = credentials.password
		users_db = _load_users()

		user = next((item for item in users_db if item["email"] == email and item["password"] == password), None)
		if user is None:
			raise HTTPException(status_code=401, detail="Invalid email or password")

		return _public_user(user)
