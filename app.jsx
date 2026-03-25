import { useState, useEffect } from "react";

const PILLARS = [
  { id: "trail",   label: "Trail Report",   icon: "⛰️", color: "#7A9E6E", desc: "Hikes, spots, trip recaps & logistics" },
  { id: "kit",     label: "Kit Check",      icon: "🎒", color: "#A0845C", desc: "Gear reviews — packs, knives, boots" },
  { id: "humidor", label: "In the Humidor", icon: "🚬", color: "#C4956A", desc: "Cigar reviews, pairings, slow-down moments" },
  { id: "pour",    label: "The Pour",       icon: "🥃", color: "#C47A3A", desc: "Whiskey, bourbon & coffee" },
  { id: "score",   label: "The Scoreboard", icon: "🏆", color: "#C4726A", desc: "NFL, college football, baseball, motocross" },
  { id: "take",    label: "The Hot Take",   icon: "🔥", color: "#E08C4A", desc: "Opinions, debates, recommendations, lists" },
];

const SYSTEM_PROMPTS = {
  trail:   "You are a rugged, literary outdoor writer with a dry wit and genuine love for the backcountry. Convert raw trail notes into a vivid, personal trail report. Write in first person — conversational but sharp. Capture conditions, standout moments, gear impressions. 3-5 sentences. End with a clear verdict on whether it's worth the trip.",
  kit:     "You are a no-BS gear reviewer who has actually used the stuff. Convert raw notes into a punchy, honest gear review. Lead with the most important thing about the item. Cover real-world performance, not spec sheets. 3-5 sentences. End with a buy/pass/wait verdict.",
  humidor: "You are a refined cigar reviewer with a slow, unhurried, poetic voice. Convert raw notes into a polished humidor entry. Describe draw, construction, flavor evolution (use evocative comparisons — leather, dark cherry, cedar, etc.), and pairing if mentioned. 3-5 sentences. End with a definitive rating in words.",
  pour:    "You are a thoughtful whiskey and coffee writer — appreciative but never pretentious. Convert raw notes into a polished tasting entry. Describe nose, palate, finish for spirits; origin, roast, flavor for coffee. Mention the setting or pairing if relevant. 3-5 sentences. End with when you'd reach for this again.",
  score:   "You are a sharp, opinionated sports writer covering NFL, college football, baseball, and motocross. Convert raw notes or takes into a punchy scoreboard entry. Strong opinions, specific details, wit. Don't hedge — commit fully to the take. 3-5 sentences. End with a prediction or a challenge.",
  take:    "You are a confident, entertaining opinion writer. Convert raw thoughts into a well-structured hot take. Establish the premise fast, argue it hard, acknowledge the counterpoint briefly, then dismiss it. 3-5 sentences. End with a one-liner that lands.",
};

const SEED_ENTRIES = [
  {
    id: 1, pillar: "trail",
    title: "Ridgeline Loop — First Spring Push",
    date: "March 20, 2026",
    body: "Mud season hit hard but the views from the top made every boot-soaked step worth it. Packed the Osprey Talon 22 — perfect weight for a half-day push, nothing rattling, nothing missing. Trail was mostly clear above 3,000ft except for a nasty ice shelf on the north face that caught me off guard on the descent. Spotted two deer and a guy with no trekking poles who clearly had regrets. Run this one again in June when the wildflowers come in — it'll be a completely different trail.",
    rating: 4, tags: ["hiking", "spring", "osprey"],
  },
  {
    id: 2, pillar: "humidor",
    title: "Padrón 1964 Anniversary — Maduro",
    date: "March 15, 2026",
    body: "Paired this one with a pour of Bulleit Rye on a cold Saturday evening and it was exactly the kind of hour I needed. The draw was effortless from first light — cocoa and dark cherry up front, leather and earth on the long finish. Burned dead even for the full 90 minutes without a single touch-up. This is a benchmark smoke, the kind you light when you actually want to sit with your thoughts and mean it. A 10 if you catch it fresh; don't age this one, just smoke it.",
    rating: 5, tags: ["maduro", "padron", "rye-pairing"],
  },
  {
    id: 3, pillar: "score",
    title: "The NFL Draft Class Is Already Overhyped",
    date: "March 18, 2026",
    body: "Every year we do this — crown a quarterback prospect before he's taken a single snap under pressure in a real stadium with real consequences. The tape looks great until it doesn't, and then everyone acts surprised. Three of the last five 'generational' QB prospects are either backups or out of the league entirely. The draft is a guessing game dressed up in analytics and it always has been. Enjoy the pageantry, but hold the coronations until at least week 8 of year two.",
    rating: 0, tags: ["nfl", "draft", "hot-take"],
  },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: "#0a0806", border: "1px solid #2a2018",
  borderRadius: "3px", color: "#c4b8a4", fontSize: "15px",
  fontFamily: "'Crimson Pro', Georgia, serif", lineHeight: "1.6",
  outline: "none", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: "9px", letterSpacing: "2.5px", color: "#4a3d2e",
  fontFamily: "'DM Mono', monospace", display: "block",
  marginBottom: "7px", textTransform: "uppercase",
};

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 16 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ fontSize: `${size}px`, cursor: onChange ? "pointer" : "default", color: s <= (hover || value) ? "#C4956A" : "#2e2820", transition: "color 0.1s", lineHeight: 1 }}
        >★</span>
      ))}
    </div>
  );
}

