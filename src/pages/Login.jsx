import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import Button from "../components/Button";
import Input from "../components/Input";
import { LayoutGrid, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!supabase) {
            setError("Database not configured. Please set up Supabase in Settings.");
            setLoading(false);
            return;
        }

        try {
            const fakeEmail = `${username.trim().toLowerCase()}@inertia.local`;
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password,
            });

            if (authError) throw authError;
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                            <LayoutGrid className="text-zinc-900 w-6 h-6" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                    <p className="text-zinc-500 text-sm">Sign in to your Inertia account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Username</label>
                        <Input
                            placeholder="your_username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                            <Link to="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Forgot?</Link>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400 animate-in fade-in zoom-in-95">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </Button>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2 text-xs">
                        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-400">
                            Keep your password safe. It is your only way to access your account.
                        </p>
                    </div>
                </form>

                <p className="text-center text-sm text-zinc-500">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-white font-medium hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
