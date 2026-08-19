
import { GoogleGenAI, Type } from "@google/genai";

/**
 * The client is built on first use, not at import time.
 *
 * GoogleGenAI throws in the browser when no key is configured. Constructing it
 * at module scope made that throw happen during import, which crashed the whole
 * app — every page rendered blank — rather than just disabling the AI helpers.
 */
let client: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI | null => {
  if (client) return client;

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API key is not configured — AI generation is disabled.");
    return null;
  }

  try {
    client = new GoogleGenAI({ apiKey });
    return client;
  } catch (error) {
    console.error("Failed to initialise the Gemini client:", error);
    return null;
  }
};

/** True when AI features can actually run, for callers that want to hide UI. */
export const isAiAvailable = (): boolean => Boolean(process.env.API_KEY);

export const generateBlogContent = async (topic: string) => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a modern, professional blog post excerpt and content for a design portfolio based on the topic: "${topic}". Make it insightful, bold, and trend-focused. Return the data in JSON format with "excerpt" and "content" fields.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            excerpt: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["excerpt", "content"],
        }
      }
    });

    // Fix: Using the .text property directly instead of a method or complex nesting.
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const refineCaseStudy = async (title: string, description: string) => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Refine this design case study. Title: ${title}. Initial Description: ${description}. 
      Explain the challenge, the approach taken, and the result in a compelling way for a senior design portfolio. 
      Return the content as a single markdown-style string.`,
    });
    // Fix: Using the .text property directly instead of a method or complex nesting.
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
