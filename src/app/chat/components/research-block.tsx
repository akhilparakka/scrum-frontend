import { cn } from "@/lib/utils";

interface ResearchBlockProps {
  className?: string;
  content: string;
}

export function ResearchBlock({ className, content }: ResearchBlockProps) {
  return (
    <div className={cn("bg-gray-100 p-4 rounded", className)}>
      <h2 className="text-lg font-bold mb-2">Research</h2>
      <div>{content || "No research content available."}</div>
    </div>
  );
}
