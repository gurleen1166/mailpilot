
const express = require("express");
const Email = require("../models/Email");
const User = require("../models/User");
const Opportunity = require("../models/Opportunity");

const {
  getGmailClient,
  getEmailBody,
} = require("../services/gmailService");

const {
  categorizeEmail,
  summarizeEmail,
  extractOpportunity,
} = require("../services/emailAnalysisService");

const router = express.Router();

router.get("/emails/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find the MailPilot user
    const user = await User.findById(userId).select(
      "+gmail.refreshToken"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.gmail?.refreshToken) {
      return res.status(400).json({
        message: "Gmail is not connected",
      });
    }

    // 2. Create Gmail API client
    const gmail = getGmailClient(user.gmail.refreshToken);

    // 3. Fetch the latest 10 emails
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    const savedEmails = [];

    // 4. Fetch and analyze each email
    for (const message of messages) {
      const emailResponse = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const emailData = emailResponse.data;
      const body = getEmailBody(emailData.payload);
      const headers = emailData.payload?.headers || [];

      const getHeader = (headerName) => {
        const header = headers.find(
          (header) =>
            header.name.toLowerCase() === headerName.toLowerCase()
        );

        return header?.value || "";
      };

      // 5. Prepare the email content for analysis
      const analysisInput = {
        subject: getHeader("Subject"),
        snippet: emailData.snippet || "",
        body: body || "",
      };

      // 6. Categorize, summarize, and extract opportunity details
      const category = categorizeEmail(analysisInput);
      const summary = summarizeEmail(analysisInput);

      const extractedData = extractOpportunity({
        ...analysisInput,
        category,
      });

      // 7. Prepare the email document
      const emailDetails = {
        userId: user._id,
        gmailMessageId: emailData.id,
        threadId: emailData.threadId,
        sender: getHeader("From") || "Unknown sender",
        receiver: getHeader("To"),
        subject: analysisInput.subject,
        snippet: analysisInput.snippet,
        body: analysisInput.body,
        category,
        summary,
        extractedData,
        isRead: !(emailData.labelIds || []).includes("UNREAD"),
        receivedAt: emailData.internalDate
          ? new Date(Number(emailData.internalDate))
          : undefined,
      };

      // 8. Save new emails or update existing ones
      const savedEmail = await Email.findOneAndUpdate(
        {
          userId: user._id,
          gmailMessageId: emailData.id,
        },
        { $set: emailDetails },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      savedEmails.push(savedEmail);
      console.log("Email category:", savedEmail.category);
      console.log("Extracted company:", savedEmail.extractedData?.company);

      // Save job and internship opportunities
      
if (
  ["job", "internship"].includes(savedEmail.category) &&
  savedEmail.extractedData?.company
) {
  console.log("Saving opportunity for:", savedEmail.extractedData.company);

        const opportunityType =
          savedEmail.category === "internship"
            ? "internship"
            : "full-time";

        await Opportunity.findOneAndUpdate(
          {
            userId: user._id,
            emailId: savedEmail._id,
          },
          {
            $set: {
              userId: user._id,
              emailId: savedEmail._id,
              company: savedEmail.extractedData.company,
              role:
  savedEmail.extractedData.role ||
  (savedEmail.category === "internship"
    ? "Internship opportunity"
    : "Job opportunity"),
              type: opportunityType,
              deadline: savedEmail.extractedData.deadline
                ? new Date(savedEmail.extractedData.deadline)
                : undefined,
              source: "email",
              description: savedEmail.summary || savedEmail.snippet || "",
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );
      }

    }

    // 9. Return the saved emails
    return res.json({
      message: "Emails fetched, analyzed, and saved successfully",
      count: savedEmails.length,
      emails: savedEmails,
    });
  } catch (error) {
    console.error("Gmail fetch error:", error);

    return res.status(500).json({
      message: "Failed to fetch and analyze Gmail emails",
    });
  }
});

module.exports = router;
