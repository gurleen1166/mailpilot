
const { google } = require("googleapis");

const getGmailClient = (refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
};

// Decode Gmail's base64url-encoded email content
const decodeBody = (data) => {
  if (!data) return "";

  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
};

const decodeHtmlEntities = (text) => {
  return text
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return n >= 0 && n <= 0x10FFFF
        ? String.fromCodePoint(n)
        : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const n = parseInt(code, 16);
      return n >= 0 && n <= 0x10FFFF
        ? String.fromCodePoint(n)
        : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'");
};

// Convert HTML content into readable text

const htmlToText = (html) => {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/[\u200B-\u200F\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
    return decodeHtmlEntities(cleaned);
};


const getEmailBody = (payload) => {
  if (!payload) return "";

  let plainText = "";
  let htmlText = "";

  const extractParts = (part) => {
    if (!part) return;

    const mimeType = (part.mimeType || "").toLowerCase();

    // Skip attachments
    if (part.filename) return;

    if (mimeType === "text/plain" && part.body?.data) {
      plainText += decodeBody(part.body.data) + "\n";
      return;
    }

    if (mimeType === "text/html" && part.body?.data) {
      htmlText += decodeBody(part.body.data) + "\n";
      return;
    }

    if (Array.isArray(part.parts)) {
      part.parts.forEach(extractParts);
    }
  };

  extractParts(payload);

  // Prefer plain text; use HTML as a fallback
  const body = plainText.trim() || htmlToText(htmlText);

  return body;
};

module.exports = {
  getGmailClient,
  getEmailBody,
};
