import { useState } from "react";
import { Sparkles, Check, X, AlertTriangle, Loader2, MessageSquare, Info } from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import { useApp } from "../context/AppContext";
import { sendAIMessage } from "../utils/aiProviders";
import clsx from "clsx";

export default function AISuggestions({ project, onApplySuggestion }) {
    const { aiConfig } = useApp();
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateSuggestions = async (type = "review") => {
        if (!aiConfig.apiKey || !aiConfig.isValidated) {
            setError("Please configure and TEST your API key in Settings first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const contextText = `
Project: ${project.name}
Checkpoints:
${project.checkpoints.map(cp => `- ${cp.title}: ${cp.description || "No description"} (Cost: ${cp.cost}, Time: ${cp.days} days)`).join("\n")}
Deadline: ${project.submissionRawDate || "Not set"}
            `.trim();

            const prompts = {
                review: "Review this project plan. Find missing steps or risks.",
                optimize: "Suggest how to optimize the timeline or reduce complexity.",
                budget: "Analyze budget risks and suggests where to save costs."
            };

            const prompt = `
Context:
${contextText}

Request: ${prompts[type]}

Instructions:
1. Provide exactly 3 concise bullet points.
2. Format each point as a short action item.
3. Be specific to the project data.
4. Do NOT use markdown code blocks.
5. Tone: Calm and premium.
            `.trim();

            const response = await sendAIMessage(prompt, aiConfig);
            // Parse bullets
            const points = response.split("\n")
                .filter(line => line.trim().startsWith("-") || line.trim().startsWith("•") || /^\d\./.test(line.trim()))
                .map(line => line.replace(/^[-•\d.]\s*/, "").trim())
                .slice(0, 3);

            // If parsing fails, just take first 3 lines
            const finalPoints = points.length > 0 ? points : response.split("\n").filter(l => l.trim()).slice(0, 3);

            setSuggestions(finalPoints.map((text, idx) => ({ id: `${type}-${idx}-${Date.now()}`, text, type })));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const runSummary = async () => {
        if (!project.messages || project.messages.length === 0) {
            setError("No messages to summarize yet.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const msgHistory = project.messages.map(m => `${m.senderName}: ${m.text}`).join("\n");
            const prompt = `
Summarize this project message board history:
${msgHistory}

Format:
- Key Decisions
- Pending Questions
- Action Items

Be extremely concise.
            `.trim();

            const response = await sendAIMessage(prompt, aiConfig);
            setSuggestions([{ id: "summary-" + Date.now(), text: response, type: "summary" }]);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generateSuggestions("review")}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <Sparkles size={14} /> Review Plan
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generateSuggestions("optimize")}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <Info size={14} /> Optimize Timeline
                </Button>
                {project.type === "group" && project.messages?.length > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={runSummary}
                        disabled={isLoading}
                        className="gap-2 text-zinc-500"
                    >
                        <MessageSquare size={14} /> Summarize Chat
                    </Button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl text-xs border border-red-100 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading && Array(1).fill(0).map((_, i) => (
                    <Card key={i} className="animate-pulse bg-zinc-50 dark:bg-zinc-800/50 border-none p-6 space-y-3">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                    </Card>
                ))}

                {!isLoading && suggestions.map((s) => (
                    <Card key={s.id} className="bg-white dark:bg-zinc-900 shadow-xl border-zinc-100 dark:border-zinc-800 p-6 space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">AI Insight</span>
                        </div>

                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                            {s.type === "summary" ? s.text : `• ${s.text}`}
                        </div>

                        <div className="flex gap-2 pt-2">
                            {s.type !== "summary" && (
                                <Button
                                    size="sm"
                                    className="flex-1 gap-2"
                                    onClick={() => {
                                        onApplySuggestion(s.text);
                                        setSuggestions(prev => prev.filter(item => item.id !== s.id));
                                    }}
                                >
                                    <Check size={14} /> Apply
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="px-3"
                                onClick={() => setSuggestions(prev => prev.filter(item => item.id !== s.id))}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    <strong>AI Safety Warning:</strong> AI uses your personal API key stored in your browser. Keys are visible in network requests. Do not use shared devices. AI never auto-edits plans; you must manually "Apply" suggestions.
                </p>
            </div>
        </div>
    );
}
