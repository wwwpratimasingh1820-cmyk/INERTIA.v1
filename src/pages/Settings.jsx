import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Button from "../components/Button";
import { Trash2, AlertTriangle, Moon, Sun, Sparkles, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, ChevronDown, Clock } from "lucide-react";
import { AI_PROVIDERS, sendAIMessage } from "../utils/aiProviders";
import CryptoJS from "crypto-js";
import clsx from "clsx";

const SECRET_SALT = "inertia_secure_salt_2026";

export default function Settings() {
    const { clearAllData, aiConfig, setAiConfig, user, projects } = useApp();
    const [showKey, setShowKey] = useState(false);

    // Local state for the AI form
    const [localConfig, setLocalConfig] = useState(aiConfig);
    const [availableModels, setAvailableModels] = useState([]);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null); // { type: 'success' | 'error', message: '' }

    // Fetch models if already validated
    useEffect(() => {
        const fetchModels = async () => {
            if (aiConfig.apiKey && aiConfig.provider === 'gemini' && aiConfig.isValidated) {
                try {
                    // Decrypt for usage
                    const bytes = CryptoJS.AES.decrypt(aiConfig.apiKey, SECRET_SALT);
                    const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);

                    const models = await AI_PROVIDERS.gemini.listModels(decryptedKey);
                    setAvailableModels(models);
                } catch (err) {
                    console.error("Decryption failed for model fetch");
                    setAvailableModels([]);
                }
            }
        };
        fetchModels();
    }, [aiConfig]);

    const handleTestKey = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            if (localConfig.provider === 'gemini') {
                const models = await AI_PROVIDERS.gemini.listModels(localConfig.apiKey);
                setAvailableModels(models);
                if (models.length > 0) {
                    const bestModel = models.find(m => m.id === "gemini-1.5-flash") || models[0];
                    setLocalConfig(prev => ({ ...prev, model: bestModel.id, isValidated: true }));
                    setTestStatus({ type: 'success', message: `Successfully fetched ${models.length} Gemini models!` });
                } else {
                    throw new Error("No supported Gemini models found for this key.");
                }
            } else if (localConfig.provider === 'openai') {
                const response = await sendAIMessage("Reply with exactly: OK", localConfig);
                if (response.trim().toUpperCase().includes("OK")) {
                    setTestStatus({ type: 'success', message: "OpenAI API Key is working correctly!" });
                    setLocalConfig(prev => ({ ...prev, isValidated: true }));
                } else {
                    throw new Error("Unexpected response from OpenAI. Check your API key.");
                }
            } else {
                // Custom
                setLocalConfig(prev => ({ ...prev, isValidated: true }));
                setTestStatus({ type: 'success', message: "Configuration set (Custom mode ignores validation)." });
            }
        } catch (err) {
            setTestStatus({ type: 'error', message: err.message || "Validation failed." });
            setLocalConfig(prev => ({ ...prev, isValidated: false }));
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        const encryptedConfig = { ...localConfig };
        if (localConfig.apiKey && !localConfig.apiKey.startsWith("U2FsdGVkX1")) {
            // Encrypt ONLY if not already encrypted
            encryptedConfig.apiKey = CryptoJS.AES.encrypt(localConfig.apiKey, SECRET_SALT).toString();
        }

        setAiConfig(encryptedConfig);
        setTestStatus({ type: 'success', message: "Settings saved! AI Key is now encrypted and safe." });
    };

    const handleRemove = () => {
        const reset = {
            apiKey: "",
            provider: "gemini",
            model: "gemini-1.5-flash",
            maxTokens: 1024,
            temperature: 0.7,
            isValidated: false,
        };
        setAiConfig(reset);
        setLocalConfig(reset);
        setAvailableModels([]);
        setTestStatus(null);
    };

    const handleProviderChange = (key) => {
        setLocalConfig({
            ...localConfig,
            provider: key,
            model: AI_PROVIDERS[key].defaultModel,
            isValidated: false,
            apiKey: "" // Reset key when switching provider for safety
        });
        setTestStatus(null);
        setAvailableModels([]);
    };

    // Calculate Stats
    const totalProjects = projects.length;
    const completedTasks = projects.reduce((acc, p) => {
        const checkpoints = p.data?.checkpoints || p.checkpoints || [];
        return acc + checkpoints.filter(c => c.completed).length;
    }, 0);

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>

            <div className="space-y-6">
                {/* User Profile */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">User Profile</h2>
                    <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            <span className="text-2xl font-bold text-zinc-400">{(user?.user_metadata?.full_name || user?.user_metadata?.username || "U")[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user?.user_metadata?.full_name || user?.user_metadata?.username || "Anonymous User"}</h3>
                            <p className="text-sm text-zinc-500">@{user?.user_metadata?.username || "guest"}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Projects</p>
                                <p className="text-xl font-black text-zinc-900 dark:text-zinc-50">{totalProjects}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Tasks</p>
                                <p className="text-xl font-black text-zinc-900 dark:text-zinc-50">{completedTasks}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Configuration */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <Sparkles size={20} className="text-zinc-500" />
                        Universal AI Assistant
                    </h2>

                    <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI chat is solo-only and requires an API key.</p>
                            <p className="text-xs text-zinc-500">API keys unlock the provider. Models are verified after validation.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Provider Selection */}
                            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleProviderChange(key)}
                                        className={clsx(
                                            "py-2 text-xs font-bold rounded-lg transition-all",
                                            localConfig.provider === key
                                                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white"
                                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        {provider.name.split(" ")[0]}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {/* API Key Input - Step 1 */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">1. Provider API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={localConfig.apiKey}
                                            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value, isValidated: false })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-3 pr-10 py-3 text-sm focus:ring-1 focus:ring-zinc-500 outline-none"
                                            placeholder={localConfig.provider === 'openai' ? "sk-..." : "Enter your API key"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                        >
                                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Model Selection - Step 2 (Only visible if key exists or custom) */}
                                {localConfig.apiKey && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">2. Select Model</label>

                                        {localConfig.provider === 'gemini' && (
                                            <div className="relative">
                                                <select
                                                    value={localConfig.model}
                                                    onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                                    disabled={!localConfig.isValidated}
                                                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-sm focus:ring-1 focus:ring-zinc-500 outline-none disabled:opacity-50"
                                                >
                                                    {availableModels.length > 0 ? (
                                                        availableModels.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))
                                                    ) : (
                                                        <option value="">{localConfig.isValidated ? "No models found" : "Click 'Validate Key' below"}</option>
                                                    )}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                            </div>
                                        )}

                                        {localConfig.provider === 'openai' && (
                                            <div className="relative">
                                                <select
                                                    value={localConfig.model}
                                                    onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-sm focus:ring-1 focus:ring-zinc-500 outline-none"
                                                >
                                                    {AI_PROVIDERS.openai.stableModels.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                    <option value="custom">-- Use Custom Model Name --</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                            </div>
                                        )}

                                        {(localConfig.provider === 'custom' || (localConfig.provider === 'openai' && localConfig.model === 'custom')) && (
                                            <input
                                                value={localConfig.model === 'custom' ? "" : localConfig.model}
                                                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                                placeholder="Enter exact model name"
                                                className="w-full mt-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-sm focus:ring-1 focus:ring-zinc-500 outline-none"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {localConfig.provider === 'custom' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Base URL (Local API)</label>
                                    <input
                                        value={localConfig.baseUrl || ""}
                                        onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-sm focus:ring-1 focus:ring-zinc-500 outline-none"
                                        placeholder="http://localhost:11434/v1/chat/completions"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Max Tokens</label>
                                    <input
                                        type="number"
                                        value={localConfig.maxTokens}
                                        onChange={(e) => setLocalConfig({ ...localConfig, maxTokens: parseInt(e.target.value) || 1024 })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-zinc-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Temperature ({localConfig.temperature})</label>
                                    <input
                                        type="range" min="0" max="1" step="0.1"
                                        value={localConfig.temperature}
                                        onChange={(e) => setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-zinc-900 dark:accent-white mt-3"
                                    />
                                </div>
                            </div>
                        </div>

                        {testStatus && (
                            <div className={clsx(
                                "p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-2",
                                testStatus.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400"
                            )}>
                                {testStatus.type === 'success' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                                {testStatus.message}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                variant="secondary"
                                className="flex-1 h-12"
                                onClick={handleTestKey}
                                disabled={isTesting || !localConfig.apiKey}
                            >
                                {isTesting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                                {localConfig.provider === 'gemini' ? "Validate & Fetch Models" : "Test Connection"}
                            </Button>

                            <Button
                                className="flex-1 h-12"
                                onClick={handleSave}
                                disabled={!localConfig.isValidated || isTesting}
                            >
                                Save Configuration
                            </Button>
                        </div>

                        {aiConfig.apiKey && (
                            <button
                                onClick={handleRemove}
                                className="text-xs text-zinc-400 hover:text-red-500 hover:underline mx-auto block transition-colors"
                            >
                                Remove API Key & Configuration
                            </button>
                        )}

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 space-y-3">
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    <span className="text-red-400 uppercase font-bold mr-1">⚠️ SECURITY NOTICE:</span>
                                    Your AI API key is **encrypted on your device** and never stored in readable form.
                                    We do not have access to your key. If you expose it from your own device or browser, Inertia is not responsible.
                                </p>
                                <p className="text-[10px] text-zinc-500 italic">
                                    Inertia uses client-side AES-256 encryption. Planzo does not manage or recover API keys.
                                    Users are responsible for their own key safety.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Management */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">Data Management</h2>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-red-900 dark:text-red-200">Danger Zone</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    Permanently delete all projects and reset settings. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <Button variant="danger" onClick={clearAllData} className="w-full sm:w-auto">
                            <Trash2 size={18} className="mr-2" />
                            Clear All Data
                        </Button>
                    </div>
                </section>

                <div className="text-center pt-8">
                    <p className="text-sm text-zinc-400">Inertia v1.0.0</p>
                </div>
            </div>
        </div>
    );
}
