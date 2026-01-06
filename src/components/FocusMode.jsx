import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Save, CheckCircle2, Link as LinkIcon, ExternalLink } from "lucide-react";
import Button from "./Button";
import clsx from "clsx";

export default function FocusMode({ project, checkpoint, onExit, onUpdateCheckpoint }) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [notes, setNotes] = useState(checkpoint.notes || "");
    const notesRef = useRef(null);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play sound or notify?
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSaveNotes = () => {
        onUpdateCheckpoint({ notes });
    };

    const handleToggleComplete = () => {
        onUpdateCheckpoint({ completed: !checkpoint.completed });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto"
        >
            <div className="absolute top-6 right-6 flex gap-4">
                <Button variant="ghost" size="icon" onClick={onExit} className="rounded-full">
                    <X size={24} />
                </Button>
            </div>

            <div className="w-full max-w-3xl space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-xs">Currently Focusing On</p>
                    <h1 className={clsx(
                        "text-4xl md:text-6xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight",
                        checkpoint.completed && "line-through opacity-50"
                    )}>
                        {checkpoint.title}
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto italic">{checkpoint.description || "No description provided."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Timer Section */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center space-y-8">
                        <div className="text-7xl md:text-8xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-zinc-50">
                            {formatTime(timeLeft)}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-lg"
                            >
                                {isActive ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                            </button>
                            <button
                                onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }}
                                className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-transform hover:rotate-180 active:scale-95"
                            >
                                <RotateCcw size={28} />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            {[15, 25, 45].map(m => (
                                <button
                                    key={m}
                                    onClick={() => { setIsActive(false); setTimeLeft(m * 60); }}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                        timeLeft === m * 60
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                                    )}
                                >
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Meta Section */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <LinkIcon size={14} />
                                Quick Access
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {checkpoint.links?.length > 0 ? checkpoint.links.map(link => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:shadow-md transition-all"
                                    >
                                        {link.label}
                                        <ExternalLink size={12} className="opacity-50" />
                                    </a>
                                )) : <p className="text-sm text-zinc-400 italic">No links attached.</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Notes</h3>
                                <button
                                    onClick={handleSaveNotes}
                                    className="text-[10px] uppercase font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    <Save size={10} /> Auto-saves on Exit
                                </button>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onBlur={handleSaveNotes}
                                placeholder="Thoughts, findings, scratchpad..."
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 min-h-[150px] text-sm focus:ring-1 focus:ring-zinc-500 outline-none resize-none shadow-inner"
                            />
                        </div>

                        <Button
                            variant={checkpoint.completed ? "ghost" : "primary"}
                            className="w-full h-14 rounded-2xl gap-2 font-bold text-lg"
                            onClick={handleToggleComplete}
                        >
                            <CheckCircle2 size={24} />
                            {checkpoint.completed ? "Completed" : "Mark as Done"}
                        </Button>
                    </div>
                </div>

                <div className="text-center pt-12">
                    <button onClick={onExit} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium">
                        Exit Focus Mode
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
