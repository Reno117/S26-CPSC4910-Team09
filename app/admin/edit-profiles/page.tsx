"use client";
 
import { useState, useTransition, useEffect } from "react";
import {
  updateDriverProfile,
  updateSponsorUser,
  getDriversWithProfiles,
  getSponsorUsers,
  getAllSponsorsForSelect,
  type UpdateDriverInput,
  type UpdateSponsorUserInput,
} from "@/app/actions/admin/edit-profile-actions";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type Driver = Awaited<ReturnType<typeof getDriversWithProfiles>>[number];
type SponsorUser = Awaited<ReturnType<typeof getSponsorUsers>>[number];
type SponsorOption = { id: string; name: string };
 
// ─── Status Badge ─────────────────────────────────────────────────────────────
 
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:  { bg: "#e6f4ea", color: "#2e7d32" },
  pending: { bg: "#fff8e1", color: "#f57f17" },
  dropped: { bg: "#fdecea", color: "#c62828" },
};
 
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "#f0f0f0", color: "#555" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
    }}>
      {status}
    </span>
  );
}
 
// ─── Shared styles ────────────────────────────────────────────────────────────
 
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
  color: "#333",
  backgroundColor: "#fff",
  outline: "none",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};
 
const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 700,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "2px solid #ddd",
  backgroundColor: "#ebebeb",
};
 
const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "14px",
  color: "#333",
  borderBottom: "1px solid #e8e8e8",
};
 
// ─── Field ────────────────────────────────────────────────────────────────────
 
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
 
// ─── Modal Shell ──────────────────────────────────────────────────────────────
 
