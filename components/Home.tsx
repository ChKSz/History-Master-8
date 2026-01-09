import React from 'react';
import { ScrollText, GraduationCap, ChevronRight } from 'lucide-react';
import { AUTHOR_NAME, AUTHOR_LINK } from '../constants';

interface Props {
  onStart: () => void;
}

const Home: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in relative overflow-hidden">
      
      <div className="text-center space-y-8 z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surfaceContainer dark:bg-surfaceContainer-dark border border-outline/10 text-primary dark:text-primary-dark font-medium text-sm animate-slide-up">
          <ScrollText size={16} />
          <span>八年级历史上册复习助手</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight animate-slide-up leading-tight">
          History <span className="text-primary dark:text-primary-dark">Master</span>
        </h1>

        <p className="text-lg md:text-xl text-outline dark:text-gray-400 max-w-lg mx-auto leading-relaxed animate-slide-up">
           精准考点 • 智能批改 • 深度问答
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-slide-up">
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-primary dark:bg-primary-dark text-onPrimary dark:text-onPrimary-dark rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
          >
            开始复习
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="pt-12 text-center animate-fade-in">
           <p className="text-xs text-outline font-medium uppercase tracking-widest mb-2">Designed By</p>
           <a 
             href={AUTHOR_LINK} 
             target="_blank" 
             rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors duration-300 text-sm font-bold text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-outline/5"
           >
             <GraduationCap size={16} />
             {AUTHOR_NAME}
           </a>
        </div>
      </div>
    </div>
  );
};

export default Home;