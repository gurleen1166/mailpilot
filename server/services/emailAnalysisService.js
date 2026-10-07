// ============================================================
// MailPilot - Email Analysis Service
// ============================================================


// ============================================================
// 1. CATEGORIZE EMAIL
// ============================================================

const categorizeEmail = (email) => {
  const text = `${email.subject || ""} ${email.snippet || ""} ${
    email.body || ""
  }`.toLowerCase();

  // Completed internships are NOT opportunities
  if (
    /\b(completed my internship|completion of my internship|successful completion of my internship|finished my internship|completed internship)\b/i.test(
      text
    )
  ) {
    return "general";
  }

  // Internship
  if (
    /\b(internship|intern\b|interns|internship opening|internship opportunity|internship program|internship position|summer internship|hiring interns|interns wanted)\b/i.test(
      text
    )
  ) {
    return "internship";
  }

  // Job
  if (
    /\b(job opening|job opportunity|hiring|recruitment|vacancy|careers|job alert|position available|we are hiring|hiring for)\b/i.test(
      text
    )
  ) {
    return "job";
  }

  // Academic
  if (
    /\b(assignment|lecture|exam schedule|university|semester|academic|class|course|professor|faculty)\b/i.test(
      text
    )
  ) {
    return "academic";
  }

  // Promotion
  if (
    /\b(unsubscribe|special offer|discount|sale|promotion|coupon|offer|deal|cashback)\b/i.test(
      text
    )
  ) {
    return "promotion";
  }

  // Spam
  if (
    /\b(spam|lottery winner|claim your prize|you have won|congratulations you won|free money)\b/i.test(
      text
    )
  ) {
    return "spam";
  }

  // Personal
  if (
    /\b(personal|family|birthday|weekend plans|dinner plans|vacation plans)\b/i.test(
      text
    )
  ) {
    return "personal";
  }

  return "general";
};


// ============================================================
// 2. SUMMARIZE EMAIL
// ============================================================

const summarizeEmail = (email) => {
  const text = (email.body || email.snippet || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "No email content available to summarize.";
  }

  const sentences =
    text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

  return sentences
    .slice(0, 2)
    .join(" ")
    .trim()
    .slice(0, 400);
};


// ============================================================
// 3. EXTRACT JOB / INTERNSHIP OPPORTUNITY
// ============================================================

