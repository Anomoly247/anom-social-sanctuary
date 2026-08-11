import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, ArrowLeft, ShieldCheck, UserX, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ModerationQueue() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [durations, setDurations] = useState<Record<number, number>>({});

  // Check if user is ambassador, moderator, admin, or owner
  const allowedRoles = ["ambassador", "moderator", "admin", "owner"];
  const hasAccess = user && allowedRoles.includes(user.role);

  const { data: queue = [], refetch } = trpc.safety.getModerationQueue.useQuery(undefined, {
    enabled: Boolean(isAuthenticated && hasAccess),
    refetchInterval: 5000,
  });

  const takeActionMutation = trpc.safety.takeModerationAction.useMutation({
    onSuccess: () => {
      toast.success("Moderation action executed and logged successfully.");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to execute moderation action.");
    },
  });

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e] p-6 flex items-center justify-center">
        <Card className="border-2 border-red-500/50 bg-[#0b0e14]/90 p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Restricted Access</h1>
          <p className="text-gray-400 mb-6">
            You must be signed in with Ambassador, Moderator, Admin, or Owner credentials to access the standalone Moderation Queue.
          </p>
          <Button onClick={() => navigate("/")} className="w-full bg-[#00eaff] text-black font-bold hover:bg-[#00eaff]/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleAction = (reportId: number, targetUserId: number | null, targetType: string | null, targetId: number | null, actionType: any) => {
    const reason = reasons[reportId];
    if (!reason || !reason.trim()) {
      toast.error("A written reason is required for every moderation action.");
      return;
    }
    const duration = durations[reportId] || 24;
    takeActionMutation.mutate({
      reportId,
      targetUserId,
      targetType,
      targetId,
      actionType,
      reason,
      durationHours: duration,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e] p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#ff00cc] mb-2 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-[#00eaff]" />
              Standalone Moderation Queue
            </h1>
            <p className="text-gray-400">
              Logged in as <span className="text-[#00eaff] font-bold">{user.name}</span> ({user.role.toUpperCase()}). Child safety reports prioritized at top.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        <div className="space-y-6">
          {queue.length > 0 ? (
            queue.map((report: any) => {
              const isChildSafety = report.reason === "child_safety";
              return (
                <Card key={report.id} className={`border-2 ${isChildSafety ? "border-red-500 bg-red-950/20" : "border-[#00eaff]/40 bg-[#0b0e14]/90"} p-6`}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${isChildSafety ? "bg-red-500 text-white animate-pulse" : "bg-[#ff00cc]/20 text-[#ff00cc] border border-[#ff00cc]/30"}`}>
                          {report.reason}
                        </span>
                        <span className="text-xs text-gray-400">Status: {report.status}</span>
                        <span className="text-xs text-gray-400">• Reported: {new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-lg font-bold text-white mb-1">
                        Target Type: <span className="text-[#00eaff]">{report.targetType}</span> (ID: {report.targetId})
                      </p>
                      {report.details && (
                        <p className="text-sm text-gray-300 bg-[#1a1f2e] p-3 rounded-md border border-gray-800 mb-3">
                          <span className="text-gray-400 font-semibold">Report Details:</span> {report.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action controls */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">Written Reason Required (*)</label>
                      <Textarea
                        placeholder="Explain why this moderation action is being taken..."
                        value={reasons[report.id] || ""}
                        onChange={(e) => setReasons({ ...reasons, [report.id]: e.target.value })}
                        className="bg-[#1a1f2e] border-[#00eaff]/40 text-white text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Ambassador / Moderator / Admin actions */}
                      <Button
                        size="sm"
                        onClick={() => handleAction(report.id, report.targetUserId, report.targetType, report.targetId, "warn")}
                        className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30"
                      >
                        ⚠️ Warn
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(report.id, report.targetUserId, report.targetType, report.targetId, "mute")}
                          className="bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                        >
                          🔇 Mute (24h)
                        </Button>
                      </div>

                      {/* Moderator & above */}
                      {(user.role === "moderator" || user.role === "admin" || user.role === "owner") && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(report.id, report.targetUserId, report.targetType, report.targetId, "timeout")}
                            className="bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30"
                          >
                            ⏳ Timeout
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(report.id, report.targetUserId, report.targetType, report.targetId, "content_remove")}
                            className="bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30"
                          >
                            🗑️ Remove Content
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(report.id, report.targetUserId, report.targetType, report.targetId, "suspend")}
                            className="bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                          >
                            🛑 Suspend User
                          </Button>
                        </>
                      )}

                      {/* Admin & owner only */}
                      {(user.role === "admin" || user.role === "owner") && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(report.id, report.targetUserId, report.targetType, report.targetId, "ban")}
                          className="bg-red-700 text-white hover:bg-red-800"
                        >
                          🔨 Ban User
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="border-2 border-[#00eaff]/40 bg-[#0b0e14]/90 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Queue is Clear</h2>
              <p className="text-gray-400">No open moderation reports at this time.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
