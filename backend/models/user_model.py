from pydantic import BaseModel


class UserCredentials(BaseModel):
	name: str | None = None
	email: str
	password: str


class UserPublic(BaseModel):
	name: str
	email: str
