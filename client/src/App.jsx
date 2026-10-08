import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("Overview");

  const [emails, setEmails] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");

  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Temporary user ID for local development.
  // Later this will come from authenticated Google login.
  const USER_ID = "69f0b7ebe6fb8ba1b41aefde";

  // ==========================================================
  // FETCH DASHBOARD DATA
  // ==========================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [emailResponse, opportunityResponse] =
          await Promise.all([
            fetch(
              `http://localhost:5001/api/gmail/emails/saved/${USER_ID}`
            ),
            fetch(
              `http://localhost:5001/api/opportunities/${USER_ID}`
            ),
          ]);

        if (!emailResponse.ok || !opportunityResponse.ok) {
          throw new Error(
            "Could not load dashboard data."
          );
        }

        const emailData = await emailResponse.json();
        const opportunityData =
          await opportunityResponse.json();

        setEmails(emailData.emails || []);
        setOpportunities(
          opportunityData.opportunities || []
        );
      } catch (err) {
        console.error(
          "Dashboard fetch error:",
          err
        );

        setError(
          "Unable to load dashboard data. Please check your backend."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ==========================================================
  // SIDEBAR MENU
  // ==========================================================

  const menuItems = [
    {
      name: "Overview",
      icon: "◫",
    },
    {
      name: "All Emails",
      icon: "✉",
    },
    {
      name: "Opportunities",
      icon: "✧",
    },
    {
      name: "AI Assistant",
      icon: "✳",
    },
    {
      name: "Reminders",
      icon: "◷",
    },
  ];

  // ==========================================================
  // HELPER FUNCTIONS
  // ==========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInitial = (sender) => {
    if (!sender) {
      return "?";
    }

    return sender.trim().charAt(0).toUpperCase();
  };

  // ==========================================================
  // OVERVIEW PAGE
  // ==========================================================

  const renderOverviewPage = () => {
    return (
      <>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              YOUR PERSONAL EMAIL COPILOT
            </p>

            <h1>Overview</h1>
          </div>

          <button className="connect-button">
            <span>●</span>
            Connect Gmail
          </button>
        </header>

        {/* Welcome Card */}
        <section className="welcome-card">
          <div>
            <span className="welcome-tag">
              ✦ YOUR DAY, SIMPLIFIED
            </span>

            <h2>
              Less inbox chaos.
              <br />
              More opportunities.
            </h2>

            <p>
              Your AI-powered workspace for important
              emails, career opportunities, and everyday
              productivity.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setActiveTab("All Emails")
              }
            >
              Explore my inbox
              <span>→</span>
            </button>
          </div>

          <div
            className="welcome-art"
            aria-hidden="true"
          >
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>

            <div className="mail-art">
              ✉
            </div>

            <div className="sparkle sparkle-one">
              ✦
            </div>

            <div className="sparkle sparkle-two">
              ✧
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total Emails</span>

              <span className="stat-icon purple">
                ✉
              </span>
            </div>

            <h3>
              {loading ? "…" : emails.length}
            </h3>

            <p>
              Emails loaded from your inbox
            </p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Opportunities</span>

              <span className="stat-icon green">
                ✧
              </span>
            </div>

            <h3>
              {loading
                ? "…"
                : opportunities.length}
            </h3>

            <p>
              Jobs and internships found
            </p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>High Priority</span>

              <span className="stat-icon orange">
                ↗
              </span>
            </div>

            <h3>
              {loading
                ? "…"
                : emails.filter(
                    (email) =>
                      email.importance === "high"
                  ).length}
            </h3>

            <p>
              Important emails to review
            </p>
          </article>
        </section>

        {/* Recent Content */}
        <section className="content-grid">
          {/* Recent Emails */}
          <article className="panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Emails</h2>

                <p>
                  Your latest inbox activity
                </p>
              </div>

              <button
                onClick={() =>
                  setActiveTab("All Emails")
                }
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <p>
                  Loading your emails...
                </p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <p>{error}</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  ✉
                </div>

                <h3>
                  No emails found
                </h3>

                <p>
                  Connect Gmail and load your
                  inbox to see your emails here.
                </p>
              </div>
            ) : (
              <div className="email-list">
                {emails
                  .slice(0, 5)
                  .map((email) => (
                    <div
                      className="email-item"
                      key={
                        email._id ||
                        email.gmailMessageId
                      }
                    >
                      <div className="email-item-top">
                        <strong>
                          {email.sender ||
                            "Unknown sender"}
                        </strong>

                        <span
                          className={`priority-badge ${
                            email.importance ||
                            "low"
                          }`}
                        >
                          {email.importance ||
                            "low"}
                        </span>
                      </div>

                      <h3>
                        {email.subject ||
                          "(No subject)"}
                      </h3>

                      <p>
                        {email.summary ||
                          email.snippet ||
                          "No preview available."}
                      </p>

                      <span className="email-category">
                        {email.category ||
                          "general"}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </article>

          {/* Career Opportunities */}
          <article className="panel opportunities-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  Career Opportunities
                </h2>

                <p>
                  Jobs and internships from
                  your emails
                </p>
              </div>

              <span className="live-badge">
                AI READY
              </span>
            </div>

            {loading ? (
              <div className="opportunity-placeholder">
                <p>
                  Loading opportunities...
                </p>
              </div>
            ) : error ? (
              <div className="opportunity-placeholder">
                <p>
                  Unable to load
                  opportunities.
                </p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="opportunity-placeholder">
                <div className="opportunity-icon">
                  ✧
                </div>

                <div>
                  <h3>
                    No opportunities yet
                  </h3>

                  <p>
                    Jobs and internships found
                    in your emails will appear
                    here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="opportunity-list">
                {opportunities
                  .slice(0, 5)
                  .map((opportunity) => (
                    <div
                      className="opportunity-placeholder"
                      key={opportunity._id}
                    >
                      <div className="opportunity-icon">
                        ✧
                      </div>

                      <div>
                        <h3>
                          {opportunity.role ||
                            "Job opportunity"}
                        </h3>

                        <p>
                          {opportunity.company ||
                            "Company not specified"}
                        </p>

                        <span className="email-category">
                          {opportunity.type ||
                            "other"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <button
              className="opportunities-link"
              onClick={() =>
                setActiveTab(
                  "Opportunities"
                )
              }
            >
              Explore opportunities
              <span>→</span>
            </button>
          </article>
        </section>

        <footer className="footer">
          <span>
            MailPilot © 2026
          </span>

          <span>
            Built to make every email count. ✦
          </span>
        </footer>
      </>
    );
  };

  // ==========================================================
  // ALL EMAILS PAGE
  // ==========================================================

  const renderAllEmailsPage = () => {
    return (
      <>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              SMART INBOX
            </p>

            <h1>All Emails</h1>
          </div>

          <button className="connect-button">
            <span>●</span>
            Connect Gmail
          </button>
        </header>

        {/* Inbox Header */}
        <section className="page-intro">
          <div>
            <h2>Your Inbox</h2>

            <p>
              Review your emails, priorities,
              categories, and AI summaries.
            </p>
          </div>

          <div className="email-count">
            <strong>
              {emails.length}
            </strong>

            <span>
              emails loaded
            </span>
          </div>
        </section>

        {/* Email List */}
        {loading ? (
          <div className="empty-state">
            <p>
              Loading your emails...
            </p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p>{error}</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ✉
            </div>

            <h3>
              No emails found
            </h3>

            <p>
              Connect Gmail to load your
              inbox.
            </p>
          </div>
        ) : (
          <div className="all-email-list">
            {emails.map((email) => (
              <article
                className="full-email-card"
                key={
                  email._id ||
                  email.gmailMessageId
                }
              >
                {/* Email Header */}
                <div className="full-email-top">
                  <div className="sender-section">
                    <div className="email-avatar">
                      {getInitial(
                        email.sender
                      )}
                    </div>

                    <div>
                      <strong>
                        {email.sender ||
                          "Unknown sender"}
                      </strong>

                      <p>
                        {email.receiver ||
                          "No receiver"}
                      </p>
                    </div>
                  </div>

                  <div className="email-badges">
                    <span
                      className={`priority-badge ${
                        email.importance ||
                        "low"
                      }`}
                    >
                      {email.importance ||
                        "low"}
                    </span>

                    <span className="email-category">
                      {email.category ||
                        "general"}
                    </span>
                  </div>
                </div>

                {/* Subject */}
                <h2 className="full-email-subject">
                  {email.subject ||
                    "(No subject)"}
                </h2>

                {/* Summary */}
                <p className="full-email-summary">
                  {email.summary ||
                    email.snippet ||
                    "No preview available."}
                </p>

                {/* Bottom Details */}
                <div className="full-email-bottom">
                  <div>
                    <span className="email-detail-label">
                      STATUS
                    </span>

                    <span
                      className={
                        email.isRead
                          ? "read-status"
                          : "unread-status"
                      }
                    >
                      {email.isRead
                        ? "Read"
                        : "Unread"}
                    </span>
                  </div>

                  <div>
                    <span className="email-detail-label">
                      RECEIVED
                    </span>

                    <span>
                      {formatDate(
                        email.receivedAt
                      )}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="footer">
          <span>
            MailPilot © 2026
          </span>

          <span>
            Built to make every email count. ✦
          </span>
        </footer>
      </>
    );
  };

  // ==========================================================
  // OPPORTUNITIES PAGE
  // ==========================================================

  const renderOpportunitiesPage = () => {
    return (
      <>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              CAREER OPPORTUNITIES
            </p>

            <h1>Opportunities</h1>
          </div>

          <button className="connect-button">
            <span>●</span>
            Connect Gmail
          </button>
        </header>

        {/* Opportunities Header */}
        <section className="page-intro">
          <div>
            <h2>
              Your Career Opportunities
            </h2>

            <p>
              Jobs and internships discovered
              from your emails.
            </p>
          </div>

          <div className="email-count">
            <strong>
              {opportunities.length}
            </strong>

            <span>
              opportunities found
            </span>
          </div>
        </section>

        {/* Loading */}
        {loading ? (
          <div className="opportunity-page-empty">
            <div className="opportunity-icon">
              ✧
            </div>

            <h3>
              Loading opportunities...
            </h3>

            <p>
              We're analyzing your inbox
              for career opportunities.
            </p>
          </div>
        ) : error ? (
          /* Error */
          <div className="opportunity-page-empty">
            <div className="opportunity-icon">
              !
            </div>

            <h3>
              Unable to load
              opportunities
            </h3>

            <p>{error}</p>
          </div>
        ) : opportunities.length === 0 ? (
          /* Empty */
          <div className="opportunity-page-empty">
            <div className="opportunity-icon">
              ✧
            </div>

            <h3>
              No opportunities found
            </h3>

            <p>
              When MailPilot detects a
              genuine job or internship
              opportunity, it will appear
              here.
            </p>
          </div>
        ) : (
          /* Opportunity Cards */
          <div className="opportunities-page-list">
            {opportunities.map(
              (opportunity) => (
                <article
                  className="full-opportunity-card"
                  key={opportunity._id}
                >
                  {/* Card Top */}
                  <div className="opportunity-card-top">
                    <div className="opportunity-title-section">
                      <div className="opportunity-large-icon">
                        ✧
                      </div>

                      <div>
                        <h2>
                          {opportunity.role ||
                            "Job opportunity"}
                        </h2>

                        <p>
                          {opportunity.company ||
                            "Company not specified"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`opportunity-status ${
                        opportunity.status ||
                        "new"
                      }`}
                    >
                      {opportunity.status ||
                        "new"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="opportunity-details">
                    <span className="opportunity-type">
                      {opportunity.type ||
                        "other"}
                    </span>

                    {opportunity.location && (
                      <span>
                        📍{" "}
                        {opportunity.location}
                      </span>
                    )}

                    {opportunity.deadline && (
                      <span>
                        Deadline:{" "}
                        {formatDate(
                          opportunity.deadline
                        )}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {opportunity.description && (
                    <p className="opportunity-description">
                      {
                        opportunity.description
                      }
                    </p>
                  )}

                  {/* Footer */}
                  <div className="opportunity-card-footer">
                    <span>
                      Source:{" "}
                      {opportunity.source ||
                        "email"}
                    </span>

                    <button className="opportunity-view-button">
                      View opportunity →
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}

        <footer className="footer">
          <span>
            MailPilot © 2026
          </span>

          <span>
            Built to make every email count. ✦
          </span>
        </footer>
      </>
    );
  };
// ==========================================================
// AI ASSISTANT PAGE
// ==========================================================
const askAI = async () => {
  if (!aiPrompt.trim()) return;

  setAiLoading(true);
  setAiResponse("");

  try {
    const response = await fetch("http://localhost:5001/api/ai/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: aiPrompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get AI response");
    }

    setAiResponse(data.response);
  } catch (error) {
    console.error("AI request error:", error);
    setAiResponse("Sorry, I couldn't process your request right now.");
  } finally {
    setAiLoading(false);
  }
};

const generateReply = async () => {
  if (!selectedEmail) return;

  setReplyLoading(true);
  setReplyText("");

  try {
    const emailContent = `
From: ${selectedEmail.sender || "Unknown sender"}
Subject: ${selectedEmail.subject || "(No subject)"}

Email:
${selectedEmail.body || selectedEmail.snippet || selectedEmail.summary || ""}
`;

    const response = await fetch("http://localhost:5001/api/ai/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Generate a professional email reply to the following email.

${emailContent}

Write only the reply that the recipient could send. Do not include explanations, subject lines, or quotation marks.`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate reply");
    }

    setReplyText(data.response);
  } catch (error) {
    console.error("Reply generation error:", error);
    setReplyText("Sorry, I couldn't generate a reply right now.");
  } finally {
    setReplyLoading(false);
  }
};
const renderAIAssistantPage = () => {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">YOUR AI COPILOT</p>
          <h1>AI Assistant</h1>
        </div>

        <button className="connect-button" type="button">
          <span>●</span>
          Connect Gmail
        </button>
      </header>

      <section className="ai-assistant-page">

        <div className="ai-hero-card">
          <div className="ai-hero-icon">✦</div>

          <div>
            <span className="welcome-tag">
              ✦ MAILPILOT AI
            </span>

            <h2>
              Your inbox,
              <br />
              with an AI copilot.
            </h2>

            <p>
              Ask questions about your emails, find what needs
              your attention, or generate a reply.
            </p>
          </div>
        </div>

        <div className="ai-chat-card">
          <div className="ai-section-header">
            <div>
              <h2>Ask MailPilot</h2>

              <p>
                Get help understanding and responding to your emails.
              </p>
            </div>

            <span className="live-badge">
              AI READY
            </span>
          </div>

          <div className="ai-input-wrapper">
            <textarea
              value={aiPrompt}
              onChange={(event) => {
                setAiPrompt(event.target.value);
              }}
              placeholder="Ask something like: Which emails need my attention?"
              rows={4}
            />

            <button
  className="primary-button"
  type="button"
  onClick={askAI}
  disabled={aiLoading || !aiPrompt.trim()}
>
  {aiLoading ? "Thinking..." : "Ask AI"} <span>→</span>
</button>
          </div>

          <div className="ai-suggestions">
            <button
              type="button"
              onClick={() =>
                setAiPrompt(
                  "Which emails need my attention?"
                )
              }
            >
              📌 Important emails
            </button>

            <button
              type="button"
              onClick={() =>
                setAiPrompt(
                  "Which emails need a reply?"
                )
              }
            >
              ✉ Emails needing replies
            </button>

            <button
              type="button"
              onClick={() =>
                setAiPrompt(
                  "Summarize my inbox."
                )
              }
            >
              📝 Summarize inbox
            </button>

            <button
              type="button"
              onClick={() =>
                setAiPrompt(
                  "Find career opportunities in my emails."
                )
              }
            >
              🎯 Find opportunities
            </button>
          </div>
          {aiResponse && (
  <div className="ai-response-box">
    <div className="ai-response-header">
      <span>✦</span>
      <strong>MailPilot AI</strong>
    </div>

    <p>{aiResponse}</p>
  </div>
)}
        </div>

        <div className="ai-reply-card">
          <div className="ai-section-header">
            <div>
              <h2>AI Reply Generator</h2>

              <p>
                Select an email and MailPilot will help you
                decide what to reply.
              </p>
            </div>

            <span className="ai-reply-badge">
              ✦ SMART REPLY
            </span>
          </div>

          <div className="reply-email-list">
            {emails.length === 0 ? (
              <div className="empty-state">
                <p>
                  No emails available.
                </p>
              </div>
            ) : (
              emails.slice(0, 5).map((email) => (
                <button
                  className={`reply-email-item ${
                    selectedEmail?._id === email._id
                      ? "selected"
                      : ""
                  }`}
                  key={
                    email._id ||
                    email.gmailMessageId
                  }
                  type="button"
                  onClick={() =>
                    setSelectedEmail(email)
                  }
                >
                  <div className="reply-email-avatar">
                    {getInitial(email.sender)}
                  </div>

                  <div className="reply-email-content">
                    <strong>
                      {email.sender || "Unknown sender"}
                    </strong>

                    <span>
                      {email.subject || "(No subject)"}
                    </span>
                  </div>

                  <span className="reply-arrow">
                    →
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedEmail && (
            <div className="selected-email-panel">

              <div className="selected-email-header">
                <div>
                  <span className="email-detail-label">
                    SELECTED EMAIL
                  </span>

                  <h3>
                    {selectedEmail.subject ||
                      "(No subject)"}
                  </h3>

                  <p>
                    From:{" "}
                    {selectedEmail.sender ||
                      "Unknown sender"}
                  </p>
                </div>

                <span
                  className={`priority-badge ${
                    selectedEmail.importance || "low"
                  }`}
                >
                  {selectedEmail.importance || "low"}
                </span>
              </div>

              <div className="selected-email-body">
                {selectedEmail.body ||
                  selectedEmail.snippet ||
                  selectedEmail.summary ||
                  "No email content available."}
              </div>

              <div className="ai-reply-action">
                <div>
                  <h3>
                    ✦ What should I reply?
                  </h3>

                  <p>
                    MailPilot will analyze this email
                    and generate a context-aware response.
                  </p>
                </div>

                <button
  className="primary-button"
  type="button"
  onClick={generateReply}
  disabled={replyLoading}
>
  {replyLoading ? "Generating..." : "Generate Reply"} <span>→</span>
</button>
              </div>
              {replyText && (
  <div className="generated-reply-box">
    <div className="generated-reply-header">
      <span>✦</span>
      <strong>Suggested Reply</strong>
    </div>

    <div className="generated-reply-content">
      {replyText}
    </div>
  </div>
)}

            </div>
          )}
        </div>

      </section>

      <footer className="footer">
        <span>MailPilot © 2026</span>

        <span>
          Built to make every email count. ✦
        </span>
      </footer>
    </>
  );
};
  // ==========================================================
  // PLACEHOLDER PAGES
  // ==========================================================

  const renderPlaceholderPage = (
    title,
    eyebrow,
    description
  ) => {
    return (
      <>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {eyebrow}
            </p>

            <h1>{title}</h1>
          </div>

          <button className="connect-button">
            <span>●</span>
            Connect Gmail
          </button>
        </header>

        <div className="opportunity-page-empty">
          <div className="opportunity-icon">
            ✦
          </div>

          <h3>{title} is coming next</h3>

          <p>{description}</p>
        </div>

        <footer className="footer">
          <span>
            MailPilot © 2026
          </span>

          <span>
            Built to make every email count. ✦
          </span>
        </footer>
      </>
    );
  };

  // ==========================================================
  // PAGE ROUTER
  // ==========================================================

  const renderCurrentPage = () => {
    if (activeTab === "Overview") {
      return renderOverviewPage();
    }

    if (activeTab === "All Emails") {
      return renderAllEmailsPage();
    }

    if (activeTab === "Opportunities") {
      return renderOpportunitiesPage();
    }

    if (activeTab === "AI Assistant") {
  return renderAIAssistantPage();
}

    if (activeTab === "Reminders") {
      return renderPlaceholderPage(
        "Reminders",
        "SMART REMINDERS",
        "Important follow-ups and deadlines will appear here."
      );
    }

    return renderOverviewPage();
  };

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="mailpilot">
      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            M
          </div>

          <span>
            MailPilot
          </span>
        </div>

        <p className="sidebar-label">
          WORKSPACE
        </p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activeTab === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab(item.name)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              {item.name}
            </button>
          ))}
        </nav>

        {/* Workspace User */}
        <div className="sidebar-bottom">
          <div className="avatar">
            G
          </div>

          <div>
            <strong>
              My Workspace
            </strong>

            <p>
              Personal account
            </p>
          </div>
        </div>
      </aside>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="main-content">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;