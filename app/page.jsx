"use client";
import { useState, useEffect, useRef } from "react";

const ENDPOINTS = [
  { id: 1, name: "GET /accounts", group: "AIS", berlin: "Account List", status: "compliant", sca: "Required (first access)", entity: "LU", priority: "MVP", latency: 142, uptime: 99.98 },
  { id: 2, name: "GET /accounts/{id}", group: "AIS", berlin: "Account Details", status: "compliant", sca: "Exemption eligible", entity: "LU", priority: "MVP", latency: 98, uptime: 99.99 },
  { id: 3, name: "GET /accounts/{id}/balances", group: "AIS", berlin: "Balance Report", status: "compliant", sca: "Exemption eligible", entity: "LU", priority: "MVP", latency: 115, uptime: 99.97 },
  { id: 4, name: "GET /accounts/{id}/transactions", group: "AIS", berlin: "Transaction List", status: "compliant", sca: "Required (>90 days)", entity: "LU", priority: "MVP", latency: 210, uptime: 99.95 },
  { id: 5, name: "POST /payments/sepa-credit-transfers", group: "PIS", berlin: "SEPA CT Initiation", status: "compliant", sca: "Always required", entity: "LU", priority: "MVP", latency: 320, uptime: 99.94 },
  { id: 6, name: "GET /payments/{paymentId}/status", group: "PIS", berlin: "Payment Status", status: "compliant", sca: "Not required", entity: "LU", priority: "MVP", latency: 88, uptime: 99.99 },
  { id: 7, name: "DELETE /payments/{paymentId}", group: "PIS", berlin: "Payment Cancellation", status: "in-progress", sca: "Required", entity: "LU", priority: "MVP", latency: null, uptime: null },
  { id: 8, name: "POST /consents", group: "AIS", berlin: "Consent Creation", status: "compliant", sca: "Always required", entity: "LU", priority: "MVP", latency: 185, uptime: 99.96 },
  { id: 9, name: "GET /consents/{consentId}", group: "AIS", berlin: "Consent Status", status: "compliant", sca: "Not required", entity: "LU", priority: "MVP", latency: 72, uptime: 99.99 },
  { id: 10, name: "DELETE /consents/{consentId}", group: "AIS", berlin: "Consent Revocation", status: "compliant", sca: "Not required", entity: "LU", priority: "MVP", latency: 65, uptime: 99.99 },
  { id: 11, name: "POST /signing-baskets", group: "PIS", berlin: "Signing Basket", status: "planned", sca: "Required", entity: "IE", priority: "Phase 2", latency: null, uptime: null },
  { id: 12, name: "POST /funds-confirmations", group: "PIIS", berlin: "Funds Confirmation", status: "in-progress", sca: "Required", entity: "LU", priority: "MVP", latency: null, uptime: null },
  { id: 13, name: "GET /card-accounts", group: "AIS", berlin: "Card Account List", status: "planned", sca: "Required", entity: "IE", priority: "Phase 2", latency: null, uptime: null },
];

const CONSENT_STAGES = [
  { id: "request", label: "Consent Requested", desc: "TPP initiates POST /consents with access scope", icon: "📋", color: "#6EE7B7" },
  { id: "redirect", label: "PSU Redirect", desc: "ASPSP redirects PSU to authentication portal", icon: "🔗", color: "#93C5FD" },
  { id: "sca", label: "SCA Challenge", desc: "Strong Customer Authentication via device binding", icon: "🔐", color: "#FCD34D" },
  { id: "authorised", label: "Consent Authorised", desc: "PSU grants explicit consent — valid up to 90 days", icon: "✅", color: "#34D399" },
  { id: "active", label: "Data Access Active", desc: "TPP accesses accounts (max 4x/day without PSU)", icon: "📊", color: "#818CF8" },
  { id: "expired", label: "Expired / Revoked", desc: "Consent expires or PSU revokes via dashboard", icon: "⏱️", color: "#F87171" },
];

