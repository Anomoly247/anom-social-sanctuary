import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Coins, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { startLogin } from "@/const";

export default function Wallet() {
  const { user, isAuthenticated } = useAuth();
  const { data: balanceData, isLoading: balanceLoading } = trpc.coin.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: historyData, isLoading: historyLoading } = trpc.coin.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#121620] border-2 border-[#ff00cc] rounded-xl p-8 shadow-[0_0_25px_rgba(255,0,204,0.2)]">
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-3">Wallet Access</h2>
          <p className="text-[#7a7f8e] mb-6">Sign in to view your Anom Coin balance and transaction history.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => startLogin()}
              className="px-6 py-3 rounded-lg font-bold text-black bg-[#ff00cc] hover:bg-[#cc00a3] transition-all shadow-[0_0_15px_rgba(255,0,204,0.4)] cursor-pointer"
            >
              Sign In / Sign Up
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-6 py-3 rounded-lg font-bold text-white border border-[#00eaff] hover:bg-[#00eaff]/10 transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const balance = balanceData?.balance || "0";
  const transactions = historyData || [];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#ff00cc] mb-2">Anom Coin Wallet</h1>
            <p className="text-[#7a7f8e]">Manage your digital currency and track your earnings</p>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="btn-neon-cyan px-4 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer"
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Balance Card */}
        <div
          className="rounded-lg border-2 border-[#ff00cc] p-8 mb-8 bg-[#121620]"
          style={{
            boxShadow: "0 0 20px rgba(255, 0, 204, 0.25)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#7a7f8e] text-sm mb-1">Available Balance</p>
              <p className="text-5xl font-bold text-[#ff00cc] flex items-center gap-3">
                <Coins className="w-10 h-10 text-[#00eaff]" />
                {balanceLoading ? "..." : balance} AC
              </p>
            </div>
          </div>
          <p className="text-sm text-[#7a7f8e]">Earn Anom Coins by participating in community lounges, rating posts, and completing mission goals.</p>
        </div>

        {/* Transaction History */}
        <h2 className="text-2xl font-bold text-[#00eaff] mb-4">Transaction History</h2>
        <div className="bg-[#121620] border border-[#2a3042] rounded-xl overflow-hidden">
          {historyLoading ? (
            <p className="p-6 text-center text-[#7a7f8e]">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="p-6 text-center text-[#7a7f8e]">No transactions yet. Start engaging to earn coins!</p>
          ) : (
            <div className="divide-y divide-[#2a3042]">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#181d2c] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === "earn" ? "bg-[#00eaff]/10 text-[#00eaff]" : "bg-[#ff00cc]/10 text-[#ff00cc]"}`}>
                      {tx.type === "earn" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tx.reason}</p>
                      <p className="text-xs text-[#7a7f8e]">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.type === "earn" ? "text-[#00eaff]" : "text-[#ff00cc]"}`}>
                    {tx.type === "earn" ? "+" : "-"}{tx.amount} AC
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
