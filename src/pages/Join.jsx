import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";
import Button from "../components/Button";
import Card from "../components/Card";
import { Users, CheckCircle2, AlertCircle, LogIn, UserPlus } from "lucide-react";

export default function Join() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("id");
    const invitedRole = searchParams.get("role") || "member";
    const navigate = useNavigate();
    const { joinProject, user } = useApp();
    const [projectData, setProjectData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) {
            setError("No project ID found in invite link.");
            setLoading(false);
            return;
        }

        const fetchProject = async () => {
            if (!supabase) {
                setError("Database not configured.");
                setLoading(false);
                return;
            }

            try {
                const { data, error: pError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (pError || !data) {
                    setError("Project not found. This link might be invalid, or the project might be strictly private. If you're the creator, check your Supabase RLS policies.");
                } else {
                    setProjectData({ ...data, invitedRole });
                }
            } catch (err) {
                setError("Failed to fetch project details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, invitedRole]);

    const handleJoin = async () => {
        if (projectData && user) {
            const id = await joinProject(projectData);
            if (id) navigate(`/project/${id}`);
        }
    };

    const goToAuth = (path) => {
        const currentUrl = window.location.pathname + window.location.search;
        navigate(`${path}?redirect=${encodeURIComponent(currentUrl)}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-2xl border-zinc-200 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Invalid Invite</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
                    </div>
                    <Button onClick={() => navigate("/dashboard")} className="w-full h-12">
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 space-y-8 shadow-2xl border-zinc-200 dark:border-zinc-800">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="text-white dark:text-zinc-900 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Project Invitation</h1>
                    <p className="text-zinc-500">You've been invited to collaborate on:</p>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center space-y-3">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{projectData.name}</h2>
                    <div className="flex justify-center gap-4 text-xs font-medium text-zinc-500">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
                            <CheckCircle2 size={12} />
                            {projectData.data?.checkpoints?.length || 0} Tasks
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-900 rounded-full shadow-sm capitalize">
                            <Users size={12} />
                            {invitedRole}
                        </span>
                    </div>
                </div>

                {!user ? (
                    <div className="space-y-6">
                        <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                Authentication required to join
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={() => goToAuth("/login")} variant="secondary" className="h-12 gap-2">
                                <LogIn size={18} /> Sign In
                            </Button>
                            <Button onClick={() => goToAuth("/register")} className="h-12 gap-2">
                                <UserPlus size={18} /> Register
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <Button onClick={handleJoin} className="w-full h-12 text-lg shadow-lg">
                            Accept & Join Project
                        </Button>
                        <Button onClick={() => navigate("/dashboard")} variant="ghost" className="w-full text-zinc-500">
                            Decline Invitation
                        </Button>
                    </div>
                )}

                <p className="text-[10px] text-center text-zinc-400 max-w-[200px] mx-auto leading-relaxed">
                    By joining, this project will be synced and managed within your personal dashboard.
                </p>
            </Card>
        </div>
    );
}
