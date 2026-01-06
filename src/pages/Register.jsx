import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import Button from "../components/Button";
import Input from "../components/Input";
import { LayoutGrid, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!supabase) {
            setError("Database not configured. Please set up Supabase in Settings.");
            setLoading(false);
            return;
        }

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (authError) throw authError;
            if (data.user) {
                // Redirect to login or auto-login
                alert("Account created! You can now sign in.");
                navigate("/login");
            }
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
                            <Sparkles className="text-zinc-900 w-6 h-6" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
                    <p className="text-zinc-500 text-sm">Join the Inertia collaboration platform</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
                        <Input
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email / Username</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Password</label>
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
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                    </Button>
                </form>

                <p className="text-center text-sm text-zinc-500">
                    Already have an account?{" "}
                    <Link to="/login" className="text-white font-medium hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
