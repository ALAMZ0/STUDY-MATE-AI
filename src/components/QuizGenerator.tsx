import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BookOpen,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Award,
  BookMarked,
  Layers,
  Bot,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudy } from '../context/StudyContext';
import { SUBJECTS, EDUCATIONAL_LEVELS } from '../data/curriculumData';
import { aiService } from '../services/aiService';
import { QuizQuestion, QuizResult } from '../types';
import { MathText, FormattedContent } from './MathRenderer';

export const QuizGenerator: React.FC = () => {
  const {
    selectedSubject,
    setSelectedSubject,
    selectedLevel,
    setSelectedLevel,
    recordQuizResult,
    setActiveTab,
  } = useStudy();

  const currentSubjectInfo = SUBJECTS.find((s) => s.id === selectedSubject) || SUBJECTS[0];

  // Configuration State
  const [topic, setTopic] = useState(
    currentSubjectInfo.sampleTopics[selectedLevel]?.[0] || 'Core Fundamental Principles'
  );
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active Quiz State
  const [quizState, setQuizState] = useState<'setup' | 'loading' | 'taking' | 'completed'>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Update sample topic default when subject or level changes
  useEffect(() => {
    const defaultTopic =
      currentSubjectInfo.sampleTopics[selectedLevel]?.[0] || 'Core Fundamental Principles';
    setTopic(defaultTopic);
  }, [selectedSubject, selectedLevel]);

  // Timer while taking quiz
  useEffect(() => {
    let interval: any;
    if (quizState === 'taking') {
      interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizState]);

  const handleStartQuiz = async () => {
    setErrorMsg('');
    setQuizState('loading');
    try {
      const response = await aiService.generateQuiz({
        subject: currentSubjectInfo.name,
        topic,
        difficulty,
        count: questionCount,
        level: selectedLevel,
      });

      if (!response.questions || response.questions.length === 0) {
        throw new Error('No questions returned by the generator.');
      }

      setQuestions(response.questions);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeSpent(0);
      setQuizState('taking');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate quiz. Please try again.');
      setQuizState('setup');
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    const detailedReview = questions.map((q) => {
      const userAns = userAnswers[q.id] || 'Not Answered';
      const isCorrect = userAns.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        isCorrect,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((score / questions.length) * 100);

    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      subject: currentSubjectInfo.name,
      topic,
      level: selectedLevel,
      difficulty,
      timestamp: new Date().toISOString(),
      totalQuestions: questions.length,
      score,
      percentage,
      timeSpentSeconds: timeSpent,
      questions,
      userAnswers,
      detailedReview,
    };

    setQuizResult(result);
    recordQuizResult(result);
    setQuizState('completed');

    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Configuration View */}
      {quizState === 'setup' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">AI Examination Quiz Generator</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Targeted drills aligned with WAEC, NECO, JAMB/UTME and University curricula.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 mb-6 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Subject & Level Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as any)}
                    className="w-full bg-slate-950 text-white text-sm font-medium px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Academic Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as any)}
                    className="w-full bg-slate-950 text-white text-sm font-medium px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    {EDUCATIONAL_LEVELS.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Input & Quick Suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Topic / Syllabus Section
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter or select any topic..."
                  className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500"
                />

                {/* Suggestions from syllabus */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400 self-center">Popular:</span>
                  {(currentSubjectInfo.sampleTopics[selectedLevel] || []).slice(0, 4).map((sTopic, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setTopic(sTopic)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        topic === sTopic
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {sTopic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Question Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                          difficulty === diff
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Question Count
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                          questionCount === num
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {num} Questions
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-99"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Generate Quiz with Gemma 4 E2B</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {quizState === 'loading' && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 animate-pulse">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white">Synthesising Examination Questions</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Google Gemma 4 E2B Instruct is generating authentic {difficulty}-level questions on{' '}
            <strong className="text-white">{topic}</strong> according to the Nigerian {selectedLevel} curriculum...
          </p>
        </div>
      )}

      {/* Active Quiz Taking Runner */}
      {quizState === 'taking' && questions.length > 0 && (
        <div className="space-y-6">
          {/* Quiz Header Bar: Stepper & Timer */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-xs text-slate-400">{currentSubjectInfo.name}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="tabular-nums font-mono">{formatTimer(timeSpent)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Current Question Card */}
          {(() => {
            const currentQ = questions[currentQuestionIndex];
            const currentSelected = userAnswers[currentQ.id];

            return (
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
                <div>
                  {currentQ.curriculumReference && (
                    <span className="text-xs font-medium text-slate-500 block mb-2">
                      <MathText text={currentQ.curriculumReference} />
                    </span>
                  )}
                  <MathText
                    as="h3"
                    text={currentQ.prompt}
                    className="text-base sm:text-lg font-semibold text-white leading-relaxed block"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQ.options?.map((opt) => {
                    const isSelected = currentSelected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="text-sm font-medium pt-0.5 flex-1">
                          <MathText text={opt.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Steppers */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Submit Examination Drill</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Completed Results View */}
      {quizState === 'completed' && quizResult && (
        <div className="space-y-6">
          {/* Summary Score Banner */}
          <div className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 text-center space-y-4">
            <div className="flex justify-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${
                  quizResult.percentage >= 70
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                <Award className="h-8 w-8" />
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Examination Performance
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tabular-nums">
                {quizResult.score} / {quizResult.totalQuestions}{' '}
                <span className="text-lg text-slate-400 font-semibold">({quizResult.percentage}%)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Completed in {formatTimer(quizResult.timeSpentSeconds)} · Topic: {quizResult.topic}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setQuizState('setup')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Take Another Quiz</span>
              </button>
              <button
                onClick={() => setActiveTab('tutor')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Bot className="h-4 w-4" />
                <span>Review Concepts with AI Tutor</span>
              </button>
            </div>
          </div>

          {/* Detailed Question by Question Explanations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-blue-400" />
              Comprehensive Marking & Question Corrections
            </h3>

            {quizResult.questions.map((q, idx) => {
              const review = quizResult.detailedReview[idx];
              const isCorrect = review?.isCorrect;

              return (
                <div
                  key={q.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Incorrect
                        </>
                      )}
                    </span>
                  </div>

                  <MathText
                    as="p"
                    text={q.prompt}
                    className="text-sm sm:text-base font-semibold text-white block"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block mb-1">Your Selected Option:</span>
                      <span
                        className={`font-semibold ${
                          isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        Option {review?.userAnswer || 'None'}:{' '}
                        {(() => {
                          const userOpt = q.options?.find((o) => o.id === review?.userAnswer);
                          return userOpt ? <MathText text={userOpt.text} /> : null;
                        })()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block mb-1">Marking Guide Correct Answer:</span>
                      <span className="font-semibold text-emerald-400">
                        Option {q.correctAnswer}:{' '}
                        {(() => {
                          const correctOpt = q.options?.find((o) => o.id === q.correctAnswer);
                          return correctOpt ? <MathText text={correctOpt.text} /> : null;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Gemma 4 In-Depth Explanation with Math */}
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <strong className="text-blue-300 block mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Gemma 4 Solution & Derivation:
                    </strong>
                    <FormattedContent content={q.explanation} />
                  </div>

                  {/* Distractor Analysis if available */}
                  {q.distractorNotes && !isCorrect && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
                      <span className="font-medium text-slate-300 block mb-1">Common Pitfall Note:</span>
                      <MathText
                        text={
                          q.distractorNotes[review?.userAnswer] ||
                          'Carefully verify mathematical signs and definitions before final selection.'
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
