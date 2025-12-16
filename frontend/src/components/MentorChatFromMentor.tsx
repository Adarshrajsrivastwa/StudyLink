import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Send, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { tokenManager, authApi } from "@/lib/api";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    photoFileName?: string;
  };
  receiver: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  isPaid: boolean;
  createdAt: string;
}

interface MentorChatFromMentorProps {
  conversationId: string;
  studentName: string;
  studentAvatar: string;
  isOpen: boolean;
  onClose: () => void;
}

const MentorChatFromMentor = ({ conversationId, studentName, studentAvatar, isOpen, onClose }: MentorChatFromMentorProps) => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingChat, setPendingChat] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const chatsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.user) {
          setCurrentUserId(response.user._id);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    if (isOpen) {
      fetchCurrentUser();
    }
  }, [isOpen]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (isOpen && conversationId) {
      // Connect to Socket.IO server
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
      const socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      // Join conversation room
      socket.emit("join-conversation", conversationId);

      // Listen for new messages
      socket.on("new-message", (data: { message: ChatMessage; conversationId: string }) => {
        if (data.conversationId === conversationId) {
          setChats((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some((chat) => chat._id === data.message._id);
            if (exists) return prev;
            return [...prev, data.message];
          });
          scrollToBottom();
        }
      });

      // Cleanup on unmount or when conversation changes
      return () => {
        socket.emit("leave-conversation", conversationId);
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [isOpen, conversationId]);

  // Fetch chats when chat opens
  useEffect(() => {
    if (isOpen && conversationId) {
      fetchChats();
    }
  }, [isOpen, conversationId]);

  // Scroll to bottom when chats update
  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    chatsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const token = tokenManager.getToken();
      
      // Get chats for conversation
      const chatResponse = await fetch(
        `http://localhost:5000/api/chat/conversation/${conversationId}/chats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const chatData = await chatResponse.json();
      
      if (chatData.success) {
        setChats(chatData.data || []);
      } else {
        toast({
          title: "Error",
          description: chatData.message || "Failed to load chats",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch chats error:", error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !conversationId) return;

    const content = chatInput.trim();
    setChatInput("");
    setPendingChat(content);

    try {
      setIsSending(true);
      const token = tokenManager.getToken();
      const response = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId,
          content: content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Chat sent successfully - Socket.IO will handle real-time update
        // But we still add it optimistically for immediate UI feedback
        setChats((prev) => {
          const exists = prev.some((chat) => chat._id === data.data._id);
          if (exists) return prev;
          return [...prev, data.data];
        });
        setPendingChat("");
        // Don't need to fetchChats() as Socket.IO will update in real-time
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send chat",
          variant: "destructive",
        });
        setPendingChat("");
      }
    } catch (error) {
      console.error("Send chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send chat",
        variant: "destructive",
      });
      setPendingChat("");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                {studentAvatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{studentName}</CardTitle>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Chats Area */}
          <ScrollArea className="flex-1 px-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading chats...</p>
                </div>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No chats yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chats.map((chat) => {
                  const isOwnChat = currentUserId && chat.sender._id === currentUserId;
                  return (
                    <div
                      key={chat._id}
                      className={`flex gap-3 ${isOwnChat ? "justify-end" : "justify-start"}`}
                    >
                      {!isOwnChat && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {studentAvatar}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnChat
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{chat.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(chat.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {chat.isPaid && (
                            <span className="text-xs opacity-70">Paid</span>
                          )}
                        </div>
                      </div>
                      {isOwnChat && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/20">
                            {chat.sender.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                {pendingChat && (
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[70%] rounded-lg p-3 bg-primary/50 text-primary-foreground">
                      <p className="text-sm">{pendingChat}</p>
                      <p className="text-xs opacity-70 mt-1">Sending...</p>
                    </div>
                  </div>
                )}
                <div ref={chatsEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={isSending}
                className="flex-1"
              />
              <Button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isSending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MentorChatFromMentor;

