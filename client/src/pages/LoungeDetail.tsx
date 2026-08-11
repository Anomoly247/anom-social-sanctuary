import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Send, Settings, Plus, X } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface LoungeDetailProps {
  params: { loungeId: string };
}

export default function LoungeDetail({ params }: LoungeDetailProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const loungeId = parseInt(params.loungeId, 10);
  const [messageInput, setMessageInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [customizeData, setCustomizeData] = useState({
    name: "",
    description: "",
    neonTheme: "magenta" as "magenta" | "cyan" | "purple",
  });

  // Fetch lounge details
  const { data: lounge, isLoading: loungeLoading, refetch: refetchLounge } = trpc.lounge.getById.useQuery(
    { loungeId },
    { enabled: isAuthenticated && !!loungeId }
  );

  // Fetch lounge members
  const { data: members = [], isLoading: membersLoading } = trpc.lounge.getMembers.useQuery(
    { loungeId },
    { enabled: isAuthenticated && !!loungeId }
  );

  // Fetch lounge messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = trpc.lounge.getMessages.useQuery(
    { loungeId, limit: 50 },
    { enabled: isAuthenticated && !!loungeId }
  );

  // Send message mutation
  const sendMessageMutation = trpc.lounge.sendMessage.useMutation({
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Reactions & Pin mutations
  const toggleReactionMutation = trpc.lounge.toggleReaction.useMutation({
    onSuccess: () => refetchMessages(),
    onError: (err) => toast.error(err.message),
  });

  const pinMessageMutation = trpc.lounge.pinMessage.useMutation({
    onSuccess: () => {
      toast.success("Pinned status updated");
      refetchMessages();
    },
    onError: (err) => toast.error(err.message),
  });

  const markReadMutation = trpc.lounge.markRead.useMutation();

  useEffect(() => {
    if (loungeId) {
      markReadMutation.mutate({ loungeId });
    }
  }, [loungeId, messages.length]);

  // Update lounge settings mutation
  const updateSettingsMutation = trpc.lounge.updateSettings.useMutation({
    onSuccess: (updatedLounge) => {
      toast.success("Lounge settings updated!");
      setIsCustomizeOpen(false);
      refetchLounge();
    },
    onError: (error) => {
      toast.error(`Failed to update lounge: ${error.message}`);
    },
  });

  // Initialize customize form when lounge loads
  useEffect(() => {
    if (lounge) {
      setCustomizeData({
        name: lounge.name || "",
        description: lounge.description || "",
        neonTheme: (lounge.neonTheme as "magenta" | "cyan" | "purple") || "magenta",
      });
    }
  }, [lounge]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    sendMessageMutation.mutate({
      loungeId,
      content: messageInput,
    });
  };

  const handleUpdateSettings = () => {
    if (!customizeData.name.trim()) {
      toast.error("Lounge name is required");
      return;
    }

    updateSettingsMutation.mutate({
      loungeId,
      name: customizeData.name,
      description: customizeData.description || undefined,
      neonTheme: customizeData.neonTheme,
    });
  };

  if (loading || loungeLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-[#00eaff] text-xl">Loading lounge...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#00eaff] text-xl mb-4">Please sign in to access this lounge</p>
          <Button className="btn-neon-magenta" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!lounge) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#00eaff] text-xl mb-4">Lounge not found</p>
          <Button className="btn-neon-magenta" onClick={() => navigate("/lounges")}>
            Back to Lounges
          </Button>
        </div>
      </div>
    );
  }

  const themeColor = lounge.neonTheme === "cyan" ? "#00eaff" : lounge.neonTheme === "purple" ? "#9d4edd" : "#ff00cc";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e]">
      {/* Header */}
      <div className="bg-[#1a1f2e] border-b-2" style={{ borderColor: themeColor }} >
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: themeColor }}>
              {lounge.name}
            </h1>
            <p className="text-[#00eaff]">{lounge.type} Lounge</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")} className="bg-[#2a2f3e] hover:bg-[#3a3f4e] text-[#00eaff]">
              🏠 Home
            </Button>
            <Button onClick={() => navigate("/lounges")} className="bg-[#2a2f3e] hover:bg-[#3a3f4e] text-[#00eaff]">
              Back to Lounges
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Pinned Messages Banner */}
          {messages.some((m: any) => m.isPinned) && (
            <Card className="bg-[#1a1f2e] border-2 border-yellow-500 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">📌 Pinned:</span>
                <span className="text-sm text-white truncate max-w-xl">
                  {messages.find((m: any) => m.isPinned)?.content}
                </span>
              </div>
              <span className="text-xs text-[#7a7f8e]">Owner Highlight</span>
            </Card>
          )}

          <Card className="bg-[#1a1f2e] border-2 h-96 flex flex-col" style={{ borderColor: themeColor }}>
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#7a7f8e]">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg: any, idx: number) => {
                    const isOwner = lounge.ownerId === user?.id;
                    const reactions = (msg.reactions || {}) as Record<string, number[]>;
                    return (
                      <div key={idx} className={`rounded-lg p-3 border ${msg.isPinned ? 'bg-[#1a1f2e] border-yellow-500' : 'bg-[#0b0e14] border-[#00eaff]/20'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[#00eaff] font-bold text-sm">{msg.user?.name || "Member"}</p>
                            <p className="text-gray-200 text-sm mt-1">{msg.content}</p>
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => pinMessageMutation.mutate({ messageId: msg.id, isPinned: !msg.isPinned })}
                              className="text-xs px-2 py-1 rounded bg-[#2a2f3e] text-yellow-400 hover:bg-[#3a3f4e]"
                            >
                              {msg.isPinned ? "Unpin" : "Pin"}
                            </button>
                          )}
                        </div>

                        {/* Reactions & Emoji Picker */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-[#2a2f3e]">
                          {Object.entries(reactions).map(([emoji, userList]) => {
                            const hasReacted = userList.includes(user?.id as number);
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReactionMutation.mutate({ messageId: msg.id, emoji })}
                                className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  hasReacted ? 'border-[#ff00cc] bg-[#ff00cc]/20 text-[#ff00cc]' : 'border-[#2a2f3e] bg-[#1a1f2e] text-gray-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{userList.length}</span>
                              </button>
                            );
                          })}

                          <div className="flex gap-1 ml-auto">
                            {["👍", "❤️", "🔥", "🚀", "✨"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReactionMutation.mutate({ messageId: msg.id, emoji })}
                                className="text-xs hover:scale-125 transition-transform px-1"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-[#7a7f8e] text-xs mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="bg-[#1a1f2e] border-2 text-white"
              style={{ borderColor: themeColor }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="text-black font-bold flex items-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Members */}
          <Card className="bg-[#1a1f2e] border-2 border-[#00eaff] p-4">
            <h3 className="text-lg font-bold text-[#00eaff] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({members.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member, idx) => (
                <div key={idx} className="text-sm text-gray-300 p-2 bg-[#0b0e14] rounded">
                  {member.user?.name || 'Member'}
                  {member.role === 'owner' && <span className="text-[#ff00cc] ml-2 text-xs">(Owner)</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card className="bg-[#1a1f2e] border-2 p-4" style={{ borderColor: themeColor }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColor }}>
              <Settings className="w-5 h-5" />
              Lounge Settings
            </h3>
            <div className="space-y-2">
              <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full text-black font-bold" style={{ backgroundColor: themeColor }}>
                    Customize Lounge
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1f2e] border-2" style={{ borderColor: themeColor }}>
                  <DialogHeader>
                    <DialogTitle style={{ color: themeColor }}>Customize Lounge</DialogTitle>
                    <DialogDescription className="text-[#7a7f8e]">
                      Update your lounge name, description, and theme.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[#00eaff] text-sm font-medium">Lounge Name</label>
                      <Input
                        value={customizeData.name}
                        onChange={(e) => setCustomizeData({ ...customizeData, name: e.target.value })}
                        className="bg-[#0b0e14] border-[#2a2f3e] text-[#00eaff] placeholder-[#7a7f8e]"
                      />
                    </div>

                    <div>
                      <label className="text-[#00eaff] text-sm font-medium">Description (Optional)</label>
                      <Textarea
                        value={customizeData.description}
                        onChange={(e) => setCustomizeData({ ...customizeData, description: e.target.value })}
                        placeholder="What's this lounge about?"
                        className="bg-[#0b0e14] border-[#2a2f3e] text-[#00eaff] placeholder-[#7a7f8e]"
                      />
                    </div>

                    <div>
                      <label className="text-[#00eaff] text-sm font-medium">Neon Theme</label>
                      <Select value={customizeData.neonTheme} onValueChange={(value: any) => setCustomizeData({ ...customizeData, neonTheme: value })}>
                        <SelectTrigger className="bg-[#0b0e14] border-[#2a2f3e] text-[#00eaff]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] border-[#2a2f3e]">
                          <SelectItem value="magenta" className="text-[#ff00cc]">
                            Magenta
                          </SelectItem>
                          <SelectItem value="cyan" className="text-[#00eaff]">
                            Cyan
                          </SelectItem>
                          <SelectItem value="purple" className="text-[#9d4edd]">
                            Purple
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full text-black font-bold"
                      onClick={handleUpdateSettings}
                      disabled={updateSettingsMutation.isPending}
                      style={{ backgroundColor: themeColor }}
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-[#00eaff] hover:bg-[#00eaff]/80 text-black font-bold">
                    Invite Members
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1f2e] border-2 border-[#00eaff]">
                  <DialogHeader>
                    <DialogTitle className="text-[#00eaff]">Invite Members</DialogTitle>
                    <DialogDescription className="text-[#7a7f8e]">
                      Invite people to join your lounge by email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[#00eaff] text-sm font-medium">Email Address</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="friend@example.com"
                        className="bg-[#0b0e14] border-[#2a2f3e] text-[#00eaff] placeholder-[#7a7f8e]"
                      />
                    </div>
                    <Button
                      className="w-full bg-[#00eaff] hover:bg-[#00eaff]/80 text-black font-bold"
                      onClick={() => {
                        if (!inviteEmail.trim()) {
                          toast.error("Please enter an email address");
                          return;
                        }
                        toast.success(`Invitation sent to ${inviteEmail}`);
                        setInviteEmail("");
                        setIsInviteOpen(false);
                      }}
                    >
                      Send Invite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
