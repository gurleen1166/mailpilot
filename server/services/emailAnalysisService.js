
const categorizeEmail = (email) => {
  const text = `${email.subject || ""} ${email.snippet || ""} ${
    email.body || ""
  }`.toLowerCase();

  if (/\b(internship|intern\b|interns)\b/.test(text)) {
    return "internship";
  }

  if (
    /\b(job opening|job opportunity|hiring|recruitment|vacancy|careers|job alert)\b/.test(
      text
    )
  ) {
    return "job";
  }

  if (
    /\b(assignment|lecture|exam schedule|university|semester|academic)\b/.test(
      text
    )
  ) {
    return "academic";
  }

  if (
    /\b(unsubscribe|special offer|discount|sale|promotion)\b/.test(text)
  ) {
    return "promotion";
  }

  if (/\b(spam|lottery winner|claim your prize)\b/.test(text)) {
    return "spam";
  }

  if (/\b(personal|family|birthday|weekend plans)\b/.test(text)) {
    return "personal";
  }

  return "general";
};

const summarizeEmail = (email) => {
  const text = (email.body || email.snippet || "").replace(/\s+/g, " ").trim();

  if (!text) {
    return "No email content available to summarize.";
  }

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return sentences.slice(0, 2).join(" ").trim().slice(0, 400);
};

const extractOpportunity = (email) => {
  const text = `${email.subject || ""}\n${email.body || email.snippet || ""}`;

  const isOpportunity = ["job", "internship"].includes(
    categorizeEmail(email)
  );

  if (!isOpportunity) {
    return {
      company: "",
      role: "",
      deadline: "",
      interviewDate: "",
    };
  }

  const companyMatch = text.match(
    /(?:at|with|from)\s+([A-Z][A-Za-z0-9&.-]*(?:\s+[A-Z][A-Za-z0-9&.-]*){0,3})/
  );

  
const roleMatch =
  text.match(
    /\b(?:role|position|opening|hiring for)\s*[:\-]?\s*([A-Za-z][A-Za-z &/-]{2,50})/i
  ) ||
  text.match(
    /\b(?:software engineer|software developer|web developer|frontend developer|backend developer|full stack developer|data analyst|data scientist|ai engineer|machine learning engineer|internship|intern)\b/i
  );

  const deadlineMatch = text.match(
    /\b(?:deadline|apply by|last date|applications close(?: on)?)\s*[:\-]?\s*([^\n.!?]{3,50})/i
  );

  const interviewMatch = text.match(
    /\b(?:interview date|interview on|interview scheduled for)\s*[:\-]?\s*([^\n.!?]{3,50})/i
  );

  return {
    company: companyMatch ? companyMatch[1].trim() : "",
    role: roleMatch
  ? (roleMatch[1] || roleMatch[0]).trim()
  : "",
    deadline: deadlineMatch ? deadlineMatch[1].trim() : "",
    interviewDate: interviewMatch ? interviewMatch[1].trim() : "",
  };
};

module.exports = {
  categorizeEmail,
  summarizeEmail,
  extractOpportunity,
};
