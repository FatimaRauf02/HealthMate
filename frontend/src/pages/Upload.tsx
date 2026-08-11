import { useRef, useState } from "react";
import { UploadCloud, FileText, Loader2, Download, AlertTriangle, X } from "lucide-react";
import { uploadReport, friendlyErrorMessage } from "../lib/api";
import type { UploadResponse } from "../types/api";
import { Disclaimer } from "../components/common/Disclaimer";
import { MarkdownMessage } from "../components/chat/MarkdownMessage";

const ACCEPTED = [".pdf", ".docx", ".txt"];

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (f: File) => ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));

  const handleFile = (f: File) => {
    setError(null);
    setResult(null);
    if (!isValidFile(f)) {
      setError(`Unsupported file type. Please upload ${ACCEPTED.join(", ")}.`);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    const fakeProgress = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 90));
    }, 150);

    try {
      const data = await uploadReport(file);
      setProgress(100);
      setResult(data);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      clearInterval(fakeProgress);
      setUploading(false);
    }
  };

  const handleDownloadSummary = () => {
    if (!result) return;
    const blob = new Blob(
      [
        `HealthMate AI — Report Summary\n\nFile: ${result.filename}\n\n${result.summary}\n\n` +
          (result.abnormal_findings.length
            ? `Findings Worth Discussing:\n${result.abnormal_findings.map((f) => `- ${f}`).join("\n")}\n\n`
            : "") +
          `${result.safety_disclaimer}`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.filename.replace(/\.[^.]+$/, "")}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="h-screen overflow-y-auto">
      <header className="border-b border-line dark:border-line-dark px-5 py-3.5">
        <h1 className="font-display text-lg leading-tight">Medical Report Upload</h1>
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark">
          PDF, DOCX, or TXT — summarized by the Medical Report Agent
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {!result && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-line dark:border-line-dark rounded-2xl px-6 py-12 text-center hover:border-teal/50 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-teal-soft dark:bg-paper-dim-dark flex items-center justify-center mx-auto mb-3">
              <UploadCloud size={22} className="text-teal" />
            </div>
            <p className="text-sm mb-1">
              <button onClick={() => inputRef.current?.click()} className="text-teal font-medium hover:underline">
                Choose a file
              </button>{" "}
              or drag it here
            </p>
            <p className="text-xs text-ink-soft dark:text-ink-soft-dark">PDF, DOCX, or TXT · up to 10MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {file && (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-paper-dim dark:bg-paper-dim-dark px-3 py-2 text-sm max-w-xs mx-auto">
                <FileText size={15} className="text-teal shrink-0" />
                <span className="truncate">{file.name}</span>
                <button onClick={reset} className="text-ink-soft hover:text-rose shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            {file && !uploading && (
              <button
                onClick={handleUpload}
                className="mt-4 rounded-lg bg-teal text-white text-sm font-medium px-5 py-2 hover:bg-teal-deep transition-colors"
              >
                Analyze Report
              </button>
            )}

            {uploading && (
              <div className="mt-5 max-w-xs mx-auto">
                <div className="h-1.5 rounded-full bg-paper-dim dark:bg-paper-dim-dark overflow-hidden">
                  <div
                    className="h-full bg-teal transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-1.5 flex items-center justify-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Analyzing report...
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex gap-2.5 rounded-lg bg-rose-soft border border-rose/20 px-3.5 py-3 text-sm text-rose">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 rise-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <FileText size={15} className="text-teal" />
                <span className="font-medium">{result.filename}</span>
              </div>
              <button onClick={reset} className="text-xs text-ink-soft hover:text-teal">
                Upload another
              </button>
            </div>

            <div className="rounded-xl border border-line dark:border-line-dark bg-white dark:bg-paper-dim-dark px-4 py-3.5">
              <MarkdownMessage content={`## Summary\n${result.summary}`} />
            </div>

            {result.abnormal_findings.length > 0 && (
              <div className="rounded-xl border border-amber/30 bg-amber-soft px-4 py-3.5">
                <p className="text-sm font-medium text-amber mb-1.5">Findings Worth Discussing With Your Doctor</p>
                <ul className="text-sm space-y-1 list-disc ml-4">
                  {result.abnormal_findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(result.terminology_explained).length > 0 && (
              <div className="rounded-xl border border-line dark:border-line-dark bg-white dark:bg-paper-dim-dark px-4 py-3.5">
                <p className="text-sm font-medium mb-2">Terminology Explained</p>
                <dl className="space-y-2 text-sm">
                  {Object.entries(result.terminology_explained).map(([term, def]) => (
                    <div key={term}>
                      <dt className="font-medium text-teal-deep dark:text-ink-dark">{term}</dt>
                      <dd className="text-ink-soft dark:text-ink-soft-dark">{def}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <button
              onClick={handleDownloadSummary}
              className="flex items-center gap-2 rounded-lg border border-line dark:border-line-dark px-4 py-2 text-sm hover:bg-paper-dim dark:hover:bg-paper-dim-dark transition-colors"
            >
              <Download size={15} /> Download summary
            </button>

            <Disclaimer text={result.safety_disclaimer} />
          </div>
        )}
      </div>
    </div>
  );
}
