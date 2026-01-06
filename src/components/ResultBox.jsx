import { useState } from "react";
import { Trophy, Link as LinkIcon, Plus, Send, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import Input from "./Input";
import clsx from "clsx";

export default function ResultBox({ project, userRole, userId, onSubmitResult }) {
    const [text, setText] = useState("");
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(!!project.results?.[userId]);

    const handleAddLink = () => {
        if (!newLink) return;
        setLinks([...links, newLink]);
        setNewLink("");
    };

    const handleSubmit = () => {
        if (!text && links.length === 0) return;
        onSubmitResult({ text, links });
        setIsSubmitted(true);
    };

    const isAdmin = userRole === "admin";

    return (
        <Card className="border-2 border-zinc-900 dark:border-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 dark:bg-black/10 rounded-2xl">
                        <Trophy size={32} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Delivery Day</h2>
                        <p className="text-xs opacity-70 font-medium">Finalize and submit your results below.</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Admin View: Show all results */}
                {isAdmin && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Team Deliverables</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.members.map(m => {
                                const result = project.results?.[m.id];
                                return (
                                    <div key={m.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-zinc-900 dark:text-zinc-50">{m.name}</span>
                                            {result ? (
                                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">Delivered</span>
                                            ) : (
                                                <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase">Pending</span>
                                            )}
                                        </div>
                                        {result ? (
                                            <div className="space-y-2">
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">"{result.text}"</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {result.links?.map((l, i) => (
                                                        <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate max-w-[150px]">{l}</a>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-zinc-400">No submission yet.</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Member View: My Submission */}
                {!isSubmitted && userRole !== 'observer' ? (
                    <div className="space-y-6 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">Completion Notes</label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What did you achieve? Any blockers solved?"
                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-500 outline-none h-32"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">Delivery Links</label>
                            <div className="flex gap-2">
                                <Input
                                    value={newLink}
                                    onChange={(e) => setNewLink(e.target.value)}
                                    placeholder="Paste URL (Vercel, GitHub, Figma...)"
                                    className="flex-1"
                                />
                                <Button onClick={handleAddLink} variant="secondary" size="icon">
                                    <Plus size={20} />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {links.map((l, i) => (
                                    <div key={i} className="px-3 py-1 bg-white dark:bg-zinc-900 rounded-full text-xs border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                        <LinkIcon size={12} />
                                        <span className="truncate max-w-[150px]">{l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl gap-2 font-bold text-lg">
                            <Send size={20} />
                            Deliver My Contribution
                        </Button>
                    </div>
                ) : (
                    userRole !== 'observer' && (
                        <div className="p-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-2xl font-bold">Contribution Delivered!</h3>
                            <p className="text-zinc-500">Your work is now official. The project is locked for archive.</p>
                        </div>
                    )
                )}

                {userRole === 'observer' && (
                    <div className="p-12 text-center text-zinc-500 italic">
                        The project has reached its delivery phase.
                    </div>
                )}
            </div>
        </Card>
    );
}
