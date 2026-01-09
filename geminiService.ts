import { GoogleGenAI } from "@google/genai";
import { GradingResult, ChatMessage } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-flash-lite-latest';

const SYSTEM_PROMPT = `
  Role: You are 纲哥 (Brother Gang), a strict, serious, and meticulous 8th-grade History teacher.
  Context: You are supervising students reviewing the "八上期末复习提纲".
  Tone: Serious, concise, no-nonsense. You value accuracy above all else. You speak in a direct, authoritative, teacher-like manner.
  Language: Simplified Chinese (Always).
  
  Key Behaviors:
  1. Your name is 纲哥.
  2. When grading, you strictly compare the student's answer parts to the reference outline.
  3. If the reference has numbered points (e.g., ①②③), you expect the student to have covered those specific points.
  4. Feedback should be direct. If wrong, point out exactly which keyword or fact is missing.
  5. In chat, you remember the conversation context. Don't repeat yourself unnecessarily.
`;

export const gradeAnswer = async (question: string, userAnswer: string, correctAnswer: string): Promise<GradingResult> => {
  if (!userAnswer.trim()) {
    return { score: 0, feedback: "空白卷子？这可不是我的学生该有的态度。", isCorrect: false };
  }

  const prompt = `
    ${SYSTEM_PROMPT}

    Task: Grade a student's answer.
    Question: ${question}
    Standard Answer (Outline): ${correctAnswer}
    Student Answer: ${userAnswer}
    
    Instructions:
    1. Compare the student's answer strictly with the Standard Answer.
    2. Give a score from 0 to 100. High standards.
    3. Feedback: Provide a detailed analysis. Explain EXACTLY what is missing or wrong compared to the outline. If correct, acknowledge it briefly.
    4. Ignore minor typos, but penalize historical inaccuracies (wrong dates, people, treaties).
    
    Output JSON format:
    { "score": number, "feedback": "string", "isCorrect": boolean }
    (isCorrect is true only if score >= 80)
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as GradingResult;
  } catch (error) {
    console.error("Grading error:", error);
    return { score: 0, feedback: "纲哥正在处理其他事务（网络波动），暂无法批改。", isCorrect: false };
  }
};

export const askHistoryQuestion = async (context: string, history: ChatMessage[], newMessage: string): Promise<string> => {
  // Convert chat history to a readable script format for the AI
  const historyText = history.slice(-10).map(msg => // Keep last 10 turns for context window efficiency
    `${msg.role === 'user' ? 'Student' : '纲哥'}: ${msg.text}`
  ).join('\n');

  const prompt = `
    ${SYSTEM_PROMPT}

    Context (八上期末复习提纲 Content):
    ${context}

    --- Conversation History ---
    ${historyText}
    
    --- New Interaction ---
    Student: ${newMessage}
    纲哥:

    Instructions:
    1. Answer based strictly on the provided outline context.
    2. If the answer is not in the outline, state that it's outside the syllabus but provide a brief correct historical answer.
    3. Maintain the persona of 纲哥 (Teacher Gang). Be direct.
    4. Use the conversation history to understand pronouns like "it", "he", "that event".
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "这个问题纲哥暂时不作回答。";
  } catch (error) {
    console.error("Chat error:", error);
    return "纲哥现在有点忙，稍后再问。";
  }
};