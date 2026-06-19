import { Metadata } from "next";
import CoveragePageContent from "./CoveragePageContent";

export const metadata: Metadata = {
  title: "Database Coverage | Solar Undo?",
  description: "View KSEB rooftop solar capacity database indexing and coverage statistics.",
};

export default function CoveragePage() {
  return <CoveragePageContent />;
}
