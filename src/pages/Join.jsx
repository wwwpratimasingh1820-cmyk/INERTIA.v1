import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";
import Button from "../components/Button";
import Card from "../components/Card";
import { Users, CheckCircle2, AlertCircle } from "lucide-react";

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

            const { data, error: pError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (pError || !data) {
                setError("Project not found or invite expired.");
            } else {
                setProjectData({ ...data, invitedRole });
            }
            setLoading(false);
        };

        fetchProject();
    }, [projectId, invitedRole]);

    const handleJoin = async () => {
        if (projectData && user) {
            await joinProject(projectData);
            navigate(`/project/${projectData.id}`);
        } else if (!user) {
            navigate("/login");
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-2xl border-zinc-200 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Invalid Invite</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">This invite link is invalid or has expired.</p>
                    </div>
                    <Button onClick={() => navigate("/dashboard")} className="w-full h-12 text-lg">
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
                <div className="w-8 h-8 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="text-white dark:text-zinc-900 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Join Inertia Project</h1>
                    <p className="text-zinc-500">You've been invited to collaborate on:</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-xl font-semibold text-center">{projectData.name}</h2>
                    <div className="mt-2 flex justify-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            {projectData.checkpoints?.length || 0} checkpoints
                        </span>
                        <span className="flex items-center gap-1">
                            <Users size={14} />
                            {projectData.members?.length || 0} members
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button onClick={handleJoin} className="w-full h-12 text-lg">
                        Join Project
                    </Button>
                    <Button onClick={() => navigate("/dashboard")} variant="ghost" className="w-full">
                        Cancel
                    </Button>
                </div>

                <p className="text-xs text-center text-zinc-400">
                    Joining this project will sync it with your account.
                </p>
            </Card>
        </div>
    );
}
