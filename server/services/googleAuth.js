const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly"
];

const getGoogleAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    include_granted_scopes: true
  });
};

const getGoogleTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);

  // Store the credentials in this OAuth client
  oauth2Client.setCredentials(tokens);

  return tokens;
};

const getGoogleProfile = async () => {
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  return data;
};

module.exports = {
  oauth2Client,
  getGoogleAuthUrl,
  getGoogleTokens,
  getGoogleProfile,
};