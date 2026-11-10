import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message, inquiryType } = body;

    // Log the contact/upgrade inquiry
    console.log("=== VOXA AI CONTACT / UPGRADE INQUIRY ===");
    console.log(`Type: ${inquiryType || "General"}`);
    console.log(`Name: ${name || "Anonymous"}`);
    console.log(`Email: ${email || "Not provided"}`);
    console.log(`Phone: ${phone || "Not provided"}`);
    console.log(`Message: ${message || "N/A"}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("==========================================");

    return NextResponse.json({
      success: true,
      message: "Inquiry received successfully. Our team will contact you shortly.",
      contactDetails: {
        email: "s6899878@gmail.com",
        phone: "6280642187",
        whatsappUrl: "https://wa.me/916280642187",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
