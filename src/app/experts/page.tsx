import { redirect } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ExpertsDirectory } from "@/components/ExpertsDirectory";

export const metadata = { title: "Find an expert" };

export default function ExpertsPage() {
  if (!FEATURES.expertsDirectory) {
    redirect("/members");
  }

  return <ExpertsDirectory />;
}
