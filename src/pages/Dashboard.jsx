import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import ProjectCard from "../components/ProjectCard";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import { Plus, FolderPlus, Sparkles, Loader2, Check, X, Calendar, DollarSign, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sendAIMessage } from "../utils/aiProviders";
import clsx from "clsx";

export default function Dashboard() {
    const { projects, addProject, joinProject, aiConfig, addCheckpoint, updateProject } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectType, setProjectType] = useState("solo");
    const [step, setStep] = useState(1); // 1: Input, 2: Review
    const [intent, setIntent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewProject, setPreviewProject] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Check for invite link on mount? 
    // Actually, React Router handles the route. I'll need a new route for joining.
    // But for now, let's keep it simple. If I land on dashboard with a hash, maybe?
    // Better to use a dedicated /join route or handle it in App.jsx.
    // I will add a /join route later.

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!intent.trim()) return;

        if (!aiConfig.apiKey || !aiConfig.isValidated) {
            // Fallback: Just create a project with the intent as name
            const id = addProject(intent.split("\n")[0].substring(0, 40), projectType);
            setIsModalOpen(false);
            navigate(`/project/${id}`);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const prompt = `
Generate a structured project plan for: "${intent}"

Instructions:
1. Provide a concise Project Name.
2. Provide 3-5 checkpoints.
3. For each checkpoint, provide: Title, Description, Estimated Cost (USD), and Estimated Days.
4. Format your response exactly as JSON:
{
  "name": "Project Name",
  "checkpoints": [
    { "title": "...", "description": "...", "cost": 0, "days": 0 }
  ]
}
            `.trim();

            const response = await sendAIMessage(prompt, aiConfig);
            // Clean response for JSON parsing
            const cleanJson = response.match(/\{[\s\S]*\}/)?.[0] || response;
            const parsed = JSON.parse(cleanJson);

            setPreviewProject({
                ...parsed,
                type: projectType,
                checkpoints: (parsed.checkpoints || []).map(cp => ({ ...cp, id: generateId() }))
            });
            setStep(2);
        } catch (err) {
            console.error(err);
            setError("Failed to generate plan. Please check your AI settings or try a simple name.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!previewProject) return;
        const id = await addProject(previewProject.name, previewProject.type);
        if (!id) return;

        previewProject.checkpoints.forEach(cp => {
            addCheckpoint(id, cp);
        });
        setIsModalOpen(false);
        setStep(1);
        setIntent("");
        setPreviewProject(null);
        navigate(`/project/${id}`);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Projects</h1>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={20} />
                    New Project
                </Button>
            </div>


            {projects.length === 0 ? (
                <div className="py-20 text-center space-y-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700">
                        <FolderPlus size={64} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-medium text-zinc-900 dark:text-white">No projects yet</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">Start planning your next idea.</p>
                    </div>
                    <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Create Project</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}


            {/* Create Project Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setStep(1); }}
                title={step === 1 ? "Start New Project" : "Review AI-Generated Plan"}
            >
                {step === 1 ? (
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                                What do you want to finish, and by when?
                            </label>
                            <textarea
                                value={intent}
                                onChange={(e) => setIntent(e.target.value)}
                                autoFocus
                                required
                                placeholder="e.g. Build a landing page for my app by Friday, budget around $200"
                                className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-500 placeholder-zinc-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                                Project Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setProjectType("solo")}
                                    className={clsx(
                                        "p-4 text-left border rounded-2xl transition-all",
                                        projectType === "solo"
                                            ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Solo</p>
                                    <p className="text-xs text-zinc-500">Personal planning</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProjectType("group")}
                                    className={clsx(
                                        "p-4 text-left border rounded-2xl transition-all",
                                        projectType === "group"
                                            ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Group</p>
                                    <p className="text-xs text-zinc-500">Collaborate with others</p>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                                {error}
                            </p>
                        )}

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    const id = addProject(intent.split("\n")[0].substring(0, 40) || "New Project", projectType);
                                    setIsModalOpen(false);
                                    setIntent("");
                                    navigate(`/project/${id}`);
                                }}
                            >
                                Create Manually
                            </Button>
                            <Button type="submit" disabled={isGenerating} className="gap-2 min-w-[140px]">
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Plan
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                            <p className="text-xs font-bold uppercase text-zinc-400 mb-1">Project Name</p>
                            <input
                                value={previewProject?.name || ""}
                                onChange={(e) => setPreviewProject(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-xl font-bold focus:ring-0"
                            />
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase text-zinc-400">Generated Checkpoints</p>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                {previewProject?.checkpoints.map((cp, idx) => (
                                    <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl space-y-1">
                                        <p className="text-sm font-bold">{cp.title}</p>
                                        <p className="text-xs text-zinc-500 line-clamp-1">{cp.description}</p>
                                        <div className="flex gap-4 pt-1 opacity-60">
                                            <span className="text-[10px] flex items-center gap-1"><DollarSign size={10} />{cp.cost}</span>
                                            <span className="text-[10px] flex items-center gap-1"><Clock size={10} />{cp.days}d</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button onClick={handleSave} className="gap-2 bg-zinc-900 dark:bg-white">
                                <Check size={18} />
                                Create Project
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