const SCA_METHODS = [
  { method: "Redirect (OAuth2)", desc: "PSU redirected to ASPSP portal for authentication", strength: "High", flow: "redirect", recommended: true },
  { method: "Decoupled", desc: "ASPSP sends push notification to PSU device", strength: "High", flow: "decoupled", recommended: true },
  { method: "Embedded", desc: "TPP collects credentials and forwards to ASPSP", strength: "Medium", flow: "embedded", recommended: false },
];

const COMPLIANCE_ITEMS = [
  { area: "Consent Management", items: [
    { req: "90-day consent validity maximum", status: "done" },
    { req: "Explicit consent scope (accounts, balances, transactions)", status: "done" },
    { req: "Consent revocation via DELETE /consents/{id}", status: "done" },
    { req: "Consent status tracking (received → valid → expired)", status: "done" },
    { req: "Re-authentication every 90 days for AIS", status: "done" },
  ]},
  { area: "Strong Customer Authentication", items: [
    { req: "SCA for payment initiation (always)", status: "done" },
    { req: "SCA for first AIS access", status: "done" },
    { req: "SCA exemption for subsequent AIS (4x/day)", status: "done" },
    { req: "Device binding for SCA factors", status: "in-progress" },
    { req: "Dynamic linking for payment amount + payee", status: "done" },
  ]},
  { area: "API Standards", items: [
    { req: "Berlin Group NextGenPSD2 v1.3.x endpoints", status: "done" },
    { req: "ASPSP Gateway integration", status: "done" },
    { req: "POST /confirmation routing via ASPSP Gateway", status: "done" },
    { req: "Payment cancellation (DELETE /payments)", status: "in-progress" },
    { req: "Funds confirmation (PIIS) endpoint", status: "in-progress" },
  ]},
  { area: "Regulatory & Operational", items: [
    { req: "CSSF (Luxembourg) reporting compliance", status: "done" },
    { req: "CBI (Ireland) regulatory alignment", status: "planned" },
    { req: "Fallback mechanism (screen scraping alternative)", status: "done" },
    { req: "TPP certificate validation (eIDAS QWAC/QSealC)", status: "done" },
    { req: "Incident reporting within 4 hours", status: "done" },
  ]},
];

