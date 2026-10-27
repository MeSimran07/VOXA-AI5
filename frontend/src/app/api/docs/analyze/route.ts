import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fileName = body.fileName?.toLowerCase();
    const fileData = body.fileData;

    if (!fileName || !fileData) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(fileData, 'base64');
    let extractedText = "";

    if (fileName.endsWith(".pdf")) {
      try {
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text || "";
      } catch (e) {
        console.warn("pdf-parse failed, attempting pdf2json fallback:", e);
        const PDFParser = require("pdf2json");
        extractedText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
          pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            let raw = pdfParser.getRawTextContent() || "";
            // If getRawTextContent only produced page breaks, parse from Pages JSON structure
            const cleanedRaw = raw.replace(/--+Page \(\d+\) Break--+/g, "").trim();
            if (!cleanedRaw && pdfData?.Pages) {
              try {
                raw = pdfData.Pages.map((page: any) => 
                  (page.Texts || []).map((t: any) => 
                    (t.R || []).map((r: any) => {
                      try { return decodeURIComponent(r.T); } catch { return r.T || ""; }
                    }).join("")
                  ).join(" ")
                ).join("\n");
              } catch (err) {
                console.warn("Failed extracting from pdfData.Pages:", err);
              }
            }
            resolve(raw);
          });
          pdfParser.parseBuffer(buffer);
        });
      }
    } else if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ success: false, error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." }, { status: 400 });
    }

    // Strip out page break artifacts
    extractedText = extractedText.replace(/--+Page \(\d+\) Break--+/g, " ");

    // Clean up excessive whitespace
    extractedText = extractedText.replace(/\s+/g, ' ').trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: "Could not extract readable text from this document. It appears to be an image-only or scanned document without selectable text." 
      }, { status: 400 });
    }

    // If text is too long (e.g. > 8,000 chars), truncate to fit comfortably in local LLM context window
    if (extractedText.length > 8000) {
      extractedText = extractedText.substring(0, 8000) + "\n... [Document truncated for context length.]";
    }

    return NextResponse.json({ success: true, text: extractedText });
  } catch (error: any) {
    console.error("Document parsing error:", error);
    return NextResponse.json({ success: false, error: "Failed to parse document: " + error.message }, { status: 500 });
  }
}
