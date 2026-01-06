import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function DayProgress() {
    const [progress, setProgress] = useState(0);
    const [timeString, setTimeString] = useState("");

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            const total = endOfDay - startOfDay;
            const current = now - startOfDay;
            const percent = (current / total) * 100;

            setProgress(percent);
            setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };

        update();
        const interval = setInterval(update, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Clock size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Day Progress</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{timeString}</span>
            </div>

            <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 1 }}
                    className="absolute inset-y-0 left-0 bg-zinc-900 dark:bg-white"
                />

                {/* Pulse Indicator */}
                <motion.div
                    style={{ left: `${progress}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 dark:bg-white rounded-full border-2 border-white dark:border-zinc-900 shadow-sm"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </div>

            <div className="flex justify-between mt-2">
                <span className="text-[10px] text-zinc-400">00:00</span>
                <span className="text-[10px] font-medium text-zinc-500">{Math.round(progress)}% of the day passed</span>
                <span className="text-[10px] text-zinc-400">23:59</span>
            </div>
        </div>
    );
}
