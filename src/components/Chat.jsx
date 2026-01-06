import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";
import { Send, User, Clock } from "lucide-react";
import clsx from "clsx";
import Button from "./Button";

export default function Chat({ projectId }) {
    const { user } = useApp();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!projectId || !supabase) return;

        // 1. Initial Fetch
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (!error) setMessages(data);
            setLoading(false);
        };

        fetchMessages();

        // 2. Real-time Subscription
        const channel = supabase
            .channel(`project_chat_${projectId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !supabase) return;

        const messageData = {
            project_id: projectId,
            sender_id: user.id,
            sender_name: user.user_metadata?.full_name || "Member",
            text: newMessage.trim(),
        };

        setNewMessage(""); // Optimistic clear

        const { error } = await supabase.from('messages').insert(messageData);
        if (error) {
            alert("Failed to send message: " + error.message);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 animate-pulse">Loading Chat...</div>;

    return (
        <div className="flex flex-col h-full bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-zinc-700/50">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800/50 bg-zinc-950/20 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Project Chat
                </h3>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 opacity-50">
                        <div className="p-3 bg-zinc-800/50 rounded-full animate-bounce">
                            <Send size={20} />
                        </div>
                        <p className="text-xs font-medium">Start the conversation</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={clsx(
                                    "flex flex-col max-w-[85%] group animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                    <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-wider">
                                        {msg.sender_name}
                                    </span>
                                </div>
                                <div
                                    className={clsx(
                                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-300",
                                        isMe
                                            ? "bg-zinc-100 text-zinc-950 rounded-tr-none hover:bg-white"
                                            : "bg-zinc-800/80 text-zinc-100 rounded-tl-none hover:bg-zinc-800 border border-zinc-700/30"
                                    )}
                                >
                                    {msg.text}
                                </div>
                                <div className="mt-1 px-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Clock size={10} className="text-zinc-600" />
                                    <span className="text-[9px] text-zinc-600">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950/40 border-t border-zinc-800/50">
                <div className="relative group">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Say something cozy..."
                        className="w-full bg-zinc-900/50 border border-zinc-800/50 text-white text-sm rounded-xl pl-4 pr-12 py-3 focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 border-none outline-none placeholder-zinc-600 transition-all duration-300"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-all duration-300"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
