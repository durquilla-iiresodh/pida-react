import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '../types';
import { getExpertResponse } from '../services/geminiService';
import { MessageBubble } from './MessageBubble';
import { SendIcon } from './icons/SendIcon';
import { ThinkingBubble } from './ThinkingBubble';
import { extractTextFromFile } from '../utils/fileParser';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';
import { TrashIcon } from './icons/TrashIcon';

const initialMessage: Message = {
    id: 'initial-1',
    role: 'model',
    content: '¡Hola! Soy tu asistente experto. Puedes hacerme una pregunta o adjuntar hasta 3 documentos (PDF, DOCX) para analizarlos. ¿En qué puedo ayudarte hoy?',
    citations: []
};

export function ChatInterface(): React.ReactNode {
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [fileContexts, setFileContexts] = useState<{name: string, text: string}[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        if (files.length + selectedFiles.length > 3) {
            setParseError("No se pueden subir más de 3 documentos.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setIsParsing(true);
        setParseError(null);
        
        const newFiles: File[] = Array.from(selectedFiles);
        const newFileContexts: { name: string; text: string }[] = [];
        let hadError = false;

        for (const file of newFiles) {
            try {
                const text = await extractTextFromFile(file);
                newFileContexts.push({ name: file.name, text });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error al procesar el archivo.";
                console.error(`File parsing error for ${file.name}:`, error);
                setParseError(`Error con ${file.name}: ${errorMessage}`);
                hadError = true;
                break; // Stop processing further files if one fails
            }
        }

        if (!hadError) {
            setFiles(prev => [...prev, ...newFiles]);
            setFileContexts(prev => [...prev, ...newFileContexts]);
        }
        
        setIsParsing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [files]);


    const handleRemoveFile = useCallback((fileToRemove: File) => {
        setFiles(prev => prev.filter(f => f !== fileToRemove));
        setFileContexts(prev => prev.filter(fc => fc.name !== fileToRemove.name));
        setParseError(null);
    }, []);

    const processQuery = useCallback(async (prompt: string) => {
        if (isLoading || !prompt) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
        };
        
        const aiMessageId = `model-${Date.now()}`;
        const aiMessage: Message = {
            id: aiMessageId,
            role: 'model',
            content: '',
            citations: [],
            followUpQuestions: [],
            groundingSources: [],
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);
        setIsLoading(true);

        const handleStreamUpdate = (chunk: string) => {
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId ? { ...msg, content: msg.content + chunk } : msg
            ));
        };

        try {
            const combinedFileContext = fileContexts.length > 0
                ? fileContexts.map(fc => `--- INICIO DOCUMENTO: ${fc.name} ---\n\n${fc.text}\n\n--- FIN DOCUMENTO: ${fc.name} ---`).join('\n\n')
                : null;

            const finalAiResponse = await getExpertResponse(prompt, combinedFileContext, handleStreamUpdate);
            
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId ? { ...msg, ...finalAiResponse } : msg
            ));

        } catch (error) {
            console.error("Streaming failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            const displayError = `Lo siento, ha ocurrido un error al procesar su solicitud. Detalles: ${errorMessage}`;
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId ? { ...msg, content: displayError } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, fileContexts]);
    
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
                    <div className="mb-2 space-y-2">
                         {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-light-blue/20 p-2 rounded-lg border border-light-blue/50 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="h-5 w-5 text-lighter-blue flex-shrink-0" />
                                    <span className="truncate font-medium text-main-blue" title={file.name}>{file.name}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveFile(file)}
                                    className="p-1 rounded-full hover:bg-main-red/20 text-main-red"
                                    aria-label={`Quitar archivo ${file.name}`}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {isParsing && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 text-sm font-medium text-lighter-blue">
                                <div className="animate-spin h-4 w-4 border-2 border-main-blue border-t-transparent rounded-full"></div>
                                <span>Analizando documento(s)...</span>
                            </div>
                        )}
                        {parseError && (
                            <div className="p-2 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm flex items-center justify-between">
                               <span>{parseError}</span>
                               <button onClick={() => setParseError(null)} className="font-bold text-lg leading-none">&times;</button>
                            </div>
                        )}
                    </div>
                    <div className="relative flex items-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isParsing || files.length >= 3}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-main-blue hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Adjuntar archivo"
                        >
                            <UploadIcon className="h-5 w-5" />
                        </button>
                         <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            disabled={isLoading || isParsing || files.length >= 3}
                        />
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe aquí tu pregunta..."
                            className="w-full bg-gray-100 text-main-blue placeholder-gray-500 rounded-lg p-3 pl-14 pr-20 resize-none focus:outline-none focus:ring-2 focus:ring-main-blue/50 transition-all border border-transparent focus:border-main-blue/70 disabled:opacity-50 max-h-32"
                            rows={1}
                            disabled={isLoading || isParsing}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || isParsing || input.trim() === ''}
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