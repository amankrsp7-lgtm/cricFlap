import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMatchCommentary = async (score: number, coins: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Commentary unavailable (API Key missing).";

  try {
    const prompt = `
      You are an energetic cricket commentator (like Ravi Shastri or Harsha Bhogle).
      A game just finished where Virat Kohli (the player) was dodging Gautam Gambhir (the obstacles) and collecting MS Dhoni coins.
      
      Stats:
      - Distance Run (Score): ${score}
      - MS Dhoni Coins Collected: ${coins}
      
      Write a short, funny, 2-3 sentence post-match presentation analysis of Virat's performance. 
      Mention the "Gambhir obstacles" and the "Dhoni support".
      If the score is low (<10), roast him gently. If high (>30), praise him as the King.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "What a match! Incredible scenes here at the stadium.";
  } catch (error) {
    console.error("Error generating commentary:", error);
    return "Technical difficulties with the comms box! We'll be right back.";
  }
};
