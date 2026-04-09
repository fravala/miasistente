import { Sidebar } from "@/components/layout/Sidebar";
import { AIAssistant } from "@/components/layout/AIAssistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden w-full">
      {/* Left Navigation (Desktop) */}
      <Sidebar />
      
      {/* Center Main Content */}
      <main className="flex-1 h-screen overflow-y-auto w-full scroll-smooth">
        <div className="px-4 py-5 md:px-8 md:py-8 pb-24 md:pb-8 max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>
      
      {/* Right AI Assistant Panel (Desktop) + FAB (Mobile) */}
      <AIAssistant />
    </div>
  );
}