const extractOpportunity = (email) => {
  const subject = email.subject || "";
  const body = email.body || email.snippet || "";
  const sender = email.sender || "";
  const category = (email.category || "").toLowerCase();

  const text = `${subject}\n${body}`;
  const normalizedText = text.replace(/\s+/g, " ").trim();

  const emptyResult = {
    company: "",
    role: "",
    deadline: "",
    interviewDate: "",
  };

  // ==========================================================
  // 1. IGNORE CLEARLY NON-OPPORTUNITY EMAILS
  // ==========================================================

  const nonOpportunitySignals =
    /\b(recommended opportunities|curated just for you|opportunities curated|top opportunities|recommended for you|people you may know|see more people you might know|mutual connections|connect with|get unstoppable|newsletter|unsubscribe|contest is live|contest|rewards|discount|special offer|cashback|sale|promotional|completed my internship|completion of my internship|successful completion of my internship|finished my internship|congratulations on your internship)\b/i;

  if (nonOpportunitySignals.test(normalizedText)) {
    return emptyResult;
  }

  // ==========================================================
  // 2. DETERMINE WHETHER THIS IS REALLY A JOB/INTERNSHIP
  // ==========================================================

  const strongJobSignals =
    /\b(job opening|job opportunity|job description|hiring for|we are hiring|vacancy|position available|open position|immediate opening|full[- ]time role|part[- ]time role|job application|apply now|apply here|apply for this role|apply for the position|submit your application|job position)\b/i;

  const strongInternshipSignals =
    /\b(internship opening|internship opportunity|internship program|internship position|summer internship|hiring interns|interns wanted|apply for.*internship|apply.*internship|internship role|internship at)\b/i;

  const hasStrongJobSignal = strongJobSignals.test(normalizedText);
  const hasStrongInternshipSignal =
    strongInternshipSignals.test(normalizedText);

  const isInternship =
    category === "internship" && hasStrongInternshipSignal;

  const isJob =
    category === "job" && hasStrongJobSignal;

  if (!isInternship && !isJob) {
    return emptyResult;
  }

  // ==========================================================
  // 3. COMPANY EXTRACTION
  // ==========================================================

  let company = "";

  // Explicit company label
  const labeledCompanyMatch = normalizedText.match(
    /\b(?:company|employer|organization)\s*[:\-]\s*([A-Za-z0-9&.'-]+(?:\s+[A-Za-z0-9&.'-]+){0,5})/i
  );

  if (labeledCompanyMatch) {
    company = labeledCompanyMatch[1]
      .trim()
      .replace(/[.,;:!?]+$/, "");
  }

  // Example: "Internship at Microsoft"
  if (!company) {
    const atCompanyMatch = normalizedText.match(
      /\b(?:at|with)\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\b/
    );

    if (atCompanyMatch) {
      company = atCompanyMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // Example: "Jia from Unstop <noreply@unstop.news>"
  if (!company && sender) {
    const senderFromMatch = sender.match(
      /\bfrom\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,2})\b/i
    );

    if (senderFromMatch) {
      company = senderFromMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // Use email domain if possible
  if (!company && sender) {
    const domainMatch = sender.match(
      /@([A-Za-z0-9.-]+)\.[A-Za-z]{2,}$/i
    );

    if (domainMatch) {
      const domainParts = domainMatch[1].split(".");

      const domainCompany =
        domainParts[domainParts.length - 1];

      const ignoredDomains = [
        "gmail",
        "googlemail",
        "outlook",
        "hotmail",
        "yahoo",
        "icloud",
        "protonmail",
        "mail",
      ];

      if (
        domainCompany &&
        !ignoredDomains.includes(domainCompany.toLowerCase())
      ) {
        company =
          domainCompany.charAt(0).toUpperCase() +
          domainCompany.slice(1);
      }
    }
  }

  // Example: "Microsoft Internship"
  if (!company) {
    const subjectCompanyMatch = subject.match(
      /^([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,2})\s+(?:internship|hiring|careers|jobs?|opportunity)\b/i
    );

    if (subjectCompanyMatch) {
      company = subjectCompanyMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // ==========================================================
  // 4. ROLE EXTRACTION
  // ==========================================================

  let role = "";

  // Explicit role
  const labeledRoleMatch = normalizedText.match(
    /\b(?:job title|role|position)\s*[:\-]\s*([A-Za-z][A-Za-z0-9 &/.-]{2,70}?)(?=\s+(?:location|company|salary|stipend|deadline|apply|experience)\b|[.!?]|$)/i
  );

  if (labeledRoleMatch) {
    role = labeledRoleMatch[1]
      .trim()
      .replace(/[.,;:!?]+$/, "");
  }

  // Common technical roles
  if (!role) {
    const roleMatch = normalizedText.match(
      /\b(software engineer|software developer|software engineering intern|software developer intern|frontend developer|frontend engineer|frontend intern|backend developer|backend engineer|backend intern|full stack developer|full stack engineer|full stack intern|web developer|web development intern|data analyst|data scientist|data science intern|AI engineer|AI intern|machine learning engineer|machine learning intern|product manager|UI\/UX designer|UI\/UX intern|Java developer|Python developer|React developer|Node\.js developer|software intern|engineering intern|marketing intern|HR intern|finance intern)\b/i
    );

    if (roleMatch) {
      role = roleMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // We do NOT create a fake "Internship" role.
  if (!role) {
    return emptyResult;
  }

  // ==========================================================
  // 5. VALIDATE COMPANY
  // ==========================================================

  const suspiciousCompanyWords =
    /\b(dear|hi|hello|gurleen|student|candidate|applicant|team|recruitment|hiring|opportunity|opportunities|recommended|apply now)\b/i;

  if (!company || suspiciousCompanyWords.test(company)) {
    return emptyResult;
  }

  if (company.length > 60) {
    return emptyResult;
  }

  if (company.split(/\s+/).length > 5) {
    return emptyResult;
  }

  // ==========================================================
  // 6. DEADLINE EXTRACTION
  // ==========================================================

  const deadlineMatch = normalizedText.match(
    /\b(?:deadline|apply by|last date|applications close(?: on)?)\s*[:\-]?\s*([^.!?]{3,60})/i
  );

  const deadline = deadlineMatch
    ? deadlineMatch[1]
        .trim()
        .replace(/[.,;]+$/, "")
    : "";

  // ==========================================================
  // 7. INTERVIEW DATE EXTRACTION
  // ==========================================================

  const interviewMatch = normalizedText.match(
    /\b(?:interview date|interview on|interview scheduled for)\s*[:\-]?\s*([^.!?]{3,60})/i
  );

  const interviewDate = interviewMatch
    ? interviewMatch[1]
        .trim()
        .replace(/[.,;]+$/, "")
    : "";

  // ==========================================================
  // 8. RETURN CLEAN OPPORTUNITY
  // ==========================================================

  return {
    company,
    role,
    deadline,
    interviewDate,
  };
};
// ============================================================
// 4. DETERMINE EMAIL IMPORTANCE
// ============================================================

const determineImportance = (email) => {
  const text = `${email.subject || ""} ${email.snippet || ""} ${
    email.body || ""
  }`.toLowerCase();


  // ----------------------------------------------------------
  // HIGH PRIORITY
  // ----------------------------------------------------------

  const highPriorityKeywords = [
    "urgent",
    "action required",
    "immediate action",
    "important",
    "deadline",
    "apply by",
    "last date",
    "interview",
    "interview scheduled",
    "offer letter",
    "job offer",
    "internship offer",
    "selected",
    "selection",
    "shortlisted",
    "shortlisted for",
    "assessment",
    "coding assessment",
    "technical interview",
    "final interview",
  ];

  if (
    highPriorityKeywords.some((keyword) =>
      text.includes(keyword)
    )
  ) {
    return "high";
  }


  // ----------------------------------------------------------
  // MEDIUM PRIORITY
  // ----------------------------------------------------------

  const mediumPriorityKeywords = [
    "job",
    "internship",
    "hiring",
    "recruitment",
    "career",
    "application",
    "opportunity",
    "assignment",
    "exam",
  ];

  if (
    mediumPriorityKeywords.some((keyword) =>
      text.includes(keyword)
    )
  ) {
    return "medium";
  }


  // ----------------------------------------------------------
  // LOW PRIORITY
  // ----------------------------------------------------------

  return "low";
};


// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {
  categorizeEmail,
  summarizeEmail,
  extractOpportunity,
  determineImportance,
};