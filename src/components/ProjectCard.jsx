import { useNavigate } from "react-router-dom";
import Card from "./Card";
import ProgressBar from "./ProgressBar";
import { calculateProjectTotal, calculateProgress, formatCurrency } from "../utils/calculateTotal";
import { ArrowRight, CheckCircle2, DollarSign } from "lucide-react";

export default function ProjectCard({ project }) {
    const navigate = useNavigate();
    const totalCost = calculateProjectTotal(project.checkpoints);
    const progress = calculateProgress(project.checkpoints);
    const checkpointCount = project.checkpoints?.length || 0;
    const completedCount = project.checkpoints?.filter(cp => cp.completed).length || 0;

    return (
        <Card onClick={() => navigate(`/project/${project.id}`)} className="group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1">{project.name}</h3>
                        {project.type === "group" && (
                            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500 rounded-md border border-zinc-200 dark:border-zinc-700">Group</span>
                        )}
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
                    <ArrowRight size={20} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={16} />
                        <span>{completedCount}/{checkpointCount} checkpoints</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-200">
                        <DollarSign size={16} />
                        <span>{formatCurrency(totalCost)}</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-zinc-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                </div>
            </div>
        </Card>
    );
}
