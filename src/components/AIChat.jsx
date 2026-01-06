import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import { useApp } from "../context/AppContext";
import { AI_PROVIDERS, sendAIMessage } from "../utils/aiProviders";
import clsx from "clsx";

export default function AIChat({ project }) {
    const { aiConfig } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "AI suggestions are optional. Nothing is changed without your approval. How can I help with this project?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!aiConfig.apiKey || !aiConfig.isValidated) {
            setError("Please configure and TEST your API key in Settings first.");
            return;
        }

        const userMessage = { role: "user", content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const contextText = `
Project: ${project.name}
Checkpoints:
${project.checkpoints.length > 0
                    ? project.checkpoints.map(cp => `- ${cp.title}: ${cp.description || "No description"} (Cost: ${cp.cost}, Time: ${cp.days} days)`).join("\n")
                    : "No checkpoints added yet."}
            `.trim();

            const prompt = `
Context:
${contextText}

Question: ${userMessage.content}

Instructions:
1. Provide a concise, helpful response.
2. Suggest 2-3 specific improvements or missing steps if applicable.
3. Keep the tone calm and professional.
4. Do not use markdown code blocks for the whole response.
            `.trim();

            const responseContent = await sendAIMessage(prompt, aiConfig);
            setMessages(prev => [...prev, { role: "assistant", content: responseContent }]);
        } catch (err) {
            setError(`${err.message}. Hint: Ensure your API key is validated in Settings.`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-full shadow-2xl hover:scale-105 transition-transform z-40 group"
            >
                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-[400px] z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="flex flex-col h-[500px] shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                        <Sparkles size={18} />
                        Planning Assistant
                    </div>
                    <button onClick={() => setIsOpen(false)} className="hover:opacity-70 transition-opacity">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
                    {messages.map((m, i) => (
                        <div key={i} className={clsx(
                            "max-w-[85%] p-3 rounded-2xl text-sm",
                            m.role === "assistant"
                                ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 self-start border border-zinc-100 dark:border-zinc-700/50"
                                : "bg-zinc-900 text-white self-end ml-auto"
                        )}>
                            {m.content}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs italic p-2 animate-pulse">
                            Thinking...
                        </div>
                    )}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs border border-red-100 dark:border-red-900/20">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about your project..."
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-zinc-500"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-400 text-center">
                        Suggestions only. Assistant does not change your data.
                    </p>
                </form>
            </Card>
        </div>
    );
}
