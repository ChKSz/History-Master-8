import React from 'react';
import { Lesson } from '../types';

interface Props {
  lesson: Lesson;
}

// Helper to format text with line breaks for numbered items and semicolons
const FormatAnswer: React.FC<{ text: string }> = ({ text }) => {
  // Regex to split by:
  // 1. Lookahead for circled numbers ①-⑩ (split before them)
  // 2. Lookbehind for semicolons ； or ; (split after them)
  const parts = text.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])|(?<=[；;])/g).filter(p => p && p.trim());

  return (
    <div className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
      {parts.map((part, index) => (
        <div key={index} className={parts.length > 1 ? "mb-1.5" : ""}>
          {part.trim()}
        </div>
      ))}
    </div>
  );
};

const ReviewMode: React.FC<Props> = ({ lesson }) => {
  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="bg-surfaceContainer/50 dark:bg-surfaceContainer-dark/30 p-8 rounded-[3rem] border border-outline/10 transition-colors duration-300">
        <div className="text-xs font-bold text-primary/80 dark:text-primary-dark/80 uppercase tracking-widest mb-2">{lesson.unit}</div>
        <h2 className="text-3xl font-bold text-primary dark:text-primary-dark mb-2 transition-colors duration-300">{lesson.title}</h2>
        <p className="text-sm text-outline dark:text-gray-400 transition-colors duration-300">复习提纲 • 共 {lesson.qa.length} 个考点</p>
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
                <div className="relative overflow-hidden rounded-[1.5rem] bg-surfaceContainer dark:bg-gray-800/50 p-6 transition-colors duration-300">
                   <FormatAnswer text={item.answer} />
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