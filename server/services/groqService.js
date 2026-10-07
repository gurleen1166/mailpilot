const generateAIResponse = async (prompt) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are MailPilot, an AI email assistant. Give helpful, concise, professional responses.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Groq API request failed");
    }

    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq AI error:", error.message);
    throw error;
  }
};

module.exports = {
  generateAIResponse,
};