import React, { useState } from 'react';
import { Lesson } from '../types';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

interface Props {
  lesson: Lesson;
}

// Helper to format text with line breaks for numbered items and semicolons
// Now supports "Recite Mode" (Masking)
const FormatAnswer: React.FC<{ text: string; isReciteMode: boolean }> = ({ text, isReciteMode }) => {
  // Regex to split by:
  // 1. Lookahead for circled numbers ①-⑩ (split before them)
  // 2. Lookbehind for semicolons ； or ; (split after them)
  const parts = text.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])|(?<=[；;])/g).filter(p => p && p.trim());

  return (
    <div className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
      {parts.map((part, index) => (
        <MaskablePart key={index} text={part.trim()} isReciteMode={isReciteMode} isLast={index === parts.length - 1} />
      ))}
    </div>
  );
};

const MaskablePart: React.FC<{ text: string; isReciteMode: boolean; isLast: boolean }> = ({ text, isReciteMode, isLast }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset revealed state when mode changes back to normal
  React.useEffect(() => {
    if (!isReciteMode) setIsRevealed(false);
  }, [isReciteMode]);

  if (!isReciteMode) {
    return <div className={!isLast ? "mb-1.5" : ""}>{text}</div>;
  }

  return (
    <div 
      onClick={() => setIsRevealed(!isRevealed)}
      className={`
        ${!isLast ? "mb-2" : ""} 
        cursor-pointer transition-all duration-200 select-none
        ${isRevealed 
          ? 'text-gray-700 dark:text-gray-300' 
          : 'bg-gray-200 dark:bg-gray-700 text-transparent rounded px-2 hover:bg-primary/20 dark:hover:bg-primary/20'}
      `}
      title={isRevealed ? "点击隐藏" : "点击查看答案"}
    >
      {/* Ensure text takes up space even when transparent */}
      {isRevealed ? text : (
        <span className="opacity-0">{text}</span>
      )}
      {!isRevealed && (
         <span className="absolute left-0 top-0 w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold pointer-events-none">
           点击查看
         </span>
      )}
    </div>
  );
};

const ReviewMode: React.FC<Props> = ({ lesson }) => {
  const [isReciteMode, setIsReciteMode] = useState(false);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="bg-surfaceContainer/50 dark:bg-surfaceContainer-dark/30 p-8 rounded-[3rem] border border-outline/10 transition-colors duration-300 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <div className="text-xs font-bold text-primary/80 dark:text-primary-dark/80 uppercase tracking-widest mb-2">{lesson.unit}</div>
              <h2 className="text-3xl font-bold text-primary dark:text-primary-dark transition-colors duration-300">{lesson.title}</h2>
            </div>
            
            <button
              onClick={() => setIsReciteMode(!isReciteMode)}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 shadow-sm
                ${isReciteMode 
                  ? 'bg-primary text-onPrimary ring-2 ring-primary ring-offset-2 ring-offset-surface dark:ring-offset-surface-dark' 
                  : 'bg-surface dark:bg-gray-800 text-outline hover:text-primary hover:bg-white dark:hover:bg-gray-700'}
              `}
            >
              {isReciteMode ? <EyeOff size={20} /> : <Eye size={20} />}
              <span>{isReciteMode ? '背诵模式 (已开启)' : '背诵模式 (点击开启)'}</span>
            </button>
          </div>
          <p className="text-sm text-outline dark:text-gray-400 transition-colors duration-300 flex items-center gap-2">
            {isReciteMode ? <Sparkles size={14} className="text-yellow-500"/> : null}
            {isReciteMode ? "答案已隐藏，点击灰色色块查看内容，再次点击可隐藏。" : `复习提纲 • 共 ${lesson.qa.length} 个考点`}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {lesson.qa.map((item, index) => (
          <div 
            key={item.id} 
            className="group bg-surface dark:bg-surfaceContainer-dark p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 border border-outline/10 hover:border-primary/30"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-5">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primaryContainer dark:bg-primaryContainer-dark text-onPrimaryContainer dark:text-blue-100 font-bold text-lg transition-colors duration-300">
                {index + 1}
              </span>
              <div className="space-y-4 w-full">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug transition-colors duration-300">
                  {item.question}
                </h3>
                <div className={`relative overflow-hidden rounded-[1.5rem] p-6 transition-all duration-300 ${isReciteMode ? 'bg-surfaceContainer/50 dark:bg-gray-800/30' : 'bg-surfaceContainer dark:bg-gray-800/50'}`}>
                   <FormatAnswer text={item.answer} isReciteMode={isReciteMode} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewMode;