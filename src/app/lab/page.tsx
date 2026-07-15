import type { Metadata } from "next";
import { LabShell } from "@/components/lab/LabShell";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

export const metadata: Metadata = {
  title: "Laboratoire",
  description: "Démonstrations techniques des modules du moteur.",
  robots: { index: false, follow: false },
};

export default function LabPage() {
  return (
    <div className="py-8">
      <ScrollProgress />
      <LabShell />
    </div>
  );
}
