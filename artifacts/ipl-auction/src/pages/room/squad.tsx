import { useParams } from "wouter";

export default function TeamSquad() {
  const params = useParams();
  const code = params.code as string;
  const teamId = params.teamId as string;

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold">Team Squad</h1>
      <p>Room: {code} | Team: {teamId}</p>
    </div>
  );
}