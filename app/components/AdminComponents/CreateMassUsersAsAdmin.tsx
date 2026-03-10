"use client";

import { useRef, useState } from "react";
import { massUploadUsers } from "@/app/actions/sponsor/bulk-upload-users";

type ParsedUser = {
  line: number;
  type: string;
  orgName: string;
  firstName: string;
  lastName: string;
  email: string;
  points?: number;
  reason?: string;
};

type ParseError = {
  line: number;
  message: string;
  raw: string;
};

type ParseResult = {
  valid: ParsedUser[];
  errors: ParseError[];
};

type UploadStatus = "idle" | "parsing" | "preview" | "uploading" | "done" | "error";

function parseFile(content: string): ParseResult {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const valid: ParsedUser[] = [];
  const errors: ParseError[] = [];

  lines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    const parts = raw.split("|").map((p) => p.trim());
    const normalizedType = parts[0]?.toUpperCase();

    if (!["O", "D", "S"].includes(normalizedType)) {
      errors.push({ line: lineNum, message: `Invalid type "${parts[0]}" — must be O, D, or S`, raw });
      return;
    }

    // O rows: format is just: O | orgName
    if (normalizedType === "O") {
      if (parts.length < 2 || !parts[1]) {
        errors.push({ line: lineNum, message: `Org rows require: O | orgName`, raw });
        return;
      }
      valid.push({
        line: lineNum,
        type: "O",
        orgName: parts[1],
        firstName: "",
        lastName: "",
        email: "",
      });
      return;
    }

    // D and S rows: 5–7 fields
    if (parts.length < 5) {
      errors.push({ line: lineNum, message: "Too few fields (minimum 5 required)", raw });
      return;
    }
    if (parts.length > 7) {
      errors.push({ line: lineNum, message: "Too many fields (maximum 7 allowed)", raw });
      return;
    }

    const [, orgName, firstName, lastName, email, pointsRaw, reason] = parts;

    if (!email.includes("@")) {
      errors.push({ line: lineNum, message: `Invalid email "${email}"`, raw });
      return;
    }
    if (pointsRaw && !reason) {
      errors.push({ line: lineNum, message: "Points provided but reason is missing", raw });
      return;
    }
    if (pointsRaw && isNaN(Number(pointsRaw))) {
      errors.push({ line: lineNum, message: `Points "${pointsRaw}" is not a valid number`, raw });
      return;
    }

    valid.push({
      line: lineNum,
      type: normalizedType,
      orgName,
      firstName,
      lastName,
      email,
      points: pointsRaw ? Number(pointsRaw) : undefined,
      reason: reason || undefined,
    });
  });

  return { valid, errors };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  O: { label: "Org", color: "bg-purple-100 text-purple-600 border-purple-200" },
  D: { label: "Driver", color: "bg-blue-100 text-blue-600 border-blue-200" },
  S: { label: "Sponsor", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
};

