const axios = require("axios");

// ==========================================
// Generate AI Conversation Title
// ==========================================

const generateAITitle = async (message) => {
  try {
    if (!message || !message.trim()) {
      return "New Conversation";
    }

    const prompt = `
Create a short and meaningful chat title.

Rules:
- Maximum 5 words only
- Use title style words
- No quotes
- No punctuation
- No explanation
- Do not repeat the full question
- Make it suitable for a conversation sidebar

Examples:

User:
My farm has low rainfall and biodiversity is decreasing

Good titles:
Farm Drought Impact
Biodiversity Recovery Plan
Improving Farm Resilience

User:
How can I improve soil health

Good titles:
Improve Soil Health
Soil Restoration Guide

Now create title for:

${message}
`;

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/chat`,
      {
        message: prompt,
        conversation_context: JSON.stringify({
          summary: "",
          recentMessages: [],
        }),
      },
      {
        timeout: 15000,
      },
    );

    let title = response.data.response || "";

    title = cleanTitle(title);

    if (!title) {
      return createFallbackTitle(message);
    }

    return title.split(" ").slice(0, 5).join(" ");
  } catch (error) {
    console.error("AI Title Generation Error:", error.message);

    return createFallbackTitle(message);
  }
};

// ==========================================
// Clean AI Response
// ==========================================

const cleanTitle = (title) => {
  return title
    .replace(/[#*`"'_]/g, "")
    .replace(
      /^(title|chat title|conversation title|here is the title)\s*:?/i,
      "",
    )
    .replace(/[.!?,:]/g, "")
    .trim();
};

// ==========================================
// Fallback Title
// ==========================================

const createFallbackTitle = (message) => {
  if (!message) {
    return "New Conversation";
  }

  const words = message.trim().replace(/\s+/g, " ").split(" ");

  if (words.length <= 4) {
    return message.trim();
  }

  return words.slice(0, 4).join(" ") + " Guide";
};

module.exports = {
  generateAITitle,
};