function StatusBadge({ status }) {
  const map = {
    compliant: { bg: "rgba(52,211,153,0.15)", color: "#34D399", border: "rgba(52,211,153,0.3)", label: "Compliant" },
    "in-progress": { bg: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "rgba(251,191,36,0.3)", label: "In Progress" },
    planned: { bg: "rgba(148,163,184,0.15)", color: "#94A3B8", border: "rgba(148,163,184,0.3)", label: "Planned" },
    done: { bg: "rgba(52,211,153,0.15)", color: "#34D399", border: "rgba(52,211,153,0.3)", label: "✓" },
  };
  const s = map[status] || map.planned;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function AnimatedCounter({ end, duration = 1800, suffix = "", decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(eased * end);
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [end, duration]);
  return <span>{decimals ? val.toFixed(decimals) : Math.round(val)}{suffix}</span>;
}

function ProgressRing({ percent, size = 56, stroke = 5, color = "#34D399" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

export default function PSD2Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [consentStage, setConsentStage] = useState(0);
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredEndpoint, setHoveredEndpoint] = useState(null);
  const timerRef = useRef(null);

  const totalEndpoints = ENDPOINTS.length;
  const compliant = ENDPOINTS.filter(e => e.status === "compliant").length;
  const inProgress = ENDPOINTS.filter(e => e.status === "in-progress").length;
  const planned = ENDPOINTS.filter(e => e.status === "planned").length;
  const compliancePercent = Math.round((compliant / totalEndpoints) * 100);

  const totalChecks = COMPLIANCE_ITEMS.reduce((a, c) => a + c.items.length, 0);
  const doneChecks = COMPLIANCE_ITEMS.reduce((a, c) => a + c.items.filter(i => i.status === "done").length, 0);
  const regulatoryPercent = Math.round((doneChecks / totalChecks) * 100);

  const filtered = ENDPOINTS.filter(e =>
    (filterGroup === "all" || e.group === filterGroup) &&
    (filterStatus === "all" || e.status === filterStatus)
  );

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setConsentStage(prev => {
          if (prev >= CONSENT_STAGES.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  const playConsent = () => { setConsentStage(0); setIsPlaying(true); };

  const tabs = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "endpoints", label: "API Endpoints", icon: "⬡" },
    { id: "consent", label: "Consent Lifecycle", icon: "↻" },
    { id: "sca", label: "SCA Flows", icon: "⊡" },
    { id: "compliance", label: "Compliance Matrix", icon: "☰" },
  ];

  const fontLink = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0B0F1A", color: "#E2E8F0", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <link href={fontLink} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.15); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.25); } }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; backdrop-filter: blur(20px); }
        .card:hover { border-color: rgba(255,255,255,0.1); }
        .tab-btn { padding: 10px 18px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: #94A3B8; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; transition: all 0.25s; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .tab-btn:hover { background: rgba(255,255,255,0.04); color: #CBD5E1; }
        .tab-btn.active { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); color: #A5B4FC; }
        .filter-btn { padding: 6px 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: transparent; color: #94A3B8; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500; transition: all 0.2s; }
        .filter-btn:hover { background: rgba(255,255,255,0.04); }
        .filter-btn.active { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); color: #A5B4FC; }
        .endpoint-row { display: grid; grid-template-columns: 2.2fr 0.6fr 1.4fr 0.8fr 0.6fr 0.7fr; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); transition: all 0.15s; cursor: pointer; gap: 8px; }
        .endpoint-row:hover { background: rgba(99,102,241,0.06); }
        .consent-node { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 16px 12px; border-radius: 14px; border: 2px solid rgba(255,255,255,0.06); transition: all 0.5s cubic-bezier(0.4,0,0.2,1); cursor: pointer; min-width: 0; position: relative; }
        .consent-node.active { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.08); transform: scale(1.04); }
        .consent-node.completed { border-color: rgba(52,211,153,0.4); background: rgba(52,211,153,0.06); }
        .play-btn { padding: 10px 24px; border: 1px solid rgba(99,102,241,0.4); border-radius: 10px; background: rgba(99,102,241,0.15); color: #A5B4FC; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .play-btn:hover { background: rgba(99,102,241,0.25); transform: translateY(-1px); }
        .sca-card { padding: 20px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: all 0.2s; }
        .sca-card:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04); }
        .compliance-section { margin-bottom: 20px; }
        .compliance-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; }
        .compliance-row:last-child { border-bottom: none; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .gradient-text { background: linear-gradient(135deg, #A5B4FC, #818CF8, #6366F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-glow { position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 600px; height: 300px; background: radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%); pointer-events: none; }
        .dot-grid { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
      `}</style>

      <div className="dot-grid" />
      <div className="header-glow" />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366F1, #818CF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>◈</div>
              <span className="mono" style={{ fontSize: 11, color: "#64748B", letterSpacing: 2, textTransform: "uppercase" }}>PSD2 Compliance Dashboard</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2 }}>
              <span className="gradient-text">Open Banking</span>{" "}
              <span style={{ color: "#F1F5F9" }}>API Compliance</span>
            </h1>
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>Berlin Group NextGenPSD2 · ASPSP Gateway · Multi-Entity (LU/IE)</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: "#34D399", fontWeight: 500 }}>Live Monitoring</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "#475569", textAlign: "right" }}>
              Go-Live: April 2026<br/>v1.3.12 · Berlin Group
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 20, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 32px 40px" }}>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "API Compliance", value: <AnimatedCounter end={compliancePercent} suffix="%" />, sub: `${compliant}/${totalEndpoints} endpoints`, ring: compliancePercent, ringColor: "#34D399" },
                { label: "Regulatory Readiness", value: <AnimatedCounter end={regulatoryPercent} suffix="%" />, sub: `${doneChecks}/${totalChecks} checks passed`, ring: regulatoryPercent, ringColor: "#818CF8" },
                { label: "Avg Latency", value: <AnimatedCounter end={148} suffix="ms" />, sub: "Berlin Group SLA: <500ms", ring: 70, ringColor: "#FBBF24" },
                { label: "Platform Uptime", value: <AnimatedCounter end={99.97} suffix="%" decimals={2} />, sub: "Target: 99.95%", ring: 99.97, ringColor: "#34D399" },
              ].map((m, i) => (
                <div key={i} className="card" style={{ padding: 20, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 8, letterSpacing: 0.3 }}>{m.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "#F1F5F9", lineHeight: 1 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{m.sub}</div>
                    </div>
                    <ProgressRing percent={m.ring} color={m.ringColor} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#CBD5E1" }}>Endpoint Status Breakdown</h3>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Compliant", count: compliant, color: "#34D399", bg: "rgba(52,211,153,0.1)" },
                    { label: "In Progress", count: inProgress, color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
                    { label: "Planned", count: planned, color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, padding: 14, borderRadius: 12, background: s.bg, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 11, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.04)", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${(compliant/totalEndpoints)*100}%`, background: "linear-gradient(90deg, #34D399, #6EE7B7)", borderRadius: 4, transition: "width 1s ease" }} />
                  <div style={{ width: `${(inProgress/totalEndpoints)*100}%`, background: "linear-gradient(90deg, #FBBF24, #FCD34D)", transition: "width 1s ease" }} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>By Service Group</div>
                  {["AIS", "PIS", "PIIS"].map(g => {
                    const groupEps = ENDPOINTS.filter(e => e.group === g);
                    const groupCompliant = groupEps.filter(e => e.status === "compliant").length;
                    return (
                      <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span className="mono" style={{ fontSize: 11, color: "#818CF8", width: 36 }}>{g}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                          <div style={{ width: `${(groupCompliant/groupEps.length)*100}%`, height: "100%", background: "#818CF8", borderRadius: 3, transition: "width 1s ease" }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: "#64748B" }}>{groupCompliant}/{groupEps.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#CBD5E1" }}>Implementation Timeline</h3>
                {[
                  { phase: "Phase 1 — Foundation", date: "Oct–Dec 2025", status: "done", items: "ASPSP Gateway connectivity, consent APIs, AIS endpoints" },
                  { phase: "Phase 2 — Payments", date: "Jan–Feb 2026", status: "done", items: "PIS initiation, status tracking, SCA integration" },
                  { phase: "Phase 3 — Compliance", date: "Mar 2026", status: "in-progress", items: "Payment cancellation, PIIS, device binding" },
                  { phase: "Phase 4 — Go-Live", date: "Apr 2026", status: "planned", items: "Production deployment, regulatory sign-off, monitoring" },
                  { phase: "Phase 5 — Ireland", date: "Q3 2026", status: "planned", items: "CBI entity, card accounts, signing baskets" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: p.status === "done" ? "#34D399" : p.status === "in-progress" ? "#FBBF24" : "rgba(255,255,255,0.1)",
                        border: p.status === "in-progress" ? "2px solid #FBBF24" : "none",
                        animation: p.status === "in-progress" ? "pulse 2s infinite" : "none"
                      }} />
                      {i < 4 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: p.status === "in-progress" ? "#FBBF24" : "#CBD5E1" }}>{p.phase}</span>
                        <span className="mono" style={{ fontSize: 10, color: "#475569" }}>{p.date}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{p.items}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === "endpoints" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#64748B", alignSelf: "center", marginRight: 4 }}>Group:</span>
              {["all", "AIS", "PIS", "PIIS"].map(g => (
                <button key={g} className={`filter-btn ${filterGroup === g ? "active" : ""}`} onClick={() => setFilterGroup(g)}>
                  {g === "all" ? "All" : g}
                </button>
              ))}
              <span style={{ fontSize: 12, color: "#64748B", alignSelf: "center", marginLeft: 12, marginRight: 4 }}>Status:</span>
              {["all", "compliant", "in-progress", "planned"].map(s => (
                <button key={s} className={`filter-btn ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                </button>
              ))}
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              <div className="endpoint-row" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "default" }}>
                {["Endpoint", "Group", "Berlin Group Spec", "SCA", "Entity", "Status"].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
                ))}
              </div>
              {filtered.map(ep => (
                <div key={ep.id}>
                  <div className="endpoint-row" onClick={() => setSelectedEndpoint(selectedEndpoint === ep.id ? null : ep.id)}
                    onMouseEnter={() => setHoveredEndpoint(ep.id)} onMouseLeave={() => setHoveredEndpoint(null)}
                    style={{ background: selectedEndpoint === ep.id ? "rgba(99,102,241,0.06)" : hoveredEndpoint === ep.id ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <span className="mono" style={{ fontSize: 12, color: "#A5B4FC" }}>{ep.name}</span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{ep.group}</span>
                    <span style={{ fontSize: 12, color: "#CBD5E1" }}>{ep.berlin}</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{ep.sca}</span>
                    <span className="mono" style={{ fontSize: 11, color: "#818CF8" }}>{ep.entity}</span>
                    <StatusBadge status={ep.status} />
                  </div>
                  {selectedEndpoint === ep.id && (
                    <div style={{ padding: "12px 16px 16px", background: "rgba(99,102,241,0.03)", borderBottom: "1px solid rgba(255,255,255,0.04)", animation: "fadeUp 0.3s ease" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>Priority</div>
                          <div className="mono" style={{ fontSize: 13, color: "#A5B4FC", marginTop: 4 }}>{ep.priority}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>Latency</div>
                          <div className="mono" style={{ fontSize: 13, color: ep.latency ? (ep.latency < 200 ? "#34D399" : "#FBBF24") : "#475569", marginTop: 4 }}>{ep.latency ? `${ep.latency}ms` : "N/A"}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>Uptime</div>
                          <div className="mono" style={{ fontSize: 13, color: ep.uptime ? "#34D399" : "#475569", marginTop: 4 }}>{ep.uptime ? `${ep.uptime}%` : "N/A"}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>SCA Requirement</div>
                          <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 4 }}>{ep.sca}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONSENT LIFECYCLE TAB */}
        {activeTab === "consent" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#CBD5E1" }}>Consent Lifecycle Flow</h3>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Interactive PSD2 consent journey — TPP to ASPSP via gateway</p>
              </div>
              <button className="play-btn" onClick={playConsent}>
                {isPlaying ? "⏸ Playing..." : "▶ Simulate Flow"}
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                {CONSENT_STAGES.map((stage, i) => (
                  <div key={stage.id}
                    className={`consent-node ${i === consentStage ? "active" : ""} ${i < consentStage ? "completed" : ""}`}
                    onClick={() => { setConsentStage(i); setIsPlaying(false); }}
                    style={{ animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{stage.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: i <= consentStage ? stage.color : "#64748B", marginBottom: 4, lineHeight: 1.3 }}>{stage.label}</div>
                    <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.4 }}>{stage.desc}</div>
                    {i <= consentStage && (
                      <div style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: i < consentStage ? "#34D399" : "#818CF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                        {i < consentStage ? "✓" : "●"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 20, padding: 24 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ fontSize: 40 }}>{CONSENT_STAGES[consentStage].icon}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: CONSENT_STAGES[consentStage].color, marginBottom: 4 }}>{CONSENT_STAGES[consentStage].label}</h4>
                  <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>{CONSENT_STAGES[consentStage].desc}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {consentStage === 0 && <>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>POST /consents</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>TPP sends access scope: accounts, balances, transactions</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>Response: 201 Created</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>consentId + _links.scaRedirect returned</div>
                      </div>
                    </>}
                    {consentStage === 1 && <>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>OAuth2 Redirect</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>PSU browser redirected to ASPSP authorization URL via gateway</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>ASPSP Auth Portal</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Authentication handled through bank's digital identity platform</div>
                      </div>
                    </>}
                    {consentStage === 2 && <>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>2-Factor Auth</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Knowledge (password) + Possession (device) or Inherence (biometric)</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>Device Binding</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>SCA device registered and bound to PSU identity</div>
                      </div>
                    </>}
                    {consentStage === 3 && <>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>Consent Status: valid</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>GET /consents/{'{consentId}'} returns status=valid</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>Validity: 90 days</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Consent valid until expiry or PSU revocation</div>
                      </div>
                    </>}
                    {consentStage === 4 && <>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>AIS Access</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>TPP can access accounts up to 4x/day without PSU presence</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>Rate Limiting</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Beyond 4x/day requires fresh SCA from PSU</div>
                      </div>
                    </>}
                    {consentStage === 5 && <>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>DELETE /consents/{'{consentId}'}</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>PSU can revoke consent at any time via ASPSP dashboard</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "#6366F1" }}>Auto-Expiry</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>System automatically expires consents after 90 days</div>
                      </div>
                    </>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCA FLOWS TAB */}
        {activeTab === "sca" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#CBD5E1", marginBottom: 4 }}>Strong Customer Authentication Approaches</h3>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>PSD2 RTS on SCA — Authentication models supported via ASPSP Gateway</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {SCA_METHODS.map((m, i) => (
                <div key={i} className="sca-card" style={{ animation: `fadeUp 0.4s ease ${i * 0.1}s both`, position: "relative" }}>
                  {m.recommended && (
                    <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, padding: "2px 8px", borderRadius: 12, background: "rgba(52,211,153,0.15)", color: "#34D399", fontWeight: 600 }}>Recommended</div>
                  )}
                  <div style={{ fontSize: 11, color: "#818CF8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{m.flow}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>{m.method}</h4>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 12 }}>{m.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>Security Strength</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: m.strength === "High" ? "#34D399" : "#FBBF24" }}>{m.strength}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#CBD5E1", marginBottom: 16 }}>SCA Factor Requirements</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { factor: "Knowledge", icon: "🧠", examples: "Password, PIN, security question", color: "#818CF8" },
                  { factor: "Possession", icon: "📱", examples: "Mobile device, hardware token, smart card", color: "#34D399" },
                  { factor: "Inherence", icon: "🔏", examples: "Fingerprint, facial recognition, voice", color: "#FBBF24" },
                ].map((f, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: f.color, marginBottom: 4 }}>{f.factor}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{f.examples}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ fontSize: 12, color: "#A5B4FC", fontWeight: 600, marginBottom: 4 }}>PSD2 Requirement</div>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                  SCA must use at least 2 of the 3 factors above. The authentication code must be dynamically linked to the payment amount and payee for payment initiation (dynamic linking). Exemptions apply for trusted beneficiaries, low-value transactions (&lt;€30, cumulative &lt;€100), and recurring payments of same amount to same payee.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE MATRIX TAB */}
        {activeTab === "compliance" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#CBD5E1" }}>Regulatory Compliance Matrix</h3>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>PSD2 RTS requirements tracking — {doneChecks}/{totalChecks} checks passed ({regulatoryPercent}%)</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {[
                  { label: "Complete", color: "#34D399", count: doneChecks },
                  { label: "In Progress", color: "#FBBF24", count: COMPLIANCE_ITEMS.reduce((a, c) => a + c.items.filter(i => i.status === "in-progress").length, 0) },
                  { label: "Planned", color: "#94A3B8", count: COMPLIANCE_ITEMS.reduce((a, c) => a + c.items.filter(i => i.status === "planned").length, 0) },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                    <span style={{ fontSize: 11, color: "#64748B" }}>{l.label} ({l.count})</span>
                  </div>
                ))}
              </div>
            </div>
            {COMPLIANCE_ITEMS.map((section, si) => {
              const sectionDone = section.items.filter(i => i.status === "done").length;
              const sectionPct = Math.round((sectionDone / section.items.length) * 100);
              return (
                <div key={si} className="card compliance-section" style={{ overflow: "hidden", animation: `fadeUp 0.4s ease ${si * 0.08}s both` }}>
                  <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>{section.area}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${sectionPct}%`, height: "100%", background: sectionPct === 100 ? "#34D399" : "#818CF8", borderRadius: 2, transition: "width 1s ease" }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: "#64748B" }}>{sectionDone}/{section.items.length}</span>
                    </div>
                  </div>
                  {section.items.map((item, ii) => (
                    <div key={ii} className="compliance-row">
                      <span style={{ color: "#94A3B8" }}>{item.req}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

