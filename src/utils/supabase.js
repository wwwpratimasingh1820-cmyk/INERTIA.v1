import { createClient } from '@supabase/supabase-js';

// These will be loaded from local storage where the user saves them in Settings
// Priority: 
// 1. Environment Variables (for production/deployment)
// 2. Local Storage (for local overrides/manual setup)
const getSupabaseConfig = () => {
    // 1. Check Vite ENV variables first
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
        return { url: envUrl, key: envKey };
    }

    // 2. Fallback to Local Storage
    const config = localStorage.getItem("inertia_db_config");
    if (config) {
        return JSON.parse(config);
    }
    return { url: "", key: "" };
};

const { url, key } = getSupabaseConfig();

// Initialize client if config exists, otherwise it will be a placeholder
// We will export a function to re-initialize if the user updates settings
export let supabase = (url && key) ? createClient(url, key) : null;

export const initSupabase = (newUrl, newKey) => {
    if (newUrl && newKey) {
        supabase = createClient(newUrl, newKey);
        return true;
    }
    return false;
};
