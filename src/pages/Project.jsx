import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import CheckpointItem from "../components/CheckpointItem";
import AISuggestions from "../components/AISuggestions";
import FocusMode from "../components/FocusMode";
import AINudge from "../components/AINudge";
import ResultBox from "../components/ResultBox";
import Chat from "../components/Chat";
import Button from "../components/Button";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { calculateProjectTotal, calculateProjectDays, calculateProgress, formatCurrency } from "../utils/calculateTotal";
import { ArrowLeft, Plus, Trash2, DollarSign, CheckCircle2, UserPlus, Share2, Clipboard, Users, Calendar, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { compressToEncodedURIComponent } from "lz-string";
import { generateId } from "../utils/generateId";
import clsx from "clsx";

export default function Project() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        projects, userId, updateProject, deleteProject,
        addCheckpoint, updateCheckpoint, deleteCheckpoint,
        promoteToAdmin, demoteFromAdmin, removeMember, approveMember
    } = useApp();

    const project = projects.find((p) => p.id === id);
    const [name, setName] = useState(project ? project.name : "");
    const [viewMode, setViewMode] = useState("all");
    const [showChat, setShowChat] = useState(false); // Default to closed

    const members = project?.members || [];
    const checkpoints = project?.checkpoints || [];

    const userInProject = members.find(m => m.user_id === userId);
    const userRole = userInProject?.role || "member";
    const isAdmin = userRole === "admin" || (project?.admin_id && project?.admin_id === userId);
    const isMember = userRole === "member";
    const isObserver = userRole === "observer";
    const isGroup = project?.type === "group";

    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    const isFinalDay = project?.submissionRawDate && new Date(project.submissionRawDate).toDateString() === new Date().toDateString();
    const isDelivered = Object.keys(project?.results || {}).length > 0;

    useEffect(() => {
        if (!project) {
            navigate("/dashboard");
        } else {
            setName(project.name);
            // Default view to personal for members if it's a group project
            if (isGroup && !isAdmin) {
                setViewMode("personal");
            }
        }
    }, [project, navigate, isGroup, isAdmin]);

    if (!project) return null;

    const generateInvite = (role = "member") => {
        const baseUrl = window.location.href.split('/project/')[0];
        const url = `${baseUrl}/invite?id=${project.id}&role=${role}`;
        setShareUrl(url);
        setIsSharing(true);
    };

    const copyInvite = () => {
        navigator.clipboard.writeText(shareUrl);
        alert("Invite link copied to clipboard!");
    };

    const addMember = () => {
        const name = window.prompt("Enter member name:");
        if (!name) return;
        const newMember = { id: generateId(), name, role: "member" };
        updateProject(id, { members: [...members, newMember] });
    };

    const setSubmissionDate = () => {
        const date = window.prompt("Enter submission date (e.g. 2024-12-31):", project.submissionRawDate || "");
        if (date === null) return;
        updateProject(id, { submissionRawDate: date });
    };

    const handleResultSubmit = (text) => {
        const newResults = { ...project.results, [userId]: { text, links: [], submittedAt: new Date().toISOString() } };
        updateProject(id, { results: newResults });
    };

    const handleSendMessage = (message) => {
        const newMessages = [...(project.messages || []), message];
        updateProject(id, { messages: newMessages });
    };

    const handleApplySuggestion = (text) => {
        addCheckpoint(id, {
            title: text.length > 50 ? text.substring(0, 47) + "..." : text,
            description: text,
            cost: 0
        });
    };

    // Filters & Calcs
    const visibleCheckpoints = checkpoints.filter(cp => {
        if (isMember && !isAdmin) return cp.assignedTo === userId; // Force personal for members
        if (viewMode === "personal") return cp.assignedTo === userId;
        return true;
    });

    const totalCost = calculateProjectTotal(visibleCheckpoints);
    const totalDays = calculateProjectDays(checkpoints);

    const priorityCheckpointId = visibleCheckpoints.find(cp => !cp.completed)?.id;
    const progress = calculateProgress(visibleCheckpoints);

    // Group Costs Breakdown
    const memberCosts = members.map(m => {
        const memberCheckpoints = checkpoints.filter(cp => cp.assignedTo === m.user_id);
        return {
            ...m,
            cost: calculateProjectTotal(memberCheckpoints),
            days: calculateProjectDays(memberCheckpoints),
            progress: calculateProgress(memberCheckpoints)
        };
    });

    const handleNameBlur = () => {
        if (name.trim() !== project.name) {
            if (name.trim() === "") {
                setName(project.name); // Revert if empty
            } else {
                updateProject(id, { name: name.trim() });
            }
        }
    };

    const handleAddCheckpoint = () => {
        addCheckpoint(id, {
            title: "New Task",
            description: "",
            cost: 0
        });
    };

    const handleDeleteProject = () => {
        deleteProject(id);
    };

    const focusedCheckpoint = checkpoints.find(cp => cp.isFocusing);

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 min-h-screen">
            <div className="flex-1 space-y-8">
                <AnimatePresence>
                    {focusedCheckpoint && (
                        <FocusMode
                            project={project}
                            checkpoint={focusedCheckpoint}
                            onExit={() => updateCheckpoint(id, focusedCheckpoint.id, { isFocusing: false })}
                            onUpdateCheckpoint={(updates) => updateCheckpoint(id, focusedCheckpoint.id, updates)}
                        />
                    )}
                </AnimatePresence>

                {isObserver && (
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl flex items-center gap-2 text-sm text-zinc-500">
                        <User size={16} />
                        <span>You are an <strong>Observer</strong>. This project is read-only.</span>
                    </div>
                )}

                {isMember && (
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl flex items-center gap-2 text-sm text-zinc-500">
                        <User size={16} />
                        <span>Viewing <strong>Your Tasks</strong> only.</span>
                    </div>
                )}

                {/* AI Nudge System */}
                {!isDelivered && <AINudge project={project} />}

                {/* Delivery Box */}
                {(isFinalDay || isDelivered) && (
                    <ResultBox
                        project={project}
                        userRole={userRole}
                        userId={userId}
                        onSubmitResult={handleResultSubmit}
                    />
                )}

                {/* Header */}
                <div className="space-y-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="pl-0 hover:bg-transparent hover:underline text-zinc-500">
                        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={handleNameBlur}
                                disabled={!isAdmin || isDelivered}
                                className={clsx(
                                    "w-full text-3xl md:text-4xl font-bold bg-transparent border-none p-0 focus:ring-0 text-zinc-900 dark:text-zinc-50 placeholder-zinc-300",
                                    (!isAdmin || isDelivered) && "cursor-default"
                                )}
                                placeholder="Project Name"
                            />
                            <div className="text-zinc-500 dark:text-zinc-400 mt-1">
                                {checkpoints.length} Checkpoints • {isGroup ? "Group Project" : "Solo Project"} • <span className="capitalize font-bold text-zinc-900 dark:text-zinc-100">{userRole}</span>
                            </div>
                            <textarea
                                defaultValue={project.description || ""}
                                onBlur={(e) => updateProject(id, { description: e.target.value })}
                                placeholder="Add a project description..."
                                rows={1}
                                disabled={!isAdmin || isDelivered}
                                className="w-full mt-2 bg-transparent border-none p-0 text-sm text-zinc-600 dark:text-zinc-400 focus:ring-0 placeholder-zinc-300 resize-none overflow-hidden min-h-[1.5em] leading-relaxed whitespace-pre-wrap"
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {isGroup && (
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowChat(!showChat)}
                                    className={clsx("gap-2", showChat && "bg-zinc-800 text-white")}
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Team Chat
                                </Button>
                            )}
                            {isGroup && isAdmin && (
                                <div className="flex gap-1">
                                    <Button variant="secondary" onClick={() => generateInvite("member")} className="gap-2">
                                        <UserPlus size={18} />
                                        Invite
                                    </Button>
                                </div>
                            )}
                            {isAdmin && (
                                <Button variant="danger" size="icon" onClick={handleDeleteProject} title="Delete Project">
                                    <Trash2 size={20} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invite Modal Overlay */}
                {isSharing && (
                    <div className="p-4 bg-zinc-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium opacity-70">Share this invite link with your team</p>
                            <p className="text-xs opacity-50 truncate">{shareUrl}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button size="sm" onClick={copyInvite} className="flex-1 sm:flex-none gap-2 bg-white text-zinc-900 border-none">
                                <Clipboard size={14} /> Copy
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsSharing(false)} className="flex-1 sm:flex-none text-white hover:bg-zinc-800">
                                Close
                            </Button>
                        </div>
                    </div>
                )}

                {/* View Toggle (Group Only) - Hidden for restricted members */}
                {isGroup && (isAdmin || isObserver) && (
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
                        <button
                            onClick={() => setViewMode("all")}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                viewMode === "all" ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                            )}
                        >
                            Master View ({checkpoints.length})
                        </button>
                        <button
                            onClick={() => setViewMode("personal")}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                viewMode === "personal" ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                            )}
                        >
                            Personal Plan ({checkpoints.filter(c => c.assignedTo === userId).length})
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <DollarSign size={20} />
                            <span className="font-medium">{viewMode === "personal" ? "My Cost" : "Total Cost"}</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">
                            {formatCurrency(totalCost)}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-400">
                            <Calendar size={20} />
                            <span className="font-medium">{viewMode === "personal" ? "My Time" : "Total Time"}</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {totalDays} <span className="text-sm font-normal text-zinc-400">Days</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                <CheckCircle2 size={20} />
                                <span className="font-medium">{viewMode === "personal" ? "My Progress" : "Overall Progress"}</span>
                            </div>
                            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} className="h-3" />
                        <div className="mt-2 text-sm text-zinc-500">
                            {visibleCheckpoints.filter(c => c.completed).length} of {visibleCheckpoints.length} completed
                        </div>
                    </div>
                </div>

                {/* Checkpoints List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Checkpoints</h2>
                        {isAdmin && (
                            <Button onClick={handleAddCheckpoint} size="sm" className="gap-2">
                                <Plus size={16} /> Add Checkpoint
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence initial={false}>
                            {visibleCheckpoints.length === 0 ? (
                                <div className="text-center py-10 text-zinc-400 italic bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    {viewMode === "personal"
                                        ? "No tasks assigned to you yet."
                                        : "No checkpoints yet. Add one to start planning."}
                                </div>
                            ) : (
                                visibleCheckpoints.map((cp) => (
                                    <CheckpointItem
                                        key={cp.id}
                                        checkpoint={{
                                            ...cp,
                                            groupProps: {
                                                members: members,
                                                isProjectAdmin: isAdmin,
                                                currentUserId: userId,
                                                isObserver
                                            }
                                        }}
                                        isPriority={cp.id === priorityCheckpointId}
                                        hasPriority={!!priorityCheckpointId}
                                        onUpdate={(updates) => !(isObserver || isDelivered) && updateCheckpoint(id, cp.id, updates)}
                                        onDelete={() => {
                                            if (!(isObserver || isDelivered) && window.confirm("Delete this checkpoint?")) deleteCheckpoint(id, cp.id);
                                        }}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {isAdmin && (
                        <div className="pt-4">
                            <Button variant="ghost" className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50" onClick={handleAddCheckpoint}>
                                <Plus size={20} className="mr-2" /> Add Checkpoint
                            </Button>
                        </div>
                    )}
                </div>

                {/* Admin Members Management & Summaries */}
                {isGroup && isAdmin && viewMode === "all" && (
                    <div className="space-y-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {memberCosts.filter(m => ['admin', 'member', 'observer'].includes(m.role)).map(m => (
                                <Card key={m.user_id} className="p-4 flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold truncate">{m.name}</p>
                                            {m.role === "admin" && (
                                                <span className="px-1.5 py-0.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[8px] font-bold rounded uppercase">Admin</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 capitalize mb-2">{m.role}</p>

                                        {isAdmin && m.user_id !== userId && (
                                            <div className="flex flex-wrap gap-2">
                                                {m.role !== "admin" ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => promoteToAdmin(id, m.user_id)}
                                                        className="h-7 text-[10px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
                                                    >
                                                        Make Admin
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => demoteFromAdmin(id, m.user_id)}
                                                        className="h-7 text-[10px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
                                                    >
                                                        Demote
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => removeMember(id, m.user_id)}
                                                    className="h-7 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm">{formatCurrency(m.cost)}</p>
                                        <p className="text-[10px] text-zinc-400">{m.days} days • {m.progress}% done</p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pending Requests Section */}
                        {members.some(m => m.role === 'pending') && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <UserPlus size={18} />
                                    Pending Approval
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {members.filter(m => m.role === 'pending').map(m => (
                                        <Card key={m.user_id} className="p-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{m.name}</p>
                                                    <p className="text-xs text-zinc-500">Requested to re-join</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => approveMember(id, m.user_id)}
                                                        className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMember(id, m.user_id)}
                                                        className="text-red-500 hover:bg-red-50"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Calendar size={20} />
                                    Submissions
                                </h2>
                                <Button size="sm" variant="ghost" onClick={setSubmissionDate} className="text-zinc-500">
                                    {project.submissionRawDate ? `Closing: ${project.submissionRawDate}` : "Set Submission Date"}
                                </Button>
                            </div>

                            {project.submissionRawDate && (
                                <div className="space-y-4">
                                    {members.map(m => {
                                        const result = project.results?.[m.id];
                                        return (
                                            <Card key={m.id} className="bg-zinc-50 dark:bg-zinc-800/30">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-medium text-sm">{m.name}'s Result</span>
                                                    {result?.submittedAt && <span className="text-xs text-zinc-400">at {new Date(result.submittedAt).toLocaleDateString()}</span>}
                                                </div>
                                                {result ? (
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">"{result.text}"</p>
                                                ) : (
                                                    <p className="text-sm text-zinc-400">Waiting for submission...</p>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Member Submission Box - Disabled for now */}
                {false && isGroup && project.submissionRawDate && (
                    <div className="pt-8 animate-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-zinc-900 dark:border-white border-2">
                            <h3 className="text-lg font-bold mb-2">Final Submission Box</h3>
                            <p className="text-sm text-zinc-500 mb-4">
                                Deliver your results for this project. Closing on {project.submissionRawDate}.
                            </p>
                            <textarea
                                defaultValue={project.results?.[userId]?.text || ""}
                                onBlur={(e) => handleResultSubmit(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm focus:ring-zinc-500 focus:border-zinc-500 placeholder-zinc-400"
                                placeholder="What did you achieve? Attach any final URLs here..."
                                rows={3}
                            />
                            <div className="text-right mt-2 text-xs text-zinc-400">
                                Auto-saves on blur
                            </div>
                        </Card>
                    </div>
                )}

                {/* Message Board - Disabled for now */}
                {false && isGroup && (
                    <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                        <MessageBoard
                            project={project}
                            userId={userId}
                            userRole={userRole}
                            onSendMessage={handleSendMessage}
                        />
                    </div>
                )}

                {/* AI Assistant */}
                <AISuggestions
                    project={project}
                    onApplySuggestion={handleApplySuggestion}
                />
            </div>

            {/* Slide-over Chat Drawer */}
            <AnimatePresence>
                {isGroup && showChat && project && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowChat(false)}
                            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[60]"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[70] flex flex-col"
                        >
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Users size={18} />
                                    Project Chat
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                                    <X size={20} />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <Chat projectId={project.id} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
