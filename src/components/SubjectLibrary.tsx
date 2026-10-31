import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Calculator,
  Sigma,
  Atom,
  FlaskConical,
  Dna,
  TrendingUp,
  Cpu,
  ArrowRight,
  Bot,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { SUBJECTS, EDUCATIONAL_LEVELS } from '../data/curriculumData';
import { SubjectId } from '../types';
import { MathText } from './MathRenderer';

export const SubjectLibrary: React.FC = () => {
  const {
    selectedSubject,
    setSelectedSubject,
    selectedLevel,
    setSelectedLevel,
    setActiveTab,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Sciences', 'Mathematics', 'Humanities & Social Sciences', 'Technology'];

  // Map icon strings to Lucide components
  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return Calculator;
      case 'Sigma':
        return Sigma;
      case 'Atom':
        return Atom;
      case 'FlaskConical':
        return FlaskConical;
      case 'Dna':
        return Dna;
      case 'BookOpen':
        return BookOpen;
      case 'TrendingUp':
        return TrendingUp;
      case 'Cpu':
        return Cpu;
      default:
        return BookOpen;
    }
  };

  const filteredSubjects = SUBJECTS.filter((sub) => {
    const matchesCat = activeCategory === 'All' || sub.category === activeCategory;
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.sampleTopics[selectedLevel]?.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCat && matchesSearch;
  });

  const handleLaunchTutor = (subId: SubjectId) => {
    setSelectedSubject(subId);
    setActiveTab('tutor');
  };

  const handleLaunchQuiz = (subId: SubjectId) => {
    setSelectedSubject(subId);
    setActiveTab('quiz');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-400" />
              Nigerian Curriculum Subject Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Aligned with WAEC, NECO, JAMB/UTME, and NUC undergraduate benchmark minimum academic standards.
            </p>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {EDUCATIONAL_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects or topics (e.g. calculus, vectors, sickle cell, inflation)..."
              className="w-full bg-slate-950 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSubjects.map((subject) => {
          const Icon = getSubjectIcon(subject.iconName);
          const currentTopics = subject.sampleTopics[selectedLevel] || [];

          return (
            <div
              key={subject.id}
              className="rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 p-6 flex flex-col justify-between transition-colors shadow-lg"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
                      style={{ backgroundColor: `${subject.accentColor}25`, color: subject.accentColor }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{subject.name}</h3>
                      <span className="text-xs text-slate-400">{subject.category}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {subject.topicsCount.ss} Syllabus Units
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{subject.description}</p>

                {/* Exam Weights */}
                {(subject.waecWeight || subject.jambFocus) && (
                  <div className="p-3 mb-4 rounded-xl bg-slate-950/60 border border-slate-800/70 text-[11px] space-y-1">
                    {subject.waecWeight && (
                      <div className="text-slate-300">
                        <strong className="text-blue-400">WAEC / WASSCE:</strong> {subject.waecWeight}
                      </div>
                    )}
                    {subject.jambFocus && (
                      <div className="text-slate-300">
                        <strong className="text-emerald-400">JAMB / UTME:</strong> {subject.jambFocus}
                      </div>
                    )}
                  </div>
                )}

                {/* Topics for Selected Level */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key {selectedLevel} Topics:
                  </span>
                  <div className="space-y-1.5">
                    {currentTopics.slice(0, 4).map((top, tIdx) => (
                      <div
                        key={tIdx}
                        className="text-xs text-slate-300 flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/50"
                      >
                        <span className="text-blue-400 font-bold">·</span>
                        <div className="truncate flex-1">
                          <MathText text={top} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleLaunchTutor(subject.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Ask AI Tutor</span>
                </button>
                <button
                  onClick={() => handleLaunchQuiz(subject.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Practice Quiz</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
