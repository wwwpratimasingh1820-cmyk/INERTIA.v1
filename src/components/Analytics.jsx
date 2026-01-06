import { BarChart2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import Card from "./Card";
import clsx from "clsx";

export default function Analytics({ projects }) {
    if (!projects || projects.length === 0) return null;

    const completed = projects.filter(p => {
        const total = p.checkpoints.length;
        if (total === 0) return false;
        return p.checkpoints.every(c => c.completed);
    }).length;

    const completionRate = Math.round((completed / projects.length) * 100);

    // Estimation accuracy (very basic: compare total days vs checkpoints)
    const totalDays = projects.reduce((sum, p) => sum + p.checkpoints.reduce((s, c) => s + (Number(c.days) || 0), 0), 0);
    const avgDaysPerProject = Math.round(totalDays / projects.length);

    return (
        <Card className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none shadow-xl p-6">
            <div className="flex items-center gap-2 mb-6 opacity-80">
                <BarChart2 size={20} />
                <span className="font-bold uppercase tracking-widest text-xs">Personal Insights</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <p className="text-4xl font-black">{completionRate}%</p>
                    <p className="text-xs uppercase tracking-wider opacity-60 font-medium">Project Success Rate</p>
                    <div className="h-1 bg-white/10 dark:bg-black/10 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${completionRate}%` }} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-emerald-400 mt-1 shrink-0" />
                        <div>
                            <p className="text-sm font-bold">Consistent Executor</p>
                            <p className="text-[11px] opacity-60">You've finished {completed} projects entirely. Keep the streak!</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <AlertCircle size={16} className="text-amber-400 mt-1 shrink-0" />
                        <div>
                            <p className="text-sm font-bold">Estimation Pattern</p>
                            <p className="text-[11px] opacity-60">Average project duration is {avgDaysPerProject} days. Try allocating +15% buffer.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 dark:border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50">
                    <Zap size={10} />
                    Local Privacy Guaranteed
                </div>
            </div>
        </Card>
    );
}
