import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Stethoscope,
  BookOpen,
  UserRound,
  Utensils,
  CalendarClock,
  FileText,
  Sparkles,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { checkHealth } from "../lib/api";

const AGENTS = [
  { icon: Stethoscope, name: "Triage", desc: "Assesses urgency and safety guidance" },
  { icon: BookOpen, name: "Medical Information", desc: "Explains symptoms and conditions" },
  { icon: UserRound, name: "Specialist Recommendation", desc: "Points to the right kind of doctor" },
  { icon: Utensils, name: "Lifestyle", desc: "Diet, sleep, hydration, exercise advice" },
  { icon: CalendarClock, name: "Appointment", desc: "Suggests doctors, slots, and prep" },
  { icon: FileText, name: "Medical Report", desc: "Summarizes uploaded lab reports" },
];

export function Home() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-3 flex items-center gap-2 text-xs">
          {backendStatus === "checking" && <span className="text-ink-soft dark:text-ink-soft-dark">Checking backend...</span>}
          {backendStatus === "online" && (
            <span className="flex items-center gap-1 text-teal">
           
            </span>
          )}
          {backendStatus === "offline" && (
            <span className="flex items-center gap-1 text-rose">
              <CircleAlert size={13} /> Backend not reachable — start the FastAPI server
            </span>
          )}
        </div>

        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-4 max-w-xl">
          One question. <span className="text-teal">Six specialist agents.</span> One clear answer.
        </h1>
        <p className="text-ink-soft dark:text-ink-soft-dark max-w-lg mb-7 leading-relaxed">
          "Describe your symptoms once — a Coordinator Agent quietly consults specialist AI agents 
          for triage, medical guidance and lifestyle advice, then hands you back one 
          clear, actionable answer."
        </p>

        <div className="flex flex-wrap gap-3 mb-14">
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal text-white text-sm font-medium px-5 py-2.5 hover:bg-teal-deep transition-colors"
          >
            Start a conversation <ArrowRight size={15} />
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line dark:border-line-dark text-sm font-medium px-5 py-2.5 hover:bg-paper-dim dark:hover:bg-paper-dim-dark transition-colors"
          >
            Upload a report
          </Link>
        </div>

        {/* Agent pipeline showcase — sequence has real meaning, ordering matches execution */}
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-teal" />
          <h2 className="font-display text-xl">How the pipeline works</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENTS.map(({ icon: Icon, name, desc }, i) => (
            <div
              key={name}
              className="relative rounded-xl border border-line dark:border-line-dark bg-white dark:bg-paper-dim-dark px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-soft dark:bg-paper-dim flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-teal" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">{desc}</p>
                </div>
              </div>
              <span className="absolute top-3 right-3 font-mono-data text-[10px] text-ink-soft dark:text-ink-soft-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-4">
          A Summary Agent always runs last, combining whichever specialists were routed to into one
          structured answer with a safety disclaimer.
        </p>
      </div>
    </div>
  );
}
