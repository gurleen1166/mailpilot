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
  determineImportance,
} = require("../services/emailAnalysisService");

const router = express.Router();


// ============================================================
// 1. GET SAVED EMAILS
// ============================================================
// This route ONLY reads emails already stored in MongoDB.
// It does NOT contact Gmail.
// It returns the latest 10 emails.
// ============================================================

router.get("/emails/saved/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const emails = await Email.find({ userId })
      .sort({ receivedAt: -1, createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      message: "Saved emails fetched successfully",
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Saved emails fetch error:", error);

    return res.status(500).json({
      message: "Failed to fetch saved emails",
    });
  }
});


// ============================================================
// 2. SYNC GMAIL EMAILS
// ============================================================
// This route:
// Gmail → fetch latest 10
//      → analyze
//      → save/update Email
//      → create/update valid Opportunities
// ============================================================

router.get("/emails/:userId", async (req, res) => {
  try {
    const { userId } = req.params;


    // ----------------------------------------------------------
    // Find MailPilot user
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // Create Gmail client
    // ----------------------------------------------------------

    const gmail = getGmailClient(user.gmail.refreshToken);


    // ----------------------------------------------------------
    // Fetch latest 10 Gmail messages
    // ----------------------------------------------------------

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = response.data.messages || [];

    const savedEmails = [];


    // ----------------------------------------------------------
    // Process every Gmail message
    // ----------------------------------------------------------

    for (const message of messages) {

      const emailResponse = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const emailData = emailResponse.data;

      const body = getEmailBody(
        emailData.payload
      );

      const headers =
        emailData.payload?.headers || [];


      // --------------------------------------------------------
      // Helper for Gmail headers
      // --------------------------------------------------------

      const getHeader = (headerName) => {
        const header = headers.find(
          (header) =>
            header.name.toLowerCase() ===
            headerName.toLowerCase()
        );

        return header?.value || "";
      };


      // --------------------------------------------------------
      // Prepare analysis input
      // --------------------------------------------------------

      const analysisInput = {
        subject: getHeader("Subject"),
        snippet: emailData.snippet || "",
        body: body || "",
      };


      // --------------------------------------------------------
      // AI-style email analysis
      // --------------------------------------------------------

      const category =
        categorizeEmail(analysisInput);

      const summary =
        summarizeEmail(analysisInput);

      const importance =
        determineImportance(analysisInput);

      const extractedData =
        extractOpportunity({
          ...analysisInput,
          category,
        });


      // --------------------------------------------------------
      // Prepare Email document
      // --------------------------------------------------------

      const emailDetails = {
        userId: user._id,

        gmailMessageId:
          emailData.id,

        threadId:
          emailData.threadId,

        sender:
          getHeader("From") ||
          "Unknown sender",

        receiver:
          getHeader("To"),

        subject:
          analysisInput.subject,

        snippet:
          analysisInput.snippet,

        body:
          analysisInput.body,

        category,

        importance,

        summary,

        extractedData,

        isRead:
          !(emailData.labelIds || [])
            .includes("UNREAD"),

        receivedAt:
          emailData.internalDate
            ? new Date(
                Number(emailData.internalDate)
              )
            : undefined,
      };


      // --------------------------------------------------------
      // Save / update Email
      // --------------------------------------------------------

      const savedEmail =
        await Email.findOneAndUpdate(
          {
            userId: user._id,
            gmailMessageId: emailData.id,
          },
          {
            $set: emailDetails,
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );


      savedEmails.push(savedEmail);


      // --------------------------------------------------------
      // Console debugging
      // --------------------------------------------------------

      console.log(
        "--------------------------------"
      );

      console.log(
        "Email subject:",
        savedEmail.subject
      );

      console.log(
        "Email category:",
        savedEmail.category
      );

      console.log(
        "Email importance:",
        savedEmail.importance
      );

      console.log(
        "Extracted company:",
        savedEmail.extractedData?.company
      );

      console.log(
        "Extracted role:",
        savedEmail.extractedData?.role
      );


      // --------------------------------------------------------
      // Determine if this is a real opportunity
      // --------------------------------------------------------

      const isOpportunity =
        ["job", "internship"].includes(
          savedEmail.category
        ) &&
        Boolean(
          savedEmail.extractedData?.company?.trim()
        ) &&
        Boolean(
          savedEmail.extractedData?.role?.trim()
        );


      // --------------------------------------------------------
      // CREATE / UPDATE OPPORTUNITY
      // --------------------------------------------------------

      if (isOpportunity) {

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

              emailId:
                savedEmail._id,

              company:
                savedEmail.extractedData.company.trim(),

              role:
                savedEmail.extractedData.role.trim(),

              type:
                opportunityType,

              deadline:
                savedEmail.extractedData.deadline
                  ? new Date(
                      savedEmail.extractedData.deadline
                    )
                  : undefined,

              source: "email",

              description:
                savedEmail.summary ||
                savedEmail.snippet ||
                "",
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        console.log(
          "Opportunity saved for:",
          savedEmail.extractedData.company
        );

      } else {

        // ------------------------------------------------------
        // If email is no longer an opportunity,
        // remove its linked opportunity.
        // ------------------------------------------------------

        const result =
          await Opportunity.deleteOne({
            userId: user._id,
            emailId: savedEmail._id,
          });

        if (result.deletedCount > 0) {
          console.log(
            "Removed outdated opportunity:",
            savedEmail.subject
          );
        }
      }
    }


    // ==========================================================
    // CLEAN OLD OPPORTUNITIES
    // ==========================================================
    // Only opportunities belonging to the current Gmail sync
    // should remain.
    //
    // This removes opportunities linked to old emails that are
    // no longer part of the latest 10 Gmail messages.
    // ==========================================================

    const currentEmailIds =
      savedEmails.map(
        (email) => email._id
      );


    const cleanupResult =
      await Opportunity.deleteMany({
        userId: user._id,
        emailId: {
          $nin: currentEmailIds,
        },
      });


    if (cleanupResult.deletedCount > 0) {
      console.log(
        "Removed old opportunities:",
        cleanupResult.deletedCount
      );
    }


    // ==========================================================
    // RETURN RESULT
    // ==========================================================

    return res.status(200).json({
      message:
        "Emails fetched, analyzed, and saved successfully",

      count:
        savedEmails.length,

      emails:
        savedEmails,
    });

  } catch (error) {

    console.error(
      "Gmail fetch error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch and analyze Gmail emails",
    });
  }
});


module.exports = router;