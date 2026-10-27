import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "xtia9igo";
const API_KEY = process.env.CLOUDINARY_API_KEY || "192388127484151";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "8fpZeSWoD_7hc356lxDGiv_T0HM";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, fileSize, fileData } = body;

    if (!fileData) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    let imageUrl = fileData; // Fallback to Base64 data URL

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const folder = "voxa_ai";
      
      // Signature string: folder=voxa_ai&timestamp=1234567890<SECRET>
      const strToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
      const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

      const formData = new URLSearchParams();
      formData.append("file", fileData);
      formData.append("api_key", API_KEY);
      formData.append("timestamp", timestamp);
      formData.append("folder", folder);
      formData.append("signature", signature);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        if (cloudJson.secure_url) {
          imageUrl = cloudJson.secure_url;
        }
      }
    } catch (cErr: any) {
      console.warn("Cloudinary REST upload fallback to data URL:", cErr?.message || cErr);
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName: fileName || "image.png",
      fileType: fileType || "image/png",
      fileSize: fileSize || 0,
    });
  } catch (error: any) {
    console.error("Image upload route error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Upload failed" }, { status: 500 });
  }
}