function Modal({ title, subtitle, onClose, children, onSave, isPending }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "relative",
        backgroundColor: "#fff",
        borderRadius: "10px",
        width: "100%",
        maxWidth: "520px",
        margin: "0 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        fontFamily: "Arial, sans-serif",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#333" }}>{title}</h3>
            {subtitle && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#999" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#999", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
 
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {children}
        </div>
 
        <div style={{ padding: "16px 24px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 18px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff", color: "#555", fontSize: "14px", cursor: "pointer", fontFamily: "Arial, sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isPending}
            style={{ padding: "8px 18px", border: "none", borderRadius: "6px", background: "#333", color: "#fff", fontSize: "14px", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1, fontFamily: "Arial, sans-serif" }}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── Edit Driver Modal ────────────────────────────────────────────────────────
 
function EditDriverModal({ driver, sponsors, onClose, onSaved }: {
  driver: Driver;
  sponsors: SponsorOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    userName: driver.user.name,
    userEmail: driver.user.email,
    address: driver.address ?? "",
    status: driver.status,
    sponsorId: driver.sponsorId ?? "",
    reason: "",
  });
  const [error, setError] = useState("");
 
  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }
 
  function handleSave() {
    setError("");
    startTransition(async () => {
      try {
        const payload: UpdateDriverInput = { driverProfileId: driver.id, reason: form.reason || undefined };
        if (form.userName !== driver.user.name) payload.userName = form.userName;
        if (form.userEmail !== driver.user.email) payload.userEmail = form.userEmail;
        if (form.address !== (driver.address ?? "")) payload.address = form.address;
        if (form.status !== driver.status) payload.status = form.status;
        const newSponsor = form.sponsorId || null;
        if (newSponsor !== driver.sponsorId) payload.sponsorId = newSponsor;
        await updateDriverProfile(payload);
        onSaved();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }
 
  return (
    <Modal title="Edit Driver" subtitle={driver.id} onClose={onClose} onSave={handleSave} isPending={isPending}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Name">
          <input style={inputStyle} value={form.userName} onChange={(e) => set("userName", e.target.value)} />
        </Field>
        <Field label="Email">
          <input style={inputStyle} value={form.userEmail} onChange={(e) => set("userEmail", e.target.value)} />
        </Field>
      </div>
 
      <Field label="Address">
        <input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" />
      </Field>
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Status">
          <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="dropped">dropped</option>
          </select>
        </Field>
        <Field label="Sponsor">
          <select style={inputStyle} value={form.sponsorId} onChange={(e) => set("sponsorId", e.target.value)}>
            <option value="">— None —</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>
 
      <Field label="Reason for change (optional)">
        <input style={inputStyle} value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Included in the alert sent to the driver" />
      </Field>
 
      {error && <p style={{ margin: 0, fontSize: "13px", color: "#c62828" }}>{error}</p>}
    </Modal>
  );
}
 
// ─── Edit Sponsor User Modal ──────────────────────────────────────────────────
 
function EditSponsorUserModal({ sponsorUser, onClose, onSaved }: {
  sponsorUser: SponsorUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    userName: sponsorUser.user.name,
    userEmail: sponsorUser.user.email,
    status: sponsorUser.status,
    reason: "",
  });
  const [error, setError] = useState("");
 
  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }
 
  function handleSave() {
    setError("");
    startTransition(async () => {
      try {
        const payload: UpdateSponsorUserInput = { sponsorUserId: sponsorUser.id, reason: form.reason || undefined };
        if (form.userName !== sponsorUser.user.name) payload.userName = form.userName;
        if (form.userEmail !== sponsorUser.user.email) payload.userEmail = form.userEmail;
        if (form.status !== sponsorUser.status) payload.status = form.status;
        await updateSponsorUser(payload);
        onSaved();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }
 
  return (
    <Modal title="Edit Sponsor User" subtitle={`${sponsorUser.sponsor.name} · ${sponsorUser.id}`} onClose={onClose} onSave={handleSave} isPending={isPending}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Name">
          <input style={inputStyle} value={form.userName} onChange={(e) => set("userName", e.target.value)} />
        </Field>
        <Field label="Email">
          <input style={inputStyle} value={form.userEmail} onChange={(e) => set("userEmail", e.target.value)} />
        </Field>
      </div>
 
      <Field label="Status">
        <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
          <option value="active">active</option>
          <option value="pending">pending</option>
          <option value="dropped">dropped</option>
        </select>
      </Field>
 
      <div style={{ backgroundColor: "#f5f5f5", borderRadius: "6px", padding: "10px 14px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
          <strong>Organization:</strong> {sponsorUser.sponsor.name}
        </p>
      </div>
 
      <Field label="Reason for change (optional)">
        <input style={inputStyle} value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Included in the alert sent to this user" />
      </Field>
 
      {error && <p style={{ margin: 0, fontSize: "13px", color: "#c62828" }}>{error}</p>}
    </Modal>
  );
}
 
// ─── Main Page ────────────────────────────────────────────────────────────────
 
export default function AdminProfilesPage() {
  const [tab, setTab] = useState<"drivers" | "sponsors">("drivers");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [sponsorUsers, setSponsorUsers] = useState<SponsorUser[]>([]);
  const [sponsorOptions, setSponsorOptions] = useState<SponsorOption[]>([]);
  const [search, setSearch] = useState("");
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingSponsorUser, setEditingSponsorUser] = useState<SponsorUser | null>(null);
  const [loading, setLoading] = useState(true);
 
  async function load() {
    setLoading(true);
    const [d, su, so] = await Promise.all([
      getDriversWithProfiles(),
      getSponsorUsers(),
      getAllSponsorsForSelect(),
    ]);
    setDrivers(d);
    setSponsorUsers(su);
    setSponsorOptions(so);
    setLoading(false);
  }
 
  useEffect(() => { load(); }, []);
 
  const filteredDrivers = drivers.filter(
    (d) =>
      d.user.name.toLowerCase().includes(search.toLowerCase()) ||
      d.user.email.toLowerCase().includes(search.toLowerCase())
  );
 
  const filteredSponsorUsers = sponsorUsers.filter(
    (su) =>
      su.user.name.toLowerCase().includes(search.toLowerCase()) ||
      su.user.email.toLowerCase().includes(search.toLowerCase()) ||
      su.sponsor.name.toLowerCase().includes(search.toLowerCase())
  );
 
  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: "#fff" }}>
      <div style={{ padding: "60px 100px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ maxWidth: "960px", width: "100%", backgroundColor: "#f5f5f5", borderRadius: "8px", padding: "30px" }}>
 
          <h2 style={{ marginTop: 0, color: "#333", textAlign: "center", fontSize: "35px" }}>
            Profile Management
          </h2>
 
          {/* Controls */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", backgroundColor: "#fff" }}>
              {(["drivers", "sponsors"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(""); }}
                  style={{
                    padding: "8px 20px",
                    border: "none",
                    borderRight: t === "drivers" ? "1px solid #ddd" : "none",
                    background: tab === t ? "#333" : "#fff",
                    color: tab === t ? "#fff" : "#555",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "Arial, sans-serif",
                    textTransform: "capitalize",
                    fontWeight: tab === t ? 600 : 400,
                  }}
                >
                  {t === "drivers" ? `Drivers (${drivers.length})` : `Sponsor Users (${sponsorUsers.length})`}
                </button>
              ))}
            </div>
 
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ ...inputStyle, width: "240px", backgroundColor: "#fff" }}
            />
          </div>
 
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>Loading…</div>
          ) : tab === "drivers" ? (
            <DriverTable drivers={filteredDrivers} onEdit={setEditingDriver} />
          ) : (
            <SponsorUserTable sponsorUsers={filteredSponsorUsers} onEdit={setEditingSponsorUser} />
          )}
        </div>
      </div>
 
      {editingDriver && (
        <EditDriverModal
          driver={editingDriver}
          sponsors={sponsorOptions}
          onClose={() => setEditingDriver(null)}
          onSaved={load}
        />
      )}
      {editingSponsorUser && (
        <EditSponsorUserModal
          sponsorUser={editingSponsorUser}
          onClose={() => setEditingSponsorUser(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
 
// ─── Driver Table ─────────────────────────────────────────────────────────────
 
function DriverTable({ drivers, onEdit }: { drivers: Driver[]; onEdit: (d: Driver) => void }) {
  if (drivers.length === 0) return <EmptyState message="No drivers found" />;
 
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Sponsor</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Points</th>
            <th style={{ ...thStyle, textAlign: "right" }}></th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr
              key={d.id}
              style={{ backgroundColor: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              <td style={{ ...tdStyle, fontWeight: 600 }}>{d.user.name}</td>
              <td style={{ ...tdStyle, color: "#666" }}>{d.user.email}</td>
              <td style={{ ...tdStyle, color: "#666" }}>{d.sponsor?.name ?? "—"}</td>
              <td style={tdStyle}><StatusBadge status={d.status} /></td>
              <td style={tdStyle}>{d.pointsBalance.toLocaleString()}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                <button
                  onClick={() => onEdit(d)}
                  style={{ padding: "5px 14px", border: "1px solid #ccc", borderRadius: "5px", background: "#fff", color: "#333", fontSize: "13px", cursor: "pointer", fontFamily: "Arial, sans-serif" }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
 
// ─── Sponsor User Table ───────────────────────────────────────────────────────
 
function SponsorUserTable({ sponsorUsers, onEdit }: { sponsorUsers: SponsorUser[]; onEdit: (su: SponsorUser) => void }) {
  if (sponsorUsers.length === 0) return <EmptyState message="No sponsor users found" />;
 
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Organization</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: "right" }}></th>
          </tr>
        </thead>
        <tbody>
          {sponsorUsers.map((su) => (
            <tr
              key={su.id}
              style={{ backgroundColor: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              <td style={{ ...tdStyle, fontWeight: 600 }}>{su.user.name}</td>
              <td style={{ ...tdStyle, color: "#666" }}>{su.user.email}</td>
              <td style={{ ...tdStyle, color: "#666" }}>{su.sponsor.name}</td>
              <td style={tdStyle}><StatusBadge status={su.status} /></td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                <button
                  onClick={() => onEdit(su)}
                  style={{ padding: "5px 14px", border: "1px solid #ccc", borderRadius: "5px", background: "#fff", color: "#333", fontSize: "13px", cursor: "pointer", fontFamily: "Arial, sans-serif" }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
 
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px", color: "#666", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
      {message}
    </div>
  );
}