import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AcademicLevel,
  StudentProfile,
  LearningSession,
  QuizResult,
  EvaluationResult,
  SubjectId,
} from '../types';

interface StudyContextType {
  activeTab: 'dashboard' | 'tutor' | 'quiz' | 'evaluator' | 'library' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'tutor' | 'quiz' | 'evaluator' | 'library' | 'settings') => void;
  profile: StudentProfile;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  selectedSubject: SubjectId;
  setSelectedSubject: (id: SubjectId) => void;
  selectedLevel: AcademicLevel;
  setSelectedLevel: (level: AcademicLevel) => void;
  recentSessions: LearningSession[];
  addSession: (session: Omit<LearningSession, 'id' | 'timestamp'>) => void;
  quizHistory: QuizResult[];
  recordQuizResult: (result: QuizResult) => void;
  evaluationHistory: EvaluationResult[];
  recordEvaluationResult: (result: EvaluationResult) => void;
  resetAllData: () => void;
}

const DEFAULT_PROFILE: StudentProfile = {
  name: 'Chidubem Okafor',
  currentLevel: 'SS1–SS3',
  targetExam: 'WAEC / JAMB 2026',
  institution: 'King’s College, Lagos',
  favoriteSubjects: ['mathematics', 'physics', 'chemistry'],
  streakDays: 6,
  totalQuestionsSolved: 148,
  quizzesTaken: 12,
  avgQuizScore: 82,
  studyHours: 24.5,
};

const INITIAL_SESSIONS: LearningSession[] = [
  {
    id: 'sess-1',
    type: 'tutor',
    title: 'Kinematics & Projectiles Derivation',
    subject: 'Physics',
    level: 'SS1–SS3',
    timestamp: '2 hours ago',
    summary: 'Mastered maximum height, time of flight and resolution of horizontal velocity vectors.',
  },
  {
    id: 'sess-2',
    type: 'quiz',
    title: 'Quadratic Equations & Roots Drill',
    subject: 'Mathematics',
    level: 'SS1–SS3',
    timestamp: 'Yesterday',
    summary: 'Scored 90% (9/10). Reviewed factoring of negative discriminant systems.',
  },
  {
    id: 'sess-3',
    type: 'evaluator',
    title: 'Osmosis & Plasmolysis Theory Essay',
    subject: 'Biology',
    level: 'SS1–SS3',
    timestamp: '2 days ago',
    summary: 'Graded 8.5/10 by Gemma 4. Corrected confusion between turgor pressure and wall pressure.',
  },
  {
    id: 'sess-4',
    type: 'tutor',
    title: 'Redox Numbers in Dichromate & Permanganate',
    subject: 'Chemistry',
    level: 'SS1–SS3',
    timestamp: '3 days ago',
    summary: 'Understood oxidation state calculations for transition metal complexes.',
  },
];

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tutor' | 'quiz' | 'evaluator' | 'library' | 'settings'>('dashboard');

  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('studymate_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('mathematics');
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel>(profile.currentLevel || 'SS1–SS3');

  const [recentSessions, setRecentSessions] = useState<LearningSession[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_sessions');
      return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  const [quizHistory, setQuizHistory] = useState<QuizResult[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationResult[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_evaluations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('studymate_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_sessions', JSON.stringify(recentSessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage', e);
    }
  }, [recentSessions]);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_quizzes', JSON.stringify(quizHistory));
    } catch (e) {
      console.warn('Failed to save quizzes to localStorage', e);
    }
  }, [quizHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_evaluations', JSON.stringify(evaluationHistory));
    } catch (e) {
      console.warn('Failed to save evaluations to localStorage', e);
    }
  }, [evaluationHistory]);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    if (updates.currentLevel) {
      setSelectedLevel(updates.currentLevel);
    }
  };

  const addSession = (session: Omit<LearningSession, 'id' | 'timestamp'>) => {
    const newSession: LearningSession = {
      ...session,
      id: `sess-${Date.now()}`,
      timestamp: 'Just now',
    };
    setRecentSessions((prev) => [newSession, ...prev.slice(0, 9)]);
  };

  const recordQuizResult = (result: QuizResult) => {
    setQuizHistory((prev) => [result, ...prev]);

    // Update profile stats
    setProfile((prev) => {
      const newTotalQ = prev.totalQuestionsSolved + result.totalQuestions;
      const newQuizCount = prev.quizzesTaken + 1;
      const totalScoreSum = prev.avgQuizScore * prev.quizzesTaken + result.percentage;
      const newAvg = Math.round(totalScoreSum / newQuizCount);

      return {
        ...prev,
        totalQuestionsSolved: newTotalQ,
        quizzesTaken: newQuizCount,
        avgQuizScore: newAvg,
        studyHours: Number((prev.studyHours + result.timeSpentSeconds / 3600).toFixed(1)),
      };
    });

    addSession({
      type: 'quiz',
      title: `${result.topic} Practice`,
      subject: result.subject,
      level: result.level,
      summary: `Scored ${result.score}/${result.totalQuestions} (${result.percentage}%). Completed in ${Math.round(result.timeSpentSeconds / 60)} min.`,
    });
  };

  const recordEvaluationResult = (result: EvaluationResult) => {
    setEvaluationHistory((prev) => [result, ...prev]);

    addSession({
      type: 'evaluator',
      title: `${result.subject} Answer Grading`,
      subject: result.subject,
      level: result.level,
      summary: `Graded ${result.totalScore}/${result.maxScore} (${result.percentage}%) for ${result.examType}. ${result.verdict}.`,
    });
  };

  const resetAllData = () => {
    setProfile(DEFAULT_PROFILE);
    setRecentSessions(INITIAL_SESSIONS);
    setQuizHistory([]);
    setEvaluationHistory([]);
    try {
      localStorage.removeItem('studymate_profile');
      localStorage.removeItem('studymate_sessions');
      localStorage.removeItem('studymate_quizzes');
      localStorage.removeItem('studymate_evaluations');
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
  };

  return (
    <StudyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profile,
        updateProfile,
        selectedSubject,
        setSelectedSubject,
        selectedLevel,
        setSelectedLevel,
        recentSessions,
        addSession,
        quizHistory,
        recordQuizResult,
        evaluationHistory,
        recordEvaluationResult,
        resetAllData,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
