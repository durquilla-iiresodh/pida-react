import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '../types';
import { getExpertResponse } from '../services/geminiService';
import { MessageBubble } from './MessageBubble';
import { SendIcon } from './icons/SendIcon';
import { ThinkingBubble } from './ThinkingBubble';

const initialMessage: Message = {
    id: 'initial-1',
    role: 'model',
    content: '¡Hola! Soy tu asistente experto. ¿En qué puedo ayudarte hoy?',
    citations: []
};

export function ChatInterface(): React.ReactNode {
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const processQuery = useCallback(async (prompt: string) => {
        if (isLoading || !prompt) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
        };
        
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const aiResponseData = await getExpertResponse(prompt);
        
        const aiMessage: Message = {
            id: `model-${Date.now()}`,
            role: 'model',
            content: aiResponseData.answer,
            citations: aiResponseData.citations,
            followUpQuestions: aiResponseData.followUpQuestions,
            groundingSources: aiResponseData.groundingSources,
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    }, [isLoading]);
    
    const handleSend = useCallback(async () => {
        const trimmedInput = input.trim();
        if (trimmedInput === '' || isLoading) return;
        processQuery(trimmedInput);
        setInput('');
    }, [input, isLoading, processQuery]);

    const handleFollowUpClick = useCallback((question: string) => {
        processQuery(question);
    }, [processQuery]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <div className="w-full max-w-4xl flex flex-col">
            <div className="w-full h-[calc(100vh-120px)] max-h-[800px] flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200/80">
                <div className="p-6 border-b border-gray-200/80">
                    <div className="flex items-center gap-3">
                        <span className="h-3 w-3 bg-main-red rounded-full"></span>
                        <h1 className="text-xl font-extrabold text-main-blue">PIDA-AI</h1>
                    </div>
                    <p className="text-lighter-blue font-medium mt-1 text-sm">
                        Asistente experto en derechos humanos potenciado por Inteligencia Artificial Avanzada
                    </p>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {messages.map((msg) => (
                        <MessageBubble 
                            key={msg.id} 
                            message={msg}
                            onFollowUpClick={handleFollowUpClick}
                            isLoading={isLoading}
                        />
                    ))}
                    {isLoading && <ThinkingBubble />}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200/80 bg-white rounded-b-xl">
                    <div className="relative flex items-center">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe aquí tu pregunta..."
                            className="w-full bg-gray-100 text-main-blue placeholder-gray-500 rounded-lg p-3 pr-20 resize-none focus:outline-none focus:ring-2 focus:ring-main-blue/50 transition-all border border-transparent focus:border-main-blue/70 disabled:opacity-50 max-h-32"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || input.trim() === ''}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-light-red text-white hover:bg-main-red disabled:bg-light-red/40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Enviar"
                        >
                            <SendIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <footer className="w-full text-center py-4 text-gray-500 text-xs px-4">
                <p>Las respuestas son generadas por una IA y pueden contener imprecisiones. Verifica la información importante. El uso de este chat está sujeto a nuestros términos y condiciones.</p>
            </footer>
        </div>
    );
}