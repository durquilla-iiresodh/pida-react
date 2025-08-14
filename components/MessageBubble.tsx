import React from 'react';
import type { Message } from '../types';
import { CitationCard } from './CitationCard';
import { WebIcon } from './icons/WebIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface MessageBubbleProps {
    message: Message;
    onFollowUpClick?: (question: string) => void;
    isLoading?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFollowUpClick, isLoading }) => {
    const isModel = message.role === 'model';
    
    return (
        <div className={`flex ${isModel ? '' : 'justify-end'}`}>
            <div className={`flex flex-col max-w-2xl ${isModel ? 'items-start' : 'items-end'}`}>
                <div className={`p-4 rounded-lg ${isModel ? 'bg-gray-100 text-main-blue' : 'bg-main-blue text-white'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {isModel && message.groundingSources && message.groundingSources.length > 0 && (
                     <div className="mt-4 w-full">
                        <h3 className="text-lighter-blue font-medium mb-2 flex items-center gap-2 text-sm">
                            <WebIcon className="h-4 w-4 text-lighter-blue/80" />
                            Fuentes Consultadas por la IA
                        </h3>
                        <div className="space-y-2">
                            {message.groundingSources.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 border border-gray-200/80 hover:border-lighter-blue transition-colors text-sm"
                                >
                                    <ExternalLinkIcon className="h-3.5 w-3.5 text-lighter-blue flex-shrink-0" />
                                    <span className="text-main-blue/90 truncate font-medium" title={source.title}>
                                        {source.title || source.uri}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                {isModel && message.citations && message.citations.length > 0 && (
                    <div className="mt-4 w-full pt-4 border-t border-gray-200/80">
                        <h3 className="text-lighter-blue font-medium mb-2">Fuentes y Citaciones</h3>
                        <div className="space-y-3">
                            {message.citations.map((citation, index) => (
                                <CitationCard key={index} citation={citation} />
                            ))}
                        </div>
                    </div>
                )}

                {isModel && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="mt-4 w-full flex justify-end">
                        <div className="flex flex-wrap gap-2 justify-end">
                            {message.followUpQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => onFollowUpClick?.(question)}
                                    disabled={isLoading}
                                    className="bg-main-blue hover:bg-lighter-blue text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};