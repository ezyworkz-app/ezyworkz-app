"use client";

import React, { useEffect, useRef, useState } from "react";
import { Message, sendMessage, getConversationMessages, markMessagesAsRead, uploadChatImage } from "@/lib/actions/chat";
import { format } from "date-fns";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface ChatWindowProps {
    initialMessages: Message[];
    conversationId: string;
    shopId: string; // To identify context if needed
}

export default function ChatWindow({
    initialMessages,
    conversationId,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages every 10 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const newMessages = await getConversationMessages(conversationId);
            if (newMessages && newMessages.length > 0) {
                setMessages(newMessages);
                // Also mark as read when new messages are fetched
                await markMessagesAsRead(conversationId);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [conversationId]);

    // Mark as read on mount
    useEffect(() => {
        markMessagesAsRead(conversationId);
    }, [conversationId]);


    const handleSend = async (imageUrl?: string) => {
        if (!inputText.trim() && !imageUrl) return;
        if (sending) return;

        const text = inputText.trim();
        setInputText("");
        setSending(true);

        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            messageId: tempId,
            conversationId,
            senderId: "admin",
            senderType: "admin",
            content: imageUrl || text,
            messageType: imageUrl ? "image" : "text",
            images: imageUrl ? [imageUrl] : [],
            read: false,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMsg]);

        const sentMsg = await sendMessage(
            conversationId,
            imageUrl || text,
            imageUrl ? "image" : "text",
            imageUrl ? [imageUrl] : []
        );

        if (sentMsg) {
            // Replace optimistic message with real one
            setMessages((prev) =>
                prev.map((m) => (m.messageId === tempId ? sentMsg : m))
            );
        } else {
            // Remove optimistic message on failure (or show error)
            setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
            alert("Failed to send message");
            if (!imageUrl) setInputText(text); // restore text if it was text
        }
        setSending(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        e.target.value = "";

        // Validate size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const imageUrl = await uploadChatImage(formData);
            if (imageUrl) {
                await handleSend(imageUrl);
            } else {
                alert("Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during upload");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg) => {
                    const isMe = msg.senderType === "shop" || msg.senderType === "admin";
                    return (
                        <div
                            key={msg.messageId}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 border shadow-sm ${isMe
                                    ? "bg-gray-900 border-gray-800 text-white rounded-br-none"
                                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none"
                                    }`}
                            >
                                {msg.messageType === "image" ? (
                                    <div className="space-y-2">
                                        <img
                                            src={msg.content}
                                            alt="Chat"
                                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(msg.content, "_blank")}
                                        />
                                        {msg.images && msg.images.length > 1 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {msg.images.slice(1).map((imgUrl, i) => (
                                                    <img
                                                        key={i}
                                                        src={imgUrl}
                                                        alt={`Chat ${i}`}
                                                        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(imgUrl, "_blank")}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}
                                <p
                                    className={`text-[10px] mt-1 text-right ${isMe ? "text-gray-400" : "text-gray-400"}`}
                                >
                                    {format(new Date(msg.createdAt), "HH:mm")}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || sending}
                        className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all disabled:opacity-30 shrink-0"
                        title="Upload Image"
                    >
                        {uploading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <ImageIcon size={20} />
                        )}
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-gray-400 transition-colors text-sm"
                        disabled={sending || uploading}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!inputText.trim() || sending || uploading}
                        className="bg-gray-950 dark:bg-white text-white dark:text-gray-950 p-2.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
