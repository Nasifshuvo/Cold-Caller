import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="invisible group-hover:visible absolute z-10 px-2 py-1 text-sm text-white bg-gray-900 rounded-md -top-8 left-1/2 transform -translate-x-1/2">
        {content}
      </div>
    </div>
  );
} 