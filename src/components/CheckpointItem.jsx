import { useRef, useState } from "react";
import { Trash2, Link as LinkIcon, Plus, X, User, Github, Database, Layout, FileText, ExternalLink, Target } from "lucide-react";
import Button from "./Button";
import { generateId } from "../utils/generateId";
import { motion } from "framer-motion";
import clsx from "clsx";

const getPlatform = (url) => {
    try {
        const host = new URL(url).hostname.toLowerCase();
        if (host.includes("github.com")) return { name: "GitHub", icon: <Github size={12} />, color: "text-zinc-900 dark:text-white" };
        if (host.includes("supabase.com")) return { name: "Supabase", icon: <Database size={12} />, color: "text-emerald-500" };
        if (host.includes("figma.com")) return { name: "Figma", icon: <Layout size={12} />, color: "text-purple-500" };
        if (host.includes("docs.google.com")) return { name: "Google Docs", icon: <FileText size={12} />, color: "text-blue-500" };
        return { name: "Link", icon: <LinkIcon size={12} />, color: "text-zinc-500" };
    } catch (e) {
        return { name: "Link", icon: <LinkIcon size={12} />, color: "text-zinc-500" };
    }
};

export default function CheckpointItem({ checkpoint, onUpdate, onDelete, isPriority, hasPriority }) {
    const titleRef = useRef(null);
    const costRef = useRef(null);
    const daysRef = useRef(null);
    const descRef = useRef(null);

    const handleToggle = () => {
        onUpdate({ completed: !checkpoint.completed });
    };

    const handleBlur = () => {
        onUpdate({
            title: titleRef.current.value,
            cost: Number(costRef.current.value),
            days: Number(daysRef.current.value),
            description: descRef.current.value,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.target.blur();
        }
    };

    const addLink = () => {
        let url = window.prompt("Enter link URL (e.g., https://github.com/...)");
        if (!url) return;

        // Basic validation & formatting
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        try {
            new URL(url); // Test if valid URL
        } catch (e) {
            alert("Invalid URL format.");
            return;
        }

        let label = window.prompt("Enter link label (e.g., GitHub)");
        if (!label) {
            try {
                label = new URL(url).hostname.replace("www.", "");
            } catch (e) {
                label = "Link";
            }
        }

        const newLinks = [...(checkpoint.links || []), { id: generateId(), label, url }];
        onUpdate({ links: newLinks });
    };

    const removeLink = (linkId) => {
        if (isObserver) return;
        const newLinks = checkpoint.links.filter(l => l.id !== linkId);
        onUpdate({ links: newLinks });
    };

    // props for group logic
    const { members = [], isProjectAdmin, currentUserId, isObserver } = checkpoint.groupProps || {};
    const assignedMember = members.find(m => m.id === checkpoint.assignedTo);

    // Member only views their assigned checkpoints in "Personal View"
    // This component will be used in both Admin (all) and Member (filtered) views.
    // If we're in assigned-only mode, we might not need the dropdown.

    const handleAssign = (e) => {
        if (isObserver) return;
        onUpdate({ assignedTo: e.target.value || null });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={clsx(
                "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-500",
                isPriority
                    ? "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-xl scale-[1.02] z-10"
                    : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-800",
                checkpoint.completed && "opacity-40 grayscale-[0.5]",
                !isPriority && hasPriority && !checkpoint.completed && "opacity-60"
            )}
        >
            <div className="pt-1 flex flex-col items-center gap-2">
                <input
                    type="checkbox"
                    checked={checkpoint.completed}
                    onChange={handleToggle}
                    disabled={isObserver}
                    className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:bg-zinc-50 dark:focus:ring-white cursor-pointer accent-zinc-900 dark:accent-white disabled:cursor-default disabled:opacity-50"
                />
                {isPriority && !checkpoint.completed && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-0.5 h-4 bg-zinc-200 dark:bg-zinc-700" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 [writing-mode:vertical-lr] rotate-180">Priority</span>
                    </motion.div>
                )}
            </div>

            <div className="flex-1 space-y-1">
                <input
                    ref={titleRef}
                    type="text"
                    defaultValue={checkpoint.title}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isObserver}
                    placeholder="New Checkpoint"
                    className={clsx(
                        "w-full bg-transparent border-none p-0 text-base font-medium focus:ring-0 placeholder-zinc-400 text-zinc-900 dark:text-zinc-100",
                        checkpoint.completed && "line-through text-zinc-500",
                        isObserver && "disabled:cursor-default"
                    )}
                />
                <textarea
                    ref={descRef}
                    defaultValue={checkpoint.description}
                    onBlur={handleBlur}
                    disabled={isObserver}
                    placeholder="Briefly describe the goal..."
                    rows={1}
                    className="w-full bg-transparent border-none p-0 text-sm text-zinc-600 dark:text-zinc-300 focus:ring-0 placeholder-zinc-400 disabled:cursor-default resize-none overflow-hidden min-h-[1.5em] leading-relaxed whitespace-pre-wrap transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                />

                {/* Links Section */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {checkpoint.links?.map((link) => {
                        const platform = getPlatform(link.url);
                        return (
                            <div key={link.id} className="group/link flex items-center gap-2 pr-1 pl-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs transition-shadow hover:shadow-sm">
                                <div className={clsx("flex items-center gap-1.5 font-medium", platform.color)}>
                                    {platform.icon}
                                    <span className="truncate max-w-[80px]">{link.label}</span>
                                </div>

                                <div className="flex items-center gap-1 border-l border-zinc-100 dark:border-zinc-800 pl-1">
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 rounded transition-colors"
                                        title="Open in new tab"
                                    >
                                        <span className="text-[10px] font-bold uppercase">Open</span>
                                        <ExternalLink size={10} />
                                    </a>
                                    <button
                                        onClick={() => removeLink(link.id)}
                                        className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {!isObserver && (
                        <button
                            onClick={addLink}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <Plus size={12} />
                            Add Link
                        </button>
                    )}
                </div>

                {/* Assignment (Admin only dropdown) */}
                {isProjectAdmin && members.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                        <User size={12} className="text-zinc-400" />
                        <select
                            value={checkpoint.assignedTo || ""}
                            onChange={handleAssign}
                            className="text-xs bg-transparent border-none p-0 text-zinc-500 focus:ring-0 cursor-pointer hover:text-zinc-900 dark:hover:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900 [&>option]:text-zinc-900 dark:[&>option]:text-zinc-100"
                        >
                            <option value="">Unassigned</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                                    {m.name} {m.id === currentUserId ? "(You)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {!isProjectAdmin && assignedMember && (
                    <div className="flex items-center gap-1 pt-1 text-xs text-zinc-400">
                        <User size={12} />
                        <span>Assigned to {assignedMember.name}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <div className="relative group/cost">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-sm transition-colors group-hover/cost:text-zinc-600 dark:group-hover/cost:text-zinc-200">$</span>
                    <input
                        ref={costRef}
                        type="number"
                        defaultValue={checkpoint.cost || ""}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        disabled={isObserver}
                        placeholder="0"
                        className="w-16 pl-5 pr-2 py-1 bg-zinc-50/50 dark:bg-zinc-900/50 text-right text-sm text-zinc-600 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-0 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-default"
                    />
                </div>
                <div className="relative group/days">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-sm transition-colors group-hover/days:text-zinc-600 dark:group-hover/days:text-zinc-200">d</span>
                    <input
                        ref={daysRef}
                        type="number"
                        defaultValue={checkpoint.days || ""}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        disabled={isObserver}
                        placeholder="0"
                        className="w-16 pl-5 pr-2 py-1 bg-zinc-50/50 dark:bg-zinc-900/50 text-right text-sm text-zinc-600 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-0 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-default"
                        title="Days"
                    />
                </div>
            </div>

            {!isObserver && (
                <button
                    onClick={() => onUpdate({ isFocusing: true })}
                    className="p-1.5 text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Focus on this task"
                >
                    <Target size={16} />
                </button>
            )}

            {isProjectAdmin && (
                <button
                    onClick={onDelete}
                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete checkpoint"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </motion.div>
    );
}
