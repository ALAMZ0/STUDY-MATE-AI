import React from 'react';
import {
  Sparkles,
  Bot,
  HelpCircle,
  FileCheck2,
  BookOpen,
  ArrowRight,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Flame,
  CheckCircle2,
  Target,
  BarChart3,
  BookMarked,
  Lightbulb,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { SUBJECTS } from '../data/curriculumData';
import { MathText } from './MathRenderer';

export const Dashboard: React.FC = () => {
  const {
    profile,
    selectedLevel,
    setActiveTab,
    setSelectedSubject,
    recentSessions,
    quizHistory,
  } = useStudy();

  const handleQuickTopicLaunch = (subjectId: any, action: 'tutor' | 'quiz') => {
    setSelectedSubject(subjectId);
    setActiveTab(action);
  };

  // Subject performance stats
  const subjectProgress = [
    { name: 'Mathematics', score: 86, color: 'bg-blue-500', totalQ: 48 },
    { name: 'Physics', score: 79, color: 'bg-cyan-500', totalQ: 34 },
    { name: 'Chemistry', score: 82, color: 'bg-teal-500', totalQ: 28 },
    { name: 'Biology', score: 91, color: 'bg-emerald-500', totalQ: 38 },
  ];

  // Recommended high-yield topics based on current level
  const recommendedTopics = [
    {
      subject: 'Physics',
      subjectId: 'physics',
      topic: 'Equations of Motion & Projectile Calculations',
      examTag: 'WAEC / JAMB High Frequency',
      estimatedTime: '15 min drill',
    },
    {
      subject: 'Mathematics',
      subjectId: 'mathematics',
      topic: 'Quadratic Curves & Completing the Square',
      examTag: 'Core Theory Paper',
      estimatedTime: '20 min session',
    },
    {
      subject: 'Biology',
      subjectId: 'biology',
      topic: 'Sickle Cell & Mendelian Monohybrid Crosses',
      examTag: 'Frequent Section B Question',
      estimatedTime: '12 min review',
    },
    {
      subject: 'Chemistry',
      subjectId: 'chemistry',
      topic: 'Volumetric Analysis & Titration Calculations',
      examTag: 'Practical & Theory Paper 2',
      estimatedTime: '25 min mastery',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome & Exam Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#0F1E36] via-[#112344] to-[#0A162B] p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Gemma 4 E2B Instruct Connected</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{selectedLevel} Level</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {profile.name.split(' ')[0]}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Targeting <strong className="text-white">{profile.targetExam}</strong>. You have logged{' '}
              <span className="text-blue-400 font-semibold">{profile.studyHours} study hours</span> and
              answered <span className="text-blue-400 font-semibold">{profile.totalQuestionsSolved} questions</span> this term.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('tutor')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-98"
            >
              <Bot className="h-4 w-4" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-sm transition-all border border-slate-700/80 active:scale-98"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Start Quiz</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Questions Solved</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {profile.totalQuestionsSolved}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+18 this week</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">Across 8 core subjects</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Average Accuracy</span>
            <BarChart3 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {profile.avgQuizScore}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">Distinction</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">Based on {profile.quizzesTaken} quiz drills</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Study Streak</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {profile.streakDays} Days
            </span>
            <span className="text-xs text-amber-400 font-medium">On Fire</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">Best streak: 14 days</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Study Time</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {profile.studyHours} hrs
            </span>
            <span className="text-xs text-purple-400 font-medium">Logged</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">Goal: 30 hrs/month</p>
        </div>
      </div>

      {/* 3 Core Interactive Launchpads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Launchpad 1: AI Tutor */}
        <div
          onClick={() => setActiveTab('tutor')}
          className="group cursor-pointer rounded-2xl bg-linear-to-b from-slate-900/90 to-slate-950/90 p-6 border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30 mb-4 group-hover:scale-105 transition-transform">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
              AI Academic Tutor
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Ask deep questions about any subject. Request step-by-step derivations, simplified summaries, or practical Nigerian examples.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-blue-400 mt-6 group-hover:translate-x-1 transition-transform">
            <span>Start Tutor Chat</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>

        {/* Launchpad 2: Quiz Generator */}
        <div
          onClick={() => setActiveTab('quiz')}
          className="group cursor-pointer rounded-2xl bg-linear-to-b from-slate-900/90 to-slate-950/90 p-6 border border-slate-800 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 mb-4 group-hover:scale-105 transition-transform">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
              AI Quiz Generator
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Generate timed multiple-choice & short answer practice drills on any topic with instant marking and comprehensive explanations.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-emerald-400 mt-6 group-hover:translate-x-1 transition-transform">
            <span>Generate Custom Quiz</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>

        {/* Launchpad 3: Answer Evaluator */}
        <div
          onClick={() => setActiveTab('evaluator')}
          className="group cursor-pointer rounded-2xl bg-linear-to-b from-slate-900/90 to-slate-950/90 p-6 border border-slate-800 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/15 text-amber-400 border border-amber-500/30 mb-4 group-hover:scale-105 transition-transform">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
              AI Answer Evaluator
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Submit your attempted WAEC, JAMB or university theory answers. Gemma grades your work against official rubric schemes.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-amber-400 mt-6 group-hover:translate-x-1 transition-transform">
            <span>Grade My Essay Answer</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </div>

      {/* Two Column Section: Recommended Topics & Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recommended Exam Topics */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Recommended High-Yield Topics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Curriculum priorities for {selectedLevel} examination success
              </p>
            </div>
            <button
              onClick={() => setActiveTab('library')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <span>Explore Library</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendedTopics.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-colors gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-blue-400">{item.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400/90">{item.examTag}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.estimatedTime}</span>
                  </div>
                  <MathText as="h4" text={item.topic} className="text-sm font-semibold text-white block" />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleQuickTopicLaunch(item.subjectId, 'tutor')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Ask Tutor
                  </button>
                  <button
                    onClick={() => handleQuickTopicLaunch(item.subjectId, 'quiz')}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
                  >
                    Take Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Subject Mastery & Recent Sessions */}
        <div className="space-y-6">
          {/* Subject Performance Breakdown */}
          <div className="rounded-2xl bg-slate-900/60 p-6 border border-slate-800/80">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 mb-4">
              Subject Mastery
            </h3>
            <div className="space-y-4">
              {subjectProgress.map((sub, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">{sub.name}</span>
                    <span className="font-semibold text-white tabular-nums">{sub.score}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${sub.color}`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="rounded-2xl bg-slate-900/60 p-6 border border-slate-800/80">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 mb-4">
              Recent Learning History
            </h3>
            <div className="space-y-3">
              {recentSessions.slice(0, 3).map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => setActiveTab(sess.type)}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-blue-400">{sess.subject}</span>
                    <span>{sess.timestamp}</span>
                  </div>
                  <h5 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    <MathText text={sess.title} />
                  </h5>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    <MathText text={sess.summary} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
