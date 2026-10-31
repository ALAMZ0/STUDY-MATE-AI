export type AcademicLevel = 'JSS1–JSS3' | 'SS1–SS3' | 'University';

export type SubjectId =
  | 'mathematics'
  | 'further-mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'english-language'
  | 'economics'
  | 'computer-studies';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  iconName: string;
  description: string;
  category: 'Sciences' | 'Mathematics' | 'Humanities & Social Sciences' | 'Technology';
  accentColor: string;
  topicsCount: {
    jss: number;
    ss: number;
    uni: number;
  };
  sampleTopics: {
    'JSS1–JSS3': string[];
    'SS1–SS3': string[];
    'University': string[];
  };
  waecWeight?: string;
  jambFocus?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionType?: 'standard' | 'example' | 'simplify' | 'step_by_step' | 'past_question';
  subject?: string;
  level?: AcademicLevel;
  sources?: string[];
  suggestedFollowUps?: string[];
}

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  type: 'multiple_choice' | 'short_answer';
  prompt: string;
  options?: QuizOption[];
  correctAnswer: string;
  explanation: string;
  curriculumReference?: string;
  distractorNotes?: Record<string, string>;
}

export interface QuizResult {
  id: string;
  subject: string;
  topic: string;
  level: AcademicLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timestamp: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  detailedReview: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface EvaluationRubricItem {
  criterion: string;
  awardedMarks: number;
  totalMarks: number;
  feedback: string;
  status: 'achieved' | 'partial' | 'missing';
}

export interface EvaluationResult {
  id: string;
  subject: string;
  examType: 'WAEC / WASSCE' | 'JAMB / UTME' | 'NECO' | 'University Semester Exam';
  level: AcademicLevel;
  question: string;
  studentAnswer: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  verdict: 'Excellent' | 'Good Attempt' | 'Needs Improvement' | 'Substantially Incomplete';
  rubricBreakdown: EvaluationRubricItem[];
  correctPoints: string[];
  missingPoints: string[];
  conceptualMistakes: string[];
  modelAnswer: string;
  examinerTips: string[];
  timestamp: string;
}

export interface StudentProfile {
  name: string;
  currentLevel: AcademicLevel;
  targetExam: string;
  institution: string;
  favoriteSubjects: SubjectId[];
  streakDays: number;
  totalQuestionsSolved: number;
  quizzesTaken: number;
  avgQuizScore: number;
  studyHours: number;
}

export interface LearningSession {
  id: string;
  type: 'tutor' | 'quiz' | 'evaluator';
  title: string;
  subject: string;
  level: AcademicLevel;
  timestamp: string;
  summary: string;
}

export interface GemmaStatusResponse {
  status: 'connected' | 'offline';
  model: string;
  endpointConfigured: boolean;
  endpoint: string;
  features: string[];
  latencyMs: number;
  error?: string | null;
}
