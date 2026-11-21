import { createFileRoute } from "@tanstack/react-router";
import { TacticsApp } from "@/components/tactics-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <TacticsApp />;
}
