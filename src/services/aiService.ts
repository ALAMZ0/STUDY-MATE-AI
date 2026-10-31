import {
  AcademicLevel,
  ChatMessage,
  EvaluationResult,
  GemmaStatusResponse,
  QuizQuestion,
} from '../types';

export interface ChatResponse {
  content: string;
  suggestedFollowUps: string[];
}

export interface QuizResponse {
  subject: string;
  topic: string;
  level: AcademicLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
}

export const aiService = {
  // Check backend Gemma 4 status
  async getStatus(): Promise<GemmaStatusResponse> {
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn('Status check failed:', err);
      return {
        status: 'offline',
        model: 'Google Gemma 4 E2B Instruct',
        endpointConfigured: true,
        endpoint: 'Gradio endpoint unreachable',
        features: [
          'Google Gemma 4 E2B Instruct via Kaggle Gradio',
          'Interactive Nigerian Curriculum Tutoring',
        ],
        latencyMs: 0,
        error: err.message || 'Cannot reach StudyMate AI backend server.',
      };
    }
  },

  // Send question to AI Tutor
  async sendChatMessage(params: {
    message: string;
    subject: string;
    level: AcademicLevel;
    actionType?: 'standard' | 'example' | 'simplify' | 'step_by_step' | 'past_question';
    history?: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<ChatResponse> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    return await response.json();
  },

  // Generate interactive quiz
  async generateQuiz(params: {
    subject: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    count: number;
    level: AcademicLevel;
  }): Promise<QuizResponse> {
    const response = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Quiz generation failed with status ${response.status}`);
    }

    return await response.json();
  },

  // Evaluate exam answer
  async evaluateAnswer(params: {
    question: string;
    studentAnswer: string;
    subject: string;
    examType: 'WAEC / WASSCE' | 'JAMB / UTME' | 'NECO' | 'University Semester Exam';
    level: AcademicLevel;
  }): Promise<EvaluationResult> {
    const response = await fetch('/api/ai/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Answer evaluation failed with status ${response.status}`);
    }

    return await response.json();
  },
};
