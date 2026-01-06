import { useState } from "react";
import { MessageSquare, Send, Clock, AlertCircle } from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import clsx from "clsx";

export default function MessageBoard({ project, userId, userRole, onSendMessage }) {
    const [input, setInput] = useState("");
    const messages = project.messages || [];

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const sender = project.members.find(m => m.id === userId);
        const newMessage = {
            id: Date.now().toString(),
            senderId: userId,
            senderName: sender?.name || "System",
            text: input.trim(),
            timestamp: new Date().toISOString()
        };

        onSendMessage(newMessage);
        setInput("");
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    <h3 className="font-bold uppercase tracking-wider text-xs">Project Board</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium">
                    <AlertCircle size={10} />
                    <span>Syncs when project is reshared</span>
                </div>
            </div>

            <Card className="bg-zinc-50 dark:bg-zinc-800/50 border-none p-0 overflow-hidden flex flex-col h-[400px]">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-40">
                            <MessageSquare size={32} />
                            <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === userId;
                            return (
                                <div
                                    key={msg.id}
                                    className={clsx(
                                        "flex flex-col max-w-[85%]",
                                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{msg.senderName}</span>
                                        <span className="text-[9px] text-zinc-300">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={clsx(
                                        "px-4 py-2 rounded-2xl text-sm shadow-sm",
                                        isMe
                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-tr-none"
                                            : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-none"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-zinc-400"
                    />
                    <Button type="submit" size="icon" className="shrink-0 aspect-square rounded-xl">
                        <Send size={16} />
                    </Button>
                </form>
            </Card>
        </div>
    );
}
