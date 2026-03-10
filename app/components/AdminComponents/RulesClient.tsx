"use client";

import { useState, useTransition } from "react";
import { createRule, updateRule, deleteRule } from "@/app/actions/admin/rules";

type Rule = { id: number; title: string; content: string };

export default function RulesClient({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setForm({ title: "", content: "" });
    setEditingId(null);
    setError(null);
  };

  const flash = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (editingId !== null) {
          await updateRule({ id: editingId, ...form });
          setRules((rs) =>
            rs.map((r) => (r.id === editingId ? { ...r, ...form } : r))
          );
        } else {
          const result = await createRule(form);
          setRules((rs) => [
            { id: result.ruleId, ...form },
            ...rs,
          ]);
        }
        resetForm();
        flash();
      } catch (err: any) {
        setError(err.message ?? "Something went wrong");
      }
    });
  };

  const handleEdit = (rule: Rule) => {
    setForm({ title: rule.title, content: rule.content });
    setEditingId(rule.id);
    setError(null);
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deleteRule(id);
        setRules((rs) => rs.filter((r) => r.id !== id));
      } catch (err: any) {
        setError(err.message ?? "Failed to delete");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-bold">
        {editingId !== null ? "Edit Rule" : "Create Rule"}
      </h1>

      {success && (
        <p className="text-sm text-green-600">
          Rule {editingId !== null ? "updated" : "created"} successfully.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Rule title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm min-h-[140px]"
            placeholder="Rule content"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-black text-white text-sm px-5 py-2 rounded disabled:opacity-50"
          >
            {isPending ? "Saving…" : editingId !== null ? "Update" : "Create"}
          </button>
          {editingId !== null && (
            <button
              onClick={resetForm}
              className="text-sm px-5 py-2 rounded border"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
          {rules.length} {rules.length === 1 ? "Rule" : "Rules"}
        </h2>
        {rules.length === 0 && (
          <p className="text-sm text-gray-400">No rules yet.</p>
        )}
        {rules.map((rule) => (
          <div key={rule.id} className="border rounded p-4 space-y-1">
            <p className="text-xs text-gray-400">#{rule.id}</p>
            <p className="font-semibold">{rule.title}</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{rule.content}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleEdit(rule)}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                disabled={isPending}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}