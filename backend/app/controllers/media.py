from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader
from app.core.config import get_settings
from app.core.security import oauth2_scheme
from pydantic import BaseModel

settings = get_settings()

# Initialize Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

router = APIRouter(prefix="/api/media", tags=["Media"])

class MediaResponse(BaseModel):
    url: str

@router.post("/upload", response_model=MediaResponse)
async def upload_file(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder="voxa_ai",
            resource_type="auto" # Auto detects image/video
        )
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload media: {str(e)}")
