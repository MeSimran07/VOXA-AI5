from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class StandardTokenResponse(BaseModel):
    success: bool = True
    data: Token
