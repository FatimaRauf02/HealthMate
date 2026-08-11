import { ShieldAlert, Layers, Server, Sparkles } from "lucide-react";

export function About() {
  return (
    <div className="h-screen overflow-y-auto">
      <header className="border-b border-line dark:border-line-dark px-5 py-3.5">
        <h1 className="font-display text-lg leading-tight">About HealthMate AI</h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        <section>
          <p className="text-sm leading-relaxed text-ink-soft dark:text-ink-soft-dark">
            HealthMate AI is a multi-agent healthcare assistant built on Microsoft Azure AI Foundry
            and the Azure AI Agents SDK. Rather than a single chatbot answering everything, a
            Coordinator Agent reads your question and routes it to whichever specialist agents are
            relevant — then a Summary Agent combines their outputs into one clear, structured answer.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-teal" />
            <h2 className="font-display text-base">The agents</h2>
          </div>
          <dl className="space-y-3 text-sm">
            {[
              ["Coordinator", "Decides which specialists should run — never answers medical questions itself."],
              ["Triage", "Classifies urgency as Emergency, Urgent, Routine, or Home Care, with safety guidance."],
              ["Medical Information", "Explains symptoms, conditions, tests, and preventive care — educational only."],
              ["Specialist Recommendation", "Suggests which type of doctor to see, from a fixed set of specialties."],
              ["Lifestyle", "Diet, hydration, sleep, and exercise guidance tailored to your situation."],
              ["Appointment", "Mock scheduling data today — built to plug into a real booking API later."],
              ["Medical Report", "Summarizes uploaded PDF/DOCX/TXT reports and explains terminology."],
              ["Summary", "Combines every agent's output into one structured, de-duplicated response."],
            ].map(([name, desc]) => (
              <div key={name} className="flex gap-3">
                <dt className="w-44 shrink-0 font-medium">{name}</dt>
                <dd className="text-ink-soft dark:text-ink-soft-dark">{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Server size={16} className="text-teal" />
            <h2 className="font-display text-base">Under the hood</h2>
          </div>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark leading-relaxed">
            React + TypeScript + Vite + Tailwind on the frontend. FastAPI + Pydantic on the backend.
            Each specialist is a real Azure AI Agent created via the Azure AI Agents SDK, with its own
            thread per request. Conversations persist to a local JSON store today, designed to be
            swapped for Cosmos DB or Azure SQL later.
          </p>
        </section>

        <section className="rounded-xl border border-mist/30 bg-mist-soft px-4 py-4 flex gap-3">
          <ShieldAlert size={18} className="text-mist shrink-0 mt-0.5" />
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
            HealthMate AI never diagnoses conditions or prescribes medication. Every response is
            educational only. Always consult a qualified healthcare professional for medical advice,
            and call emergency services if you're experiencing a medical emergency.
          </p>
        </section>

        <section className="flex items-center gap-2 text-xs text-ink-soft dark:text-ink-soft-dark">
          <Sparkles size={13} className="text-teal" /> Version 1.0.0
        </section>
      </div>
    </div>
  );
}
