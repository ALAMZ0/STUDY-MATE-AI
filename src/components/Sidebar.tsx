import React from 'react';
import {
  LayoutDashboard,
  Bot,
  HelpCircle,
  FileCheck2,
  BookOpen,
  Settings,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  GraduationCap,
  X,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { EDUCATIONAL_LEVELS } from '../data/curriculumData';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, selectedLevel, setSelectedLevel, profile } = useStudy();

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & statistics',
    },
    {
      id: 'tutor' as const,
      label: 'AI Tutor',
      icon: Bot,
      badge: 'Gemma 4',
      description: 'Interactive concept tutor',
    },
    {
      id: 'quiz' as const,
      label: 'Quiz Generator',
      icon: HelpCircle,
      description: 'Practice questions & drills',
    },
    {
      id: 'evaluator' as const,
      label: 'Answer Evaluator',
      icon: FileCheck2,
      description: 'WAEC & exam grading',
    },
    {
      id: 'library' as const,
      label: 'Subject Library',
      icon: BookOpen,
      description: '8 core Nigerian subjects',
    },
    {
      id: 'settings' as const,
      label: 'Settings & Profile',
      icon: Settings,
      description: 'Gemma backend & account',
    },
  ];

  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#0B1528] border-r border-slate-800/80 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                StudyMate <span className="text-blue-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30">AI</span>
              </span>
              <p className="text-[11px] text-slate-400">Gemma 4 Academic Tutor</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Academic Level Quick-Switcher */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Academic Level</span>
            <span className="text-[11px] text-blue-400 font-medium">{profile.targetExam}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800">
            {EDUCATIONAL_LEVELS.map((lvl) => {
              const active = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={lvl.name}
                >
                  {lvl.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="text-left">
                    <span className="block leading-none">{item.label}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{item.description}</span>
                  </div>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Study Streak & Gemma Model Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
          {/* Daily Streak Card */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{profile.streakDays} Day Study Streak</p>
                <p className="text-[11px] text-slate-400">Active today</p>
              </div>
            </div>
            <Award className="h-4 w-4 text-amber-400/80" />
          </div>

          {/* AI Model Badge */}
          <div className="p-2.5 bg-blue-950/30 rounded-xl border border-blue-900/40">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">AI Model Engine</span>
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Gemma 4 E2B
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Configured for Nigerian Academic Syllabus</p>
          </div>
        </div>
      </aside>
    </>
  );
};