// ── Pillar Badge ──────────────────────────────────────────────────────────────
function PillarBadge({ pillar }) {
  const p = PILLARS.find(x => x.id === pillar);
  return (
    <span style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: p.color, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: "5px" }}>
      {p.icon} {p.label}
    </span>
  );
}

// ── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, onDelete, onEdit }) {
  const p = PILLARS.find(x => x.id === entry.pillar);
  const [expanded, setExpanded] = useState(false);
  const preview = entry.body.length > 200 ? entry.body.slice(0, 200) + "…" : entry.body;

  return (
    <div style={{ background: "linear-gradient(160deg, #1c1812 0%, #141109 100%)", border: "1px solid #2a221a", borderLeft: `3px solid ${p.color}`, borderRadius: "3px", padding: "20px 22px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
        <PillarBadge pillar={entry.pillar} />
        <span style={{ fontSize: "10px", color: "#4a3d2e", fontFamily: "'DM Mono', monospace" }}>{entry.date}</span>
      </div>
      <h3 onClick={() => setExpanded(!expanded)} style={{ margin: "6px 0 10px", fontSize: "18px", color: "#e4d8c4", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, lineHeight: 1.3, cursor: "pointer" }}>
        {entry.title}
      </h3>
      <p onClick={() => setExpanded(!expanded)} style={{ color: "#8a7a68", lineHeight: "1.75", fontSize: "15px", margin: "0 0 14px", fontFamily: "'Crimson Pro', Georgia, serif", cursor: "pointer" }}>
        {expanded ? entry.body : preview}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {entry.tags.map(t => (
            <span key={t} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "2px", background: "#1e1810", color: "#5a4e3e", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>#{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {entry.rating > 0 && <StarRating value={entry.rating} size={13} />}
          <button onClick={() => onEdit(entry)} style={{ background: "none", border: "1px solid #2a2018", borderRadius: "2px", color: "#7a6a58", cursor: "pointer", fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "1.5px", padding: "4px 10px" }}>✎ EDIT</button>
          <button onClick={() => onDelete(entry.id)} style={{ background: "none", border: "none", color: "#3a2e22", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", padding: 0 }}>× remove</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ entry, onClose, onSave, onDelete }) {
  const [pillar, setPillar] = useState(entry.pillar);
  const [title, setTitle]   = useState(entry.title);
  const [body, setBody]     = useState(entry.body);
  const [date, setDate]     = useState(entry.date);
  const [rating, setRating] = useState(entry.rating);
  const [tagInput, setTagInput] = useState(entry.tags.join(", "));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const p = PILLARS.find(x => x.id === pillar);
  const showRating = ["trail","kit","humidor","pour"].includes(pillar);

  const handleSave = () => {
    if (!title.trim() || !body.trim()) return;
    onSave({ ...entry, pillar, title, body, date, rating: showRating ? rating : 0,
      tags: tagInput.split(",").map(t => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean) });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#131009", border: "1px solid #2e2418", borderRadius: "4px", width: "100%", maxWidth: "600px", maxHeight: "92vh", overflowY: "auto", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={labelStyle}>EDITING ENTRY</div>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#e4d8c4", fontFamily: "'Playfair Display', Georgia, serif" }}>Edit Log Entry</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #2e2418", borderRadius: "2px", color: "#6b5e4e", cursor: "pointer", fontSize: "16px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Pillar */}
        <div style={{ marginBottom: "22px" }}>
          <label style={labelStyle}>Pillar</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }}>
            {PILLARS.map(pp => (
              <button key={pp.id} onClick={() => setPillar(pp.id)} style={{ padding: "9px 8px", borderRadius: "3px", cursor: "pointer", textAlign: "left", border: `1px solid ${pillar===pp.id ? pp.color : "#2a2018"}`, background: pillar===pp.id ? `${pp.color}22` : "#0e0c09", transition: "all 0.15s" }}>
                <div style={{ fontSize: "15px", marginBottom: "3px" }}>{pp.icon}</div>
                <div style={{ fontSize: "9px", color: pillar===pp.id ? pp.color : "#5a4e3e", fontFamily: "'DM Mono', monospace", lineHeight: 1.3 }}>{pp.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, fontFamily: "'Playfair Display', serif", fontSize: "16px" }} />
        </div>

        {/* Body */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Entry Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }} />
        </div>

        {/* Date */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Date</label>
          <input value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. March 20, 2026" style={inputStyle} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="hiking, spring, gear" style={inputStyle} />
          <div style={{ marginTop: "6px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {tagInput.split(",").map(t => t.trim()).filter(Boolean).map(t => (
              <span key={t} style={{ fontSize: "10px", padding: "2px 7px", background: "#1a1610", color: "#5a4e3e", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", borderRadius: "2px" }}>#{t.toLowerCase().replace(/\s+/g,"-")}</span>
            ))}
          </div>
        </div>

        {/* Rating */}
        {showRating && (
          <div style={{ marginBottom: "26px", display: "flex", alignItems: "center", gap: "14px" }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Rating</label>
            <StarRating value={rating} onChange={setRating} size={22} />
            <span style={{ fontSize: "10px", color: "#4a3d2e", fontFamily: "'DM Mono', monospace" }}>{rating}/5</span>
          </div>
        )}

        {/* Save / Cancel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <button onClick={onClose} style={{ padding: "13px", background: "none", border: "1px solid #2a2018", borderRadius: "3px", color: "#6b5e4e", fontSize: "10px", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", cursor: "pointer" }}>CANCEL</button>
          <button onClick={handleSave} style={{ padding: "13px", background: `linear-gradient(135deg, ${p.color}dd, ${p.color}99)`, border: "none", borderRadius: "3px", color: "#0e0c09", fontSize: "10px", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", cursor: "pointer", fontWeight: 700 }}>✓ SAVE CHANGES</button>
        </div>

        {/* Delete */}
        <div style={{ borderTop: "1px solid #1e1810", paddingTop: "14px", textAlign: "center" }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", color: "#4a2e2e", cursor: "pointer", fontSize: "10px", fontFamily: "'DM Mono', monospace", letterSpacing: "1.5px" }}>× DELETE THIS ENTRY</button>
          ) : (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "#6a4040", fontFamily: "'DM Mono', monospace" }}>ARE YOU SURE?</span>
              <button onClick={() => { onDelete(entry.id); onClose(); }} style={{ padding: "5px 14px", background: "#3a1a1a", border: "1px solid #6a3030", borderRadius: "2px", color: "#C4726A", fontSize: "10px", fontFamily: "'DM Mono', monospace", cursor: "pointer" }}>YES, DELETE</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: "5px 14px", background: "none", border: "1px solid #2a2018", borderRadius: "2px", color: "#5a4e3e", fontSize: "10px", fontFamily: "'DM Mono', monospace", cursor: "pointer" }}>KEEP</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Entry Modal ───────────────────────────────────────────────────────────
function NewEntryModal({ onClose, onSave }) {
  const [pillar, setPillar] = useState("trail");
  const [notes, setNotes]   = useState("");
  const [rating, setRating] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const p = PILLARS.find(x => x.id === pillar);

  const handleGenerate = async () => {
    if (!notes.trim()) { setError("Drop some notes first."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: SYSTEM_PROMPTS[pillar] + "\n\nReturn ONLY a JSON object with keys: title (string), body (string), tags (array of 2-4 lowercase hyphenated strings). No markdown, no backticks.",
          messages: [{ role: "user", content: `Raw notes:\n${notes}\nRating: ${rating}/5` }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim();
      setResult(JSON.parse(text));
    } catch { setError("Something went wrong. Try again."); }
    setLoading(false);
  };

  const handleSave = () => {
    if (!result) return;
    const showRating = ["trail","kit","humidor","pour"].includes(pillar);
    onSave({ id: Date.now(), pillar, title: result.title, date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), body: result.body, rating: showRating ? rating : 0, tags: result.tags || [] });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#131009", border: "1px solid #2e2418", borderRadius: "4px", width: "100%", maxWidth: "600px", maxHeight: "92vh", overflowY: "auto", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <div style={labelStyle}>ASH & TRAIL</div>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#e4d8c4", fontFamily: "'Playfair Display', Georgia, serif" }}>New Log Entry</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #2e2418", borderRadius: "2px", color: "#6b5e4e", cursor: "pointer", fontSize: "16px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Pillar select */}
        <div style={{ marginBottom: "22px" }}>
          <label style={labelStyle}>Select Pillar</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {PILLARS.map(pp => (
              <button key={pp.id} onClick={() => { setPillar(pp.id); setResult(null); }} style={{ padding: "10px 8px", borderRadius: "3px", cursor: "pointer", textAlign: "left", border: `1px solid ${pillar===pp.id ? pp.color : "#2a2018"}`, background: pillar===pp.id ? `${pp.color}22` : "#0e0c09", transition: "all 0.15s" }}>
                <div style={{ fontSize: "16px", marginBottom: "3px" }}>{pp.icon}</div>
                <div style={{ fontSize: "9px", color: pillar===pp.id ? pp.color : "#5a4e3e", fontFamily: "'DM Mono', monospace", lineHeight: 1.3 }}>{pp.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Your Raw Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={`Bullet points, brain dump, voice-to-text — anything. Claude shapes it into a polished ${p.label} entry...`} style={{ ...inputStyle, minHeight: "130px", resize: "vertical" }} />
        </div>

        {/* Rating */}
        {["trail","kit","humidor","pour"].includes(pillar) && (
          <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "14px" }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Rating</label>
            <StarRating value={rating} onChange={setRating} size={20} />
          </div>
        )}

        {error && <div style={{ color: "#C4726A", fontSize: "11px", fontFamily: "'DM Mono', monospace", marginBottom: "14px" }}>{error}</div>}

        {!result ? (
          <button onClick={handleGenerate} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#1a1610" : `linear-gradient(135deg, ${p.color}dd, ${p.color}99)`, border: `1px solid ${p.color}55`, borderRadius: "3px", color: loading ? "#4a3d2e" : "#0e0c09", fontSize: "10px", letterSpacing: "2.5px", fontFamily: "'DM Mono', monospace", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700 }}>
            {loading ? "⟳  CRAFTING YOUR ENTRY..." : "✦  GENERATE ENTRY"}
          </button>
        ) : (
          <div>
            <div style={{ background: "#0c0a07", border: `1px solid ${p.color}44`, borderLeft: `3px solid ${p.color}`, borderRadius: "3px", padding: "20px", marginBottom: "16px" }}>
              <PillarBadge pillar={pillar} />
              <h3 style={{ margin: "8px 0 12px", fontSize: "19px", color: "#e4d8c4", fontFamily: "'Playfair Display', Georgia, serif" }}>{result.title}</h3>
              <p style={{ color: "#9a8a78", lineHeight: "1.75", fontSize: "15px", margin: "0 0 14px", fontFamily: "'Crimson Pro', Georgia, serif" }}>{result.body}</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {result.tags?.map(t => <span key={t} style={{ fontSize: "10px", padding: "2px 7px", background: "#1a1610", color: "#5a4e3e", fontFamily: "'DM Mono', monospace", borderRadius: "2px" }}>#{t}</span>)}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button onClick={() => setResult(null)} style={{ padding: "12px", background: "none", border: "1px solid #2a2018", borderRadius: "3px", color: "#6b5e4e", fontSize: "10px", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", cursor: "pointer" }}>↺  REGENERATE</button>
              <button onClick={handleSave} style={{ padding: "12px", background: `linear-gradient(135deg, ${p.color}dd, ${p.color}99)`, border: "none", borderRadius: "3px", color: "#0e0c09", fontSize: "10px", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", cursor: "pointer", fontWeight: 700 }}>✓  SAVE TO LOG</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [entries, setEntries] = useState(() => {
    try { const saved = localStorage.getItem("ash_entries"); return saved ? JSON.parse(saved) : SEED_ENTRIES; } catch { return SEED_ENTRIES; }
  });
  const [filter, setFilter]     = useState("all");
  const [showNew, setShowNew]   = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  useEffect(() => { localStorage.setItem("ash_entries", JSON.stringify(entries)); }, [entries]);

  const filtered    = filter === "all" ? entries : entries.filter(e => e.pillar === filter);
  const handleSave  = entry => setEntries(prev => [entry, ...prev]);
  const handleDelete = id  => setEntries(prev => prev.filter(e => e.id !== id));
  const handleUpdate = upd => setEntries(prev => prev.map(e => e.id === upd.id ? upd : e));
  const counts = PILLARS.reduce((acc, p) => { acc[p.id] = entries.filter(e => e.pillar === p.id).length; return acc; }, {});

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0c09 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0e0c09; }
        ::-webkit-scrollbar-thumb { background: #2e2418; border-radius: 2px; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes headerIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .fade-up   { animation: fadeUp   0.4s ease both; }
        .header-in { animation: headerIn 0.7s ease both; }
        input:focus, textarea:focus { border-color: #3a2e22 !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0e0c09", color: "#e4d8c4" }}>
        {/* Noise texture */}
        <div style={{ position: "fixed", inset: 0, opacity: 0.018, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: "740px", margin: "0 auto", padding: "0 20px 80px" }}>

          {/* Header */}
          <div className="header-in" style={{ paddingTop: "56px", paddingBottom: "36px", borderBottom: "1px solid #1a1610" }}>
            <div style={{ fontSize: "9px", letterSpacing: "5px", color: "#3a2e22", fontFamily: "'DM Mono', monospace", marginBottom: "12px" }}>PERSONAL LOG — EST. 2026</div>
            <h1 style={{ fontSize: "clamp(48px, 10vw, 72px)", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, color: "#e4d8c4", lineHeight: 0.95, letterSpacing: "-2px" }}>
              Ash <span style={{ color: "#3a2e22" }}>&</span> Trail
            </h1>
            <p style={{ marginTop: "14px", color: "#4e4438", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "18px", fontStyle: "italic" }}>
              Gear. Smokes. Pours. Trails. Takes. All of it.
            </p>
          </div>

          {/* Stat strip */}
          <div style={{ display: "flex", borderBottom: "1px solid #1a1610", overflowX: "auto" }}>
            {PILLARS.map(p => (
              <div key={p.id} style={{ flex: 1, minWidth: "60px", padding: "12px 8px", textAlign: "center", borderRight: "1px solid #1a1610" }}>
                <div style={{ fontSize: "14px", marginBottom: "2px" }}>{p.icon}</div>
                <div style={{ fontSize: "18px", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: counts[p.id] > 0 ? p.color : "#252018", lineHeight: 1 }}>{counts[p.id]}</div>
              </div>
            ))}
            <div style={{ padding: "12px 16px", display: "flex", alignItems: "center" }}>
              <div style={{ fontSize: "9px", color: "#2e2418", fontFamily: "'DM Mono', monospace", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{entries.length} TOTAL</div>
            </div>
          </div>

          {/* Filter + New button */}
          <div style={{ padding: "18px 0", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {[{ id: "all", label: "All", color: "#C4956A" }, ...PILLARS].map(p => (
              <button key={p.id} onClick={() => setFilter(p.id)} style={{ padding: "6px 12px", borderRadius: "2px", cursor: "pointer", border: `1px solid ${filter===p.id ? p.color : "#221c14"}`, background: filter===p.id ? `${p.color}16` : "transparent", color: filter===p.id ? p.color : "#4a3d2e", fontSize: "9px", letterSpacing: "1.5px", fontFamily: "'DM Mono', monospace", transition: "all 0.15s", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                {p.id !== "all" && `${p.icon} `}{p.label || "All"}
              </button>
            ))}
            <button onClick={() => setShowNew(true)} style={{ marginLeft: "auto", padding: "8px 20px", background: "linear-gradient(135deg, #C4956A, #9A6A40)", border: "none", borderRadius: "2px", color: "#0e0c09", fontSize: "10px", letterSpacing: "2.5px", fontFamily: "'DM Mono', monospace", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 12px rgba(196,149,106,0.13)" }}>
              + NEW ENTRY
            </button>
          </div>

          {/* Entries */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 20px", color: "#2e2418", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "19px", fontStyle: "italic" }}>
                Nothing here yet. Hit <span style={{ color: "#C4956A" }}>+ New Entry</span> and start the log.
              </div>
            ) : (
              filtered.map((entry, i) => (
                <div key={entry.id} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                  <EntryCard entry={entry} onDelete={handleDelete} onEdit={setEditEntry} />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: "48px", paddingTop: "20px", borderTop: "1px solid #16120e", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "9px", color: "#252018", fontFamily: "'DM Mono', monospace", letterSpacing: "2px" }}>ASH & TRAIL</span>
            <span style={{ fontSize: "9px", color: "#252018", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>POWERED BY CLAUDE</span>
          </div>
        </div>
      </div>

      {showNew   && <NewEntryModal onClose={() => setShowNew(false)}   onSave={handleSave} />}
      {editEntry && <EditModal entry={editEntry} onClose={() => setEditEntry(null)} onSave={handleUpdate} onDelete={handleDelete} />}
    </>
  );
}
