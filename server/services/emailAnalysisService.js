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

  const text = `${subject}\n${body}`;
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const lowerText = normalizedText.toLowerCase();

  const emptyResult = {
    company: "",
    role: "",
    deadline: "",
    interviewDate: "",
  };

  // ----------------------------------------------------------
  // 1. Ignore obvious non-opportunity emails
  // ----------------------------------------------------------

  const nonOpportunitySignals =
    /\b(successful completion of my internship|completed my internship|completion of my internship|congratulations on your|recommended opportunities|curated just for you|contest is live|rewards|discount|special offer|newsletter|unsubscribe|get unstoppable|mutual connections|see more people you might know|connect with|people you may know)\b/i;

  if (nonOpportunitySignals.test(lowerText)) {
    return emptyResult;
  }

  // ----------------------------------------------------------
  // 2. Detect genuine job/internship signals
  // ----------------------------------------------------------

  const jobSignals =
    /\b(apply now|apply here|job opening|job opportunity|job description|hiring for|we are hiring|job alert|vacancy|position available|career opportunity|careers|full[- ]time role|part[- ]time role|job application|job position|open position|immediate opening)\b/i;

  const internshipSignals =
    /\b(internship|internship opening|internship opportunity|internship program|interns wanted|hiring interns|internship position|summer internship|offering internships|intern role)\b/i;

  const hasJobSignal = jobSignals.test(lowerText);
  const hasInternshipSignal = internshipSignals.test(lowerText);

  const category = (email.category || "").toLowerCase();

  const isJob = category === "job" || hasJobSignal;
  const isInternship =
    category === "internship" || hasInternshipSignal;

  if (!isJob && !isInternship) {
    return emptyResult;
  }

  // ----------------------------------------------------------
  // 3. COMPANY EXTRACTION
  // ----------------------------------------------------------

  let company = "";

  // Example:
  // Company: Microsoft
  // Employer: Adobe
  // Organization: Google

  const labeledCompanyMatch = normalizedText.match(
    /\b(?:company|employer|organization)\s*[:\-]\s*([A-Za-z0-9&.'-]+(?:\s+[A-Za-z0-9&.'-]+){0,5})/i
  );

  if (labeledCompanyMatch) {
    company = labeledCompanyMatch[1]
      .trim()
      .replace(/[.,;:!?]+$/, "");
  }

  // Example:
  // Software Engineer at Microsoft
  // Internship at Adobe

  if (!company) {
    const atCompanyMatch = normalizedText.match(
      /\b(?:at|with)\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})/
    );

    if (atCompanyMatch) {
      company = atCompanyMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // Example:
  // Jia from Unstop
  // Opportunity from Microsoft

  if (!company) {
    const fromCompanyMatch = subject.match(
      /\bfrom\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,2})\b/
    );

    if (fromCompanyMatch) {
      company = fromCompanyMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // Example:
  // Unstop Internship
  // Microsoft Hiring
  // Adobe Careers

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

  // ----------------------------------------------------------
  // 4. ROLE EXTRACTION
  // ----------------------------------------------------------

  let role = "";

  // Explicit role labels

  const labeledRoleMatch = normalizedText.match(
    /\b(?:job title|role|position)\s*[:\-]\s*([A-Za-z][A-Za-z0-9 &/.-]{2,70})/i
  );

  if (labeledRoleMatch) {
    role = labeledRoleMatch[1]
      .trim()
      .replace(/[.,;:!?]+$/, "");
  }

  // Common job titles

  if (!role) {
    const roleMatch = normalizedText.match(
      /\b(software engineer|software developer|software engineering intern|software developer intern|frontend developer|frontend engineer|frontend intern|backend developer|backend engineer|backend intern|full stack developer|full stack engineer|web developer|web development intern|data analyst|data scientist|data science intern|AI engineer|AI intern|machine learning engineer|machine learning intern|product manager|UI\/UX designer|UI\/UX intern|Java developer|Python developer|React developer|Node\.js developer|software intern|engineering intern|marketing intern|HR intern|finance intern)\b/i
    );

    if (roleMatch) {
      role = roleMatch[1]
        .trim()
        .replace(/[.,;:!?]+$/, "");
    }
  }

  // Generic internship fallback

  if (!role && isInternship) {
    role = "Internship";
  }

  // ----------------------------------------------------------
  // 5. DEADLINE EXTRACTION
  // ----------------------------------------------------------

  const deadlineMatch = normalizedText.match(
    /\b(?:deadline|apply by|last date|applications close(?: on)?)\s*[:\-]?\s*([^.!?]{3,60})/i
  );

  const deadline = deadlineMatch
    ? deadlineMatch[1].trim().replace(/[.,;]+$/, "")
    : "";

  // ----------------------------------------------------------
  // 6. INTERVIEW DATE EXTRACTION
  // ----------------------------------------------------------

  const interviewMatch = normalizedText.match(
    /\b(?:interview date|interview on|interview scheduled for)\s*[:\-]?\s*([^.!?]{3,60})/i
  );

  const interviewDate = interviewMatch
    ? interviewMatch[1].trim().replace(/[.,;]+$/, "")
    : "";

  // ----------------------------------------------------------
  // 7. Validate company
  // ----------------------------------------------------------

  const suspiciousCompanyWords =
    /\b(dear|hi|hello|gurleen|student|candidate|applicant|team|recruitment|hiring|opportunity)\b/i;

  if (!company || suspiciousCompanyWords.test(company)) {
    return emptyResult;
  }

  // ----------------------------------------------------------
  // 8. Return clean opportunity
  // ----------------------------------------------------------

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