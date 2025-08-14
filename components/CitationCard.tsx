import React from 'react';
import type { Citation } from '../types';
import { QuoteIcon } from './icons/QuoteIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface CitationCardProps {
  citation: Citation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  return (
    <div className="bg-white border border-gray-200/80 p-4 rounded-lg hover:border-light-blue transition-colors">
        <blockquote className="relative">
          <QuoteIcon className="absolute -top-1 -left-1 h-5 w-5 text-light-blue/60" />
          <p className="text-main-blue/80 italic mb-2 ml-6">"{citation.quote}"</p>
        </blockquote>
      <footer className="text-right text-sm mt-2 flex justify-end items-center gap-2">
        {citation.url ? (
            <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-lighter-blue hover:text-main-blue hover:underline inline-flex items-center gap-1.5 group">
                <span className="font-medium">— {citation.source}</span>
                <ExternalLinkIcon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
        ) : (
            <span className="text-lighter-blue font-medium">— {citation.source}</span>
        )}
      </footer>
    </div>
  );
};