import React from 'react';
import { Menu, Sparkles, User, Flame, Clock } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { activeTab, setActiveTab, profile, selectedLevel } = useStudy();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-6 border-b border-slate-800/80 bg-[#070D18]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Zone 1: Mobile Hamburger + Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-blue-400 transition-colors"
        >
          StudyMate AI
        </a>
      </div>

      {/* Zone 2: Navigation Links (Single-Line, clean unboxed text) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('tutor')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'tutor' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          AI Tutor
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'quiz' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Quiz Generator
        </button>
        <button
          onClick={() => setActiveTab('evaluator')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'evaluator' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Answer Evaluator
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'library' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Subject Library
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action + Profile Quick Link */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Current Level Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>{selectedLevel}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-medium">Gemma 4 Ready</span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setActiveTab('tutor')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-xs shadow-blue-500/20 whitespace-nowrap shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask Tutor</span>
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title={`Profile: ${profile.name}`}
          aria-label="Student profile settings"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
