import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function AINudge({ project }) {
    const [nudge, setNudge] = useState(null);

    useEffect(() => {
        const analyze = () => {
            const totalWorkDays = project.checkpoints.reduce((sum, cp) => sum + (Number(cp.days) || 0), 0);
            const totalCost = project.checkpoints.reduce((sum, cp) => sum + (Number(cp.cost) || 0), 0);

            if (project.submissionRawDate) {
                const deadline = new Date(project.submissionRawDate);
                const today = new Date();
                const diffTime = deadline - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    const workloadFactor = totalWorkDays / diffDays;
                    if (workloadFactor > 1.2) {
                        return {
                            type: "warning",
                            icon: <AlertTriangle size={16} />,
                            text: `Unrealistic workload: ~${Math.round(workloadFactor * 8)}h/day needed to finish. Consider reducing scope?`,
                            color: "bg-amber-50 text-amber-900 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/20"
                        };
                    }
                } else if (diffDays <= 0 && project.checkpoints.some(c => !c.completed)) {
                    return {
                        type: "warning",
                        icon: <AlertTriangle size={16} />,
                        text: "Project deadline passed with incomplete tasks. Urgent update needed!",
                        color: "bg-red-50 text-red-900 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20"
                    };
                }
            }

            // Passive advice based on progress
            const completed = project.checkpoints.filter(c => c.completed).length;
            const total = project.checkpoints.length;
            if (total > 3 && completed === 0) {
                return {
                    type: "nudge",
                    icon: <Zap size={16} />,
                    text: "Momentum is key. Try completing one quick checkpoint today!",
                    color: "bg-zinc-900 text-white border-transparent dark:bg-white dark:text-zinc-900"
                };
            }

            if (totalWorkDays > 0 && totalCost > 0) {
                return {
                    type: "insight",
                    icon: <TrendingUp size={16} />,
                    text: `Efficiency tip: Breakdown the task with the most 'Days' to avoid blocks.`,
                    color: "bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20"
                };
            }

            return null;
        };

        const result = analyze();
        setNudge(result);
    }, [project]);

    return (
        <AnimatePresence>
            {nudge && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={clsx(
                        "flex items-center gap-3 p-4 rounded-2xl border shadow-sm",
                        nudge.color
                    )}
                >
                    <div className="shrink-0">{nudge.icon}</div>
                    <p className="text-sm font-medium leading-tight">{nudge.text}</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
