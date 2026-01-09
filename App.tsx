import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Edit3, MessageCircle, Moon, Sun, Menu, ChevronLeft, ChevronRight, GraduationCap, ChevronDown, LayoutGrid } from 'lucide-react';
import { LESSON_DATA, AUTHOR_NAME, AUTHOR_LINK } from './constants';
import { ViewMode } from './types';
import Home from './components/Home';
import ReviewMode from './components/ReviewMode';
import QuizMode from './components/QuizMode';
import DeepDiveMode from './components/DeepDiveMode';

const App: React.FC = () => {
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null); // Start with null for Home view
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    // Set initial expanded unit if any
    const firstUnit = LESSON_DATA[0].unit;
    if (firstUnit) setExpandedUnits([firstUnit]);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLessonChange = (id: number) => {
    setActiveLessonId(id);
    setViewMode('review'); // Default to review when selecting a lesson
    setIsSidebarOpen(false);
    
    // Auto-expand the unit of the selected lesson and collapse others (Accordion)
    const lesson = LESSON_DATA.find(l => l.id === id);
    if (lesson) {
      setExpandedUnits([lesson.unit]);
    }
  };

  const toggleUnit = (unit: string) => {
    setExpandedUnits(prev => 
      prev.includes(unit) ? [] : [unit] // Close if open, Open only this one if closed
    );
  };

  const groupedLessons = useMemo(() => {
    const groups: Record<string, typeof LESSON_DATA> = {};
    LESSON_DATA.forEach(lesson => {
      if (!groups[lesson.unit]) groups[lesson.unit] = [];
      groups[lesson.unit].push(lesson);
    });
    return groups;
  }, []);

  const activeLesson = activeLessonId ? LESSON_DATA.find(l => l.id === activeLessonId) : null;

  return (
    <div className="flex h-screen w-full bg-surface dark:bg-surface-dark transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 bg-surfaceContainer dark:bg-surfaceContainer-dark 
          border-r border-outline/10 transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 pb-4 border-b border-outline/10 transition-colors duration-300">
            <div 
              className="flex items-center gap-3 text-primary dark:text-primary-dark font-bold text-xl cursor-pointer"
              onClick={() => { setViewMode('home'); setActiveLessonId(null); setIsSidebarOpen(false); }}
            >
              <div className="p-3 bg-primary/10 rounded-2xl">
                <GraduationCap size={26} />
              </div>
              八年级历史
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {/* Home Button in Sidebar */}
             <button
                onClick={() => { setViewMode('home'); setActiveLessonId(null); setIsSidebarOpen(false); }}
                className={`w-full text-left px-6 py-4 rounded-[2rem] text-sm font-bold transition-all duration-300 flex items-center gap-3
                  ${viewMode === 'home'
                    ? 'bg-primary text-onPrimary shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'}
                `}
              >
                <LayoutGrid size={18} />
                首页概览
              </button>

            {Object.entries(groupedLessons).map(([unit, lessons]) => (
              <div key={unit} className="space-y-2">
                <button
                  onClick={() => toggleUnit(unit)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-outline uppercase tracking-wider hover:text-primary transition-colors"
                >
                  <span className="truncate pr-2">{unit.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${expandedUnits.includes(unit) ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`space-y-1 overflow-hidden transition-all duration-500 ${expandedUnits.includes(unit) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonChange(lesson.id)}
                      className={`w-full text-left px-6 py-3 rounded-[2rem] text-sm font-medium transition-all duration-300
                        ${activeLessonId === lesson.id 
                          ? 'bg-primaryContainer dark:bg-primaryContainer-dark text-onPrimaryContainer dark:text-blue-100 shadow-sm translate-x-1' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'}
                      `}
                    >
                      {lesson.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-6 text-center border-t border-outline/10 transition-colors duration-300">
            <a 
              href={AUTHOR_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-outline hover:text-primary transition-colors duration-300 font-medium"
            >
              Created by {AUTHOR_NAME}
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top App Bar (Only visible if not Home) */}
        {viewMode !== 'home' && (
          <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-outline/10 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md z-30 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
              >
                <Menu size={24} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                 <h1 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px] lg:max-w-none transition-colors duration-300">
                  {activeLesson?.title}
                </h1>
                <p className="text-xs text-outline hidden md:block">{activeLesson?.unit}</p>
              </div>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 text-gray-600 dark:text-gray-300"
            >
              {isDark ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </header>
        )}

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'home' ? '' : 'p-4 lg:p-8'}`}>
          <div className="max-w-5xl mx-auto h-full">
            {viewMode === 'home' && (
              <>
                 <div className="absolute top-6 right-6 z-50">
                    <button 
                      onClick={toggleTheme}
                      className="p-3 rounded-full bg-surfaceContainer/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm transition-all duration-300 text-gray-600 dark:text-gray-300"
                    >
                      {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                 </div>
                 <div className="absolute top-6 left-6 z-50 lg:hidden">
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-3 rounded-full bg-surfaceContainer/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm transition-all duration-300 text-gray-600 dark:text-gray-300"
                    >
                      <Menu size={24} />
                    </button>
                 </div>
                <Home onStart={() => handleLessonChange(LESSON_DATA[0].id)} />
              </>
            )}
            {viewMode !== 'home' && activeLesson && (
              <>
                {viewMode === 'review' && <ReviewMode lesson={activeLesson} />}
                {viewMode === 'quiz' && <QuizMode lesson={activeLesson} />}
                {viewMode === 'deep-dive' && <DeepDiveMode lesson={activeLesson} />}
              </>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar (Floating M3 Style) */}
        {viewMode !== 'home' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surfaceContainer dark:bg-gray-800 p-2.5 rounded-full shadow-xl border border-outline/10 flex items-center gap-2 z-40 transition-colors duration-300">
            <NavButton 
              active={viewMode === 'review'} 
              onClick={() => setViewMode('review')} 
              icon={<BookOpen size={22} />} 
              label="学习" 
            />
            <div className="w-px h-6 bg-outline/20 mx-1 transition-colors duration-300"></div>
            <NavButton 
              active={viewMode === 'quiz'} 
              onClick={() => setViewMode('quiz')} 
              icon={<Edit3 size={22} />} 
              label="练习" 
            />
            <div className="w-px h-6 bg-outline/20 mx-1 transition-colors duration-300"></div>
            <NavButton 
              active={viewMode === 'deep-dive'} 
              onClick={() => setViewMode('deep-dive')} 
              icon={<MessageCircle size={22} />} 
              label="提问" 
            />
          </div>
        )}

      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3.5 rounded-full transition-all duration-300
      ${active 
        ? 'bg-primary text-onPrimary shadow-md scale-105' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
    `}
  >
    {icon}
    <span className={`text-sm font-bold ${active ? 'inline-block' : 'hidden md:inline-block'}`}>{label}</span>
  </button>
);

export default App;