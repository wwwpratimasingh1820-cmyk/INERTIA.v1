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

        // 3. Real-time Subscriptions
        const projectsSubscription = supabase
            .channel('any')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
                console.log("Realtime Update [Projects]:", payload);
                if (user) fetchProjects(user.id);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
                console.log("Realtime Update [Members]:", payload);
                if (user) fetchProjects(user.id);
            })
            .subscribe((status) => {
                console.log("Realtime Subscription Status:", status);
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProjects(session.user.id);
            } else {
                setProjects([]);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(projectsSubscription);
        };
    }, [user?.id]); // Re-subscribe if user changes

    const updateProfile = async (updates) => {
        if (!supabase || !user) return;
        try {
            const { error } = await supabase.auth.updateUser({
                data: updates
            });
            if (error) throw error;

            // Also update members table names for this user across all projects
            if (updates.full_name) {
                await supabase
                    .from('members')
                    .update({ name: updates.full_name })
                    .eq('user_id', user.id);
            }

            await fetchProjects(user.id);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Update failed: " + err.message);
        }
    };

    const fetchProjects = async (uid) => {
        try {
            // 1. Fetch Projects where user is admin or member
            const { data: members, error: mError } = await supabase
                .from('members')
                .select('project_id')
                .eq('user_id', uid)
                .in('role', ['admin', 'member', 'observer']); // Exclude 'removed' and 'pending'

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
                    data: p.data || {}, // Keep raw data for safe preservation during updates
                    ...(p.data || {})
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
                { user_id: user?.id || userId, name: user?.user_metadata?.full_name || "Admin", role: "admin" }
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

                // 2. Create Admin Member in Supabase
                const { error: mError } = await supabase
                    .from('members')
                    .insert({
                        project_id: p.id,
                        user_id: user.id,
                        name: user.user_metadata?.full_name || "Admin",
                        role: 'admin'
                    });

                if (mError) throw mError;

                await fetchProjects(user.id);
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
            alert("User promoted to Admin successfully!");
        } catch (err) {
            console.error("Promote Error:", err);
            alert("Permission denied or error: " + err.message);
        }
    };

    const demoteFromAdmin = async (projectId, targetUserId) => {
        if (!supabase || !user) return;
        try {
            const { error } = await supabase
                .from('members')
                .update({ role: 'member' })
                .eq('project_id', projectId)
                .eq('user_id', targetUserId);

            if (error) throw error;
            await fetchProjects(user.id);
            alert("Admin demoted to Member.");
        } catch (err) {
            console.error("Demote Error:", err);
            alert("Failed to demote user: " + err.message);
        }
    };

    const removeMember = async (projectId, targetUserId) => {
        if (!supabase || !user) return;
        if (!window.confirm("Are you sure? They will need admin approval to re-join.")) return;

        try {
            const { error } = await supabase
                .from('members')
                .update({ role: 'removed' })
                .eq('project_id', projectId)
                .eq('user_id', targetUserId);

            if (error) throw error;
            await fetchProjects(user.id);
            alert("Member removed from group.");
        } catch (err) {
            console.error("Remove Error:", err);
            alert("Failed to remove user: " + err.message);
        }
    };

    const approveMember = async (projectId, targetUserId) => {
        if (!supabase || !user) return;
        try {
            const { error } = await supabase
                .from('members')
                .update({ role: 'member' })
                .eq('project_id', projectId)
                .eq('user_id', targetUserId);

            if (error) throw error;
            await fetchProjects(user.id);
            alert("Member approved!");
        } catch (err) {
            console.error("Approve Error:", err);
            alert("Failed to approve member: " + err.message);
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
            // Check for existing record (including removed users)
            const { data: existing } = await supabase
                .from('members')
                .select('*')
                .eq('project_id', projectData.id)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                if (existing.role === 'removed') {
                    // Update to pending for approval
                    const { error: uError } = await supabase
                        .from('members')
                        .update({ role: 'pending' })
                        .eq('id', existing.id);
                    if (uError) throw uError;
                    alert("Your request to re-join has been sent to the admins.");
                    return "pending";
                }
                if (existing.role === 'pending') {
                    alert("Your request is still pending admin approval.");
                    return "pending";
                }
                return projectData.id; // Already a member/admin
            }

            // First time joining
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

            await fetchProjects(user.id);
            return projectData.id;
        } catch (err) {
            console.error("Join Error:", err);
            return null;
        }
    };

    const updateProject = async (id, updates) => {
        const project = [...personalProjects, ...projects].find(p => p.id === id);
        if (!project) return;

        const type = project.type || "solo";

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    return { ...p, ...updates };
                }
                return p;
            });

        if (type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
            if (supabase) {
                try {
                    // Precise update: only send the 'data' fields
                    const updatedData = {
                        checkpoints: updates.checkpoints || project.checkpoints || [],
                        results: updates.results || project.results || {},
                        messages: updates.messages || project.messages || [],
                        submissionRawDate: updates.submissionRawDate !== undefined ? updates.submissionRawDate : (project.submissionRawDate || null)
                    };

                    const { error } = await supabase
                        .from('projects')
                        .update({
                            name: updates.name || project.name,
                            data: {
                                ...(project.data || {}),
                                checkpoints: updates.checkpoints || project.checkpoints || [],
                                results: updates.results || project.results || {},
                                messages: updates.messages || project.messages || [],
                                submissionRawDate: updates.submissionRawDate !== undefined ? updates.submissionRawDate : (project.submissionRawDate || null)
                            }
                        })
                        .eq('id', id);

                    if (error) throw error;
                    // Realtime will trigger fetch, but let's be safe
                    // await fetchProjects(user.id); 
                } catch (err) {
                    console.error("Update Project Error:", err);
                    alert("Sync Error: Failed to save project data. " + err.message);
                }
            }
        }
    };

    const deleteProject = async (id) => {
        const project = [...personalProjects, ...projects].find(p => p.id === id);
        if (project?.type === "solo") {
            setPersonalProjects((prev) => prev.filter((p) => p.id !== id));
        } else if (supabase && user) {
            try {
                await supabase.from('members').delete().eq('project_id', id);
                await supabase.from('projects').delete().eq('id', id);
                await fetchProjects(user.id);
            } catch (err) {
                console.error("Delete Error:", err);
            }
        }
    };

    const addCheckpoint = async (projectId, checkpoint) => {
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

        const project = [...personalProjects, ...projects].find(p => p.id === projectId);
        if (!project) return;

        if (project.type === "solo") {
            newCp.assignedTo = user?.id || userId;
            setPersonalProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, checkpoints: [...p.checkpoints, newCp] } : p
            ));
        } else if (supabase) {
            try {
                const updatedCheckpoints = [...project.checkpoints, newCp];
                const { error } = await supabase
                    .from('projects')
                    .update({
                        data: {
                            ...(project.data || {}),
                            checkpoints: updatedCheckpoints,
                        }
                    })
                    .eq('id', projectId);

                if (error) throw error;
                // Local state update
                setProjects(prev => prev.map(p =>
                    p.id === projectId ? { ...p, checkpoints: updatedCheckpoints } : p
                ));
            } catch (err) {
                console.error("Add Checkpoint Error:", err);
                alert("Failed to add task: " + err.message);
            }
        }
    };

    const updateCheckpoint = async (projectId, checkpointId, updates) => {
        const project = [...personalProjects, ...projects].find(p => p.id === projectId);
        if (!project) return;

        const type = project.type || "solo";

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === projectId) {
                    const updatedCheckpoints = p.checkpoints.map((cp) =>
                        cp.id === checkpointId ? { ...cp, ...updates } : cp
                    );
                    return { ...p, checkpoints: updatedCheckpoints };
                }
                return p;
            });

        if (type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
            if (supabase) {
                try {
                    const updatedCheckpoints = project.checkpoints.map((cp) =>
                        cp.id === checkpointId ? { ...cp, ...updates } : cp
                    );

                    const { error } = await supabase
                        .from('projects')
                        .update({
                            data: {
                                ...(project.data || {}),
                                checkpoints: updatedCheckpoints,
                            }
                        })
                        .eq('id', projectId);

                    if (error) throw error;
                } catch (err) {
                    console.error("Update Checkpoint Error:", err);
                    alert("Sync Error: Could not save checkpoint. " + err.message);
                }
            }
        }
    };

    const deleteCheckpoint = async (projectId, checkpointId) => {
        const project = [...personalProjects, ...projects].find(p => p.id === projectId);
        if (!project) return;

        const type = project.type || "solo";

        const updater = (prev) =>
            prev.map((p) => {
                if (p.id === projectId) {
                    const updatedCheckpoints = p.checkpoints.filter((cp) => cp.id !== checkpointId);
                    return { ...p, checkpoints: updatedCheckpoints };
                }
                return p;
            });

        if (type === "solo") {
            setPersonalProjects(updater);
        } else {
            setProjects(updater);
            if (supabase) {
                try {
                    const updatedCheckpoints = project.checkpoints.filter((cp) => cp.id !== checkpointId);
                    const { error } = await supabase
                        .from('projects')
                        .update({
                            data: {
                                ...(project.data || {}),
                                checkpoints: updatedCheckpoints,
                            }
                        })
                        .eq('id', projectId);

                    if (error) throw error;
                } catch (err) {
                    console.error("Delete Checkpoint Error:", err);
                }
            }
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

    const logout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setProjects([]);
        }
        localStorage.clear();
        window.location.href = "/";
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
                demoteFromAdmin,
                removeMember,
                approveMember,
                updateProfile,
                logout,
                clearAllData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
