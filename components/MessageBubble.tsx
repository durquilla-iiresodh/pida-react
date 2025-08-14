import React from 'react';
import type { Message } from '../types';
import { CitationCard } from './CitationCard';
import { WebIcon } from './icons/WebIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
    message: Message;
    onFollowUpClick?: (question: string) => void;
    isLoading?: boolean;
}

const renderMarkdown = (content: string) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3 border-b border-gray-200 pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold my-2" {...props} />,
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 pl-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 pl-4" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
                code: ({node, inline, ...props}) => inline
                    ? <code className="bg-gray-200 rounded-sm px-1 py-0.5 font-mono text-sm" {...props} />
                    : <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto my-4"><code {...props} /></pre>,
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-lighter-blue hover:underline" />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFollowUpClick, isLoading }) => {
    const isModel = message.role === 'model';
    
    return (
        <div className={`flex ${isModel ? '' : 'justify-end'}`}>
            <div className={`flex flex-col max-w-2xl ${isModel ? 'items-start' : 'items-end'}`}>
                <div className={`p-4 rounded-lg w-full ${isModel ? 'bg-gray-100 text-main-blue' : 'bg-main-blue text-white'}`}>
                    {isModel ? renderMarkdown(message.content) : <p className="whitespace-pre-wrap">{message.content}</p>}
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
                        <h3 className="text-lighter-blue font-bold mb-2 text-lg">Fuentes y Jurisprudencia</h3>
                        <div className="space-y-3">
                            {message.citations.map((citation, index) => (
                                <CitationCard key={index} citation={citation} />
                            ))}
                        </div>
                    </div>
                )}

                {isModel && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                     <div className="mt-4 w-full">
                         <h3 className="text-lighter-blue font-bold mb-3 text-lg">Preguntas de Seguimiento</h3>
                        <div className="flex flex-wrap gap-2 justify-start">
                            {message.followUpQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => onFollowUpClick?.(question)}
                                    disabled={isLoading}
                                    className="bg-light-blue/20 border border-light-blue/50 text-main-blue hover:bg-light-blue/40 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