export default function CreateMassUsersAsSponsor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [uploadResult, setUploadResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("parsing");
    setFileName(file.name);
    setParsed(null);
    setUploadResult(null);
    setErrorMsg("");

    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const result = parseFile(content);
      setParsed(result);
      setStatus("preview");
    } catch {
      setErrorMsg("Failed to read file.");
      setStatus("error");
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirm = async () => {
    if (!parsed || parsed.valid.length === 0) return;
    setStatus("uploading");
    try {
      const rows: Parameters<typeof massUploadUsers>[0] = parsed.valid.map((u) => ({
        name: u.type === "O" ? u.orgName : `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: (
          u.type === "O" ? "org" : u.type === "D" ? "driver" : "sponsor"
        ) as "org" | "admin" | "driver" | "sponsor",
        pointsBalance: u.points,
        sponsorName: u.type !== "O" ? u.orgName || undefined : undefined,
      }));

      const result = await massUploadUsers(rows);
      setUploadResult({ created: result.success, failed: result.failed, errors: result.errors });
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setFileName("");
    setParsed(null);
    setUploadResult(null);
    setErrorMsg("");
  };

  return (
    <div className="w-full space-y-5">
      {/* Upload button */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "parsing" || status === "uploading"}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            status === "parsing" || status === "uploading"
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md"
          }`}
        >
          <span>📄</span>
          {status === "parsing" ? "Reading file..." : "Upload Text File"}
        </button>
        {fileName && status !== "idle" && (
          <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{fileName}</span>
        )}
      </div>

      {/* Preview panel */}
      {status === "preview" && parsed && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Summary bar */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
              <span className="text-2xl font-bold text-blue-600">{parsed.valid.length}</span>
              <span className="text-xs text-slate-500 leading-tight">users<br />ready</span>
            </div>
            {parsed.errors.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                <span className="text-2xl font-bold text-red-500">{parsed.errors.length}</span>
                <span className="text-xs text-slate-500 leading-tight">rows<br />with errors</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="text-2xl font-bold text-slate-600">
                {parsed.valid.filter((u) => u.points !== undefined).length}
              </span>
              <span className="text-xs text-slate-500 leading-tight">with<br />points</span>
            </div>
          </div>

          {/* First 5 preview */}
          {parsed.valid.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Preview — first {Math.min(5, parsed.valid.length)} of {parsed.valid.length} users
              </p>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.valid.slice(0, 5).map((u, i) => {
                      const typeInfo = TYPE_LABELS[u.type];
                      return (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 font-medium">
                            {u.type === "O" ? (
                              <span className="italic text-purple-700">{u.orgName}</span>
                            ) : (
                              <>
                                {u.firstName} {u.lastName}
                                {u.orgName && <span className="ml-1.5 text-xs text-slate-400">· {u.orgName}</span>}
                              </>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">
                            {u.type === "O" ? <span className="text-slate-300">—</span> : u.email}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs">
                            {u.points !== undefined ? (
                              <span className="text-emerald-600 font-semibold">+{u.points}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parsed.valid.length > 5 && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
                    + {parsed.valid.length - 5} more users not shown
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parse errors */}
          {parsed.errors.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                ⚠️ Rows with errors (will be skipped)
              </p>
              <div className="rounded-xl border border-red-100 overflow-hidden bg-red-50">
                {parsed.errors.map((err, i) => (
                  <div key={i} className="px-4 py-2.5 border-b border-red-100 last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-red-400 mt-0.5 shrink-0">Line {err.line}</span>
                      <span className="text-xs text-red-600">{err.message}</span>
                    </div>
                    <p className="mt-1 text-xs font-mono text-red-300 truncate">{err.raw}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={parsed.valid.length === 0}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                parsed.valid.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md"
              }`}
            >
              ✓ Confirm & Upload {parsed.valid.length} User{parsed.valid.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {status === "uploading" && (
        <div className="flex items-center gap-3 text-sm text-slate-500 py-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Uploading users to database...
        </div>
      )}

      {/* Done state */}
      {status === "done" && uploadResult && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold text-emerald-700">Upload Complete</span>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-600"><strong>{uploadResult.created}</strong> users created</span>
            {uploadResult.failed > 0 && (
              <span className="text-red-500"><strong>{uploadResult.failed}</strong> failed</span>
            )}
          </div>
          {/* Show per-row server errors if any */}
          {uploadResult.errors.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-white overflow-hidden mt-1">
              {uploadResult.errors.map((e, i) => (
                <p key={i} className="px-3 py-1.5 text-xs text-red-500 border-b border-emerald-100 last:border-0 font-mono">{e}</p>
              ))}
            </div>
          )}
          <button onClick={handleReset} className="text-xs text-emerald-600 underline underline-offset-2 hover:text-emerald-800">
            Upload another file
          </button>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 space-y-2">
          <p className="text-sm text-red-600 font-medium">❌ {errorMsg}</p>
          <button onClick={handleReset} className="text-xs text-red-500 underline underline-offset-2 hover:text-red-700">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}