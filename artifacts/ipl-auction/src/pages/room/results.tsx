import { useParams, Link } from "wouter";
import { useGetRoom, getGetRoomQueryKey, useGetAiReport, getGetAiReportQueryKey, useGenerateAiReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function RoomResults() {
  const params = useParams();
  const code = params.code as string;

  const { data: room } = useGetRoom(code, {
    query: { enabled: !!code, queryKey: getGetRoomQueryKey(code) }
  });

  const { data: aiReport, isLoading: reportLoading } = useGetAiReport(code, {
    query: { enabled: !!code, queryKey: getGetAiReportQueryKey(code) }
  });
  
  const generateReport = useGenerateAiReport();

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/50">Auction Results</h1>
          <p className="text-xl text-muted-foreground">The dust has settled. Here are your final squads.</p>
        </header>

        <div className="bg-card border border-border rounded-xl p-8 text-center min-h-[400px] flex flex-col justify-center">
          {reportLoading ? (
            <p>Loading AI Analysis...</p>
          ) : !aiReport ? (
            <div className="space-y-4">
              <p className="text-xl">Analysis not available yet.</p>
              <Button size="lg" onClick={() => generateReport.mutate({ code })} disabled={generateReport.isPending}>
                {generateReport.isPending ? "Generating..." : "Generate AI Analysis"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Predicted Champion: {aiReport.predictedChampion || "Unknown"}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{aiReport.overallAnalysis}</p>
              
              <div className="grid gap-4 mt-8">
                {aiReport.rankings.map((ranking) => (
                  <div key={ranking.teamId} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black w-8 text-muted-foreground">#{ranking.rank}</div>
                      <div>
                        <div className="font-bold text-lg">{ranking.franchiseName}</div>
                        <div className="text-sm text-muted-foreground text-left">{ranking.shortName}</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold">{ranking.overallScore}/100</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-center mt-8">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}