import React from 'react';

export const ThinkingBubble: React.FC = () => {
  return (
    <div className="flex">
        <div className="flex flex-col max-w-2xl items-start">
            <div className="p-4 rounded-lg bg-gray-100">
                <div className="flex items-center justify-center space-x-1.5">
                    <span className="h-2 w-2 bg-main-blue rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-main-blue rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-main-blue rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    </div>
  );
};
