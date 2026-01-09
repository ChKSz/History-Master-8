export interface QAPair {
  id: number;
  question: string;
  answer: string;
}

export interface Lesson {
  id: number;
  title: string;
  unit: string; // Added unit field
  qa: QAPair[];
}

export type ViewMode = 'home' | 'review' | 'quiz' | 'deep-dive';

export interface GradingResult {
  score: number;
  feedback: string;
  isCorrect: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
