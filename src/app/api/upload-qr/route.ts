// app/api/upload-qr/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { image, publicId } = await req.json(); // image = dataURL

    const result = await cloudinary.uploader.upload(image, {
      folder: "event-qr",
      public_id: publicId,
      overwrite: true,
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (err) {
    // console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to upload QR" },
      { status: 500 }
    );
  }
}
