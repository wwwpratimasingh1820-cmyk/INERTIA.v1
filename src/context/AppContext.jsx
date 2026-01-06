import { createContext, useContext, useState, useEffect } from "react";
import { generateId } from "../utils/generateId";
import { supabase } from "../utils/supabase";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Force Dark Theme Always
    useEffect(() => {
        const el = document.documentElement;
        el.classList.add("dark");
        el.style.colorScheme = "dark";
        localStorage.removeItem("inertia_theme_mode");
        localStorage.removeItem("planzao_theme_mode");
    }, []);

    // Projects State
    const [projects, setProjects] = useState([]);
    const [personalProjects, setPersonalProjects] = useState(() => {
        const stored = localStorage.getItem("inertia_personal_projects");
        return stored ? JSON.parse(stored) : [];
    });

    // User Identity (Global)
    const [userId] = useState(() => {
        let id = localStorage.getItem("inertia_userid") || localStorage.getItem("planzao_userid");
        if (!id) {
            id = generateId();
            localStorage.setItem("inertia_userid", id);
        }
        return id;
    });

    // First-Visit State
    const [hasVisited, setHasVisited] = useState(() => {
        return (localStorage.getItem("inertia_has_visited") || localStorage.getItem("planzao_has_visited")) === "true";
    });

    const [aiConfig, setAiConfig] = useState(() => {
        const stored = localStorage.getItem("inertia_ai_config");
        return stored ? JSON.parse(stored) : {
            apiKey: "",
            provider: "gemini",
            model: "gemini-1.5-flash",
            maxTokens: 1024,
            temperature: 0.7,
            isValidated: false,
        };
    });
    const [focusMode, setFocusMode] = useState(false);

    // Session Management & Fetch
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProjects(session.user.id);
            }
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProjects(session.user.id);
            } else {
                setProjects([]);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProjects = async (uid) => {
        try {
            // 1. Fetch Projects where user is admin or member
            const { data: members, error: mError } = await supabase
                .from('members')
                .select('project_id')
                .eq('user_id', uid);

            if (mError) throw mError;
            const projectIds = members.map(m => m.project_id);

            const { data: pData, error: pError } = await supabase
                .from('projects')
                .select('*')
                .in('id', projectIds);

            if (pError) throw pError;

            // 2. Map DB projects into our state format and fetch members
            const mapped = await Promise.all(pData.map(async (p) => {
                const { data: mData } = await supabase
                    .from('members')
                    .select('*')
                    .eq('project_id', p.id);

                return {
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    admin_id: p.admin_id,
                    createdAt: p.created_at,
                    members: mData || [],
                    ...p.data
                };
            }));

            setProjects(mapped);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    // Sync Personal Projects
    useEffect(() => {
        localStorage.setItem("inertia_personal_projects", JSON.stringify(personalProjects));
    }, [personalProjects]);

    // Persist hasVisited
    useEffect(() => {
        localStorage.setItem("inertia_has_visited", hasVisited);
    }, [hasVisited]);


    // Persist Projects
    useEffect(() => {
        localStorage.setItem("inertia_projects", JSON.stringify(projects));
    }, [projects]);

    // Actions

    const addProject = async (name, type = "solo") => {
        const id = generateId(); // Temporary ID for solo
        const newProject = {
            id,
            name,
            type, // "solo" | "group"
            createdAt: new Date().toISOString(),
            members: [
                { id: user?.id || userId, name: user?.user_metadata?.full_name || "Admin", role: "admin" }
            ],
            checkpoints: [],
            results: {},
            messages: [],
            submissionRawDate: null,
        };

        if (type === "solo") {
            setPersonalProjects((prev) => [newProject, ...prev]);
            return id;
        } else if (supabase && user) {
            try {
                // 1. Create Project in Supabase
                const { data: p, error: pError } = await supabase
                    .from('projects')
                    .insert({ name, type, admin_id: user.id, data: { checkpoints: [], results: {}, messages: [] } })
                    .select()
                    .single();

                if (pError) throw pError;

                if (mError) throw mError;

                await fetchProjects(user.id); // Wait for fetch
                return p.id;
            } catch (err) {
                alert("Failed to create group project: " + err.message);
                return null;
            }
        }
    };

    const promoteToAdmin = async (projectId, targetUserId) => {
        if (!supabase || !user) return;
        try {
            const { error } = await supabase
                .from('members')
                .update({ role: 'admin' })
                .eq('project_id', projectId)
                .eq('user_id', targetUserId);

            if (error) throw error;
            await fetchProjects(user.id);
        } catch (err) {
            console.error("Promote Error:", err);
            alert("Failed to promote user: " + err.message);
        }
    };

    const updateProjectList = (newProject) => {
        setProjects(prev => [newProject, ...prev]);
    };

    const joinProject = async (projectData) => {
        if (!supabase || !user) {
            alert("Please login to join a project.");
            return;
        }

        try {
            // Check if already a member
            const { data: existing } = await supabase
                .from('members')
                .select('*')
                .eq('project_id', projectData.id)
                .eq('user_id', user.id)
                .single();

            if (!existing) {
                const role = projectData.invitedRole || "member";
                const { error: mError } = await supabase
                    .from('members')
                    .insert({
                        project_id: projectData.id,
                        user_id: user.id,
                        name: user.user_metadata?.full_name || "Member",
                        role
                    });
                if (mError) throw mError;
            }

            fetchProjects(user.id);
            return projectData.id;
        } catch (err) {
            console.error("Join Error:", err);
            return null;
        }
    };

    const updateProject = (id, updates) => {
        const project = [...personalProjects, ...projects].find(p => p.id === id);
        const type = project?.type || "solo";

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const updated = { ...p, ...updates };
                    if (type === "group" && supabase) {
                        const { id: _id, name: _name, type: _type, admin_id: _admin_id, created_at: _created_at, ...data } = updated;
                        supabase.from('projects').update({ name: updated.name, data }).eq('id', id).then();
                    }
                    return updated;
                }
                return p;
            });

        if (type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
        }
    };

    const deleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        const project = [...personalProjects, ...projects].find(p => p.id === id);
        if (project?.type === "solo") {
            setPersonalProjects((prev) => prev.filter((p) => p.id !== id));
        } else if (supabase && user) {
            try {
                // Delete memberships first due to potential RLS or just clean cleanup
                await supabase.from('members').delete().eq('project_id', id);
                await supabase.from('projects').delete().eq('id', id);
                await fetchProjects(user.id);
            } catch (err) {
                console.error("Delete Error:", err);
            }
        }
    };

    const addCheckpoint = (projectId, checkpoint) => {
        const newCp = {
            ...checkpoint,
            id: generateId(),
            completed: false,
            cost: Number(checkpoint.cost) || 0,
            days: Number(checkpoint.days) || 0,
            notes: "",
            links: [],
            assignedTo: null
        };

        // Fix: Auto-assign in solo/personal mode so it doesn't disappear if filter is active
        const project = [...personalProjects, ...projects].find(p => p.id === projectId);
        if (project && project.type === "solo") {
            newCp.assignedTo = user?.id || userId;
        }

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === projectId) {
                    const updatedCheckpoints = [...p.checkpoints, newCp];

                    // If group, sync to DB
                    if (p.type === "group" && supabase) {
                        supabase.from('projects').update({
                            data: { ...p, checkpoints: updatedCheckpoints }
                        }).eq('id', p.id).then();
                    }

                    return { ...p, checkpoints: updatedCheckpoints };
                }
                return p;
            });

        if (project?.type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
        }
    };

    const updateCheckpoint = (projectId, checkpointId, updates) => {
        const project = [...personalProjects, ...projects].find(p => p.id === projectId);
        const type = project?.type || "solo";

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === projectId) {
                    const updatedCheckpoints = p.checkpoints.map((cp) =>
                        cp.id === checkpointId ? { ...cp, ...updates } : cp
                    );

                    if (type === "group" && supabase) {
                        supabase.from('projects').update({
                            data: { ...p, checkpoints: updatedCheckpoints }
                        }).eq('id', projectId).then();
                    }

                    return { ...p, checkpoints: updatedCheckpoints };
                }
                return p;
            });

        if (type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
        }
    };

    const deleteCheckpoint = (projectId, checkpointId) => {
        const project = [...personalProjects, ...projects].find(p => p.id === projectId);
        const type = project?.type || "solo";

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === projectId) {
                    const updatedCheckpoints = p.checkpoints.filter((cp) => cp.id !== checkpointId);

                    if (type === "group" && supabase) {
                        supabase.from('projects').update({
                            data: { ...p, checkpoints: updatedCheckpoints }
                        }).eq('id', projectId).then();
                    }

                    return { ...p, checkpoints: updatedCheckpoints };
                }
                return p;
            });

        if (type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
        }
    };

    const clearAllData = () => {
        if (window.confirm("Permanently delete ALL projects and settings? This cannot be undone.")) {
            setProjects([]);
            setTheme("light");
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <AppContext.Provider
            value={{
                user,
                loading,
                projects: [...personalProjects, ...projects],
                userId: user?.id || userId,
                hasVisited,
                setHasVisited,
                aiConfig,
                setAiConfig,
                addProject,
                joinProject,
                updateProject,
                deleteProject,
                addCheckpoint,
                updateCheckpoint,
                deleteCheckpoint,
                focusMode,
                setFocusMode,
                promoteToAdmin,
                clearAllData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
