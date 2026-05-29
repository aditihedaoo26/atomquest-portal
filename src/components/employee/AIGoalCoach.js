import React, { useState } from "react";
import { THRUST_AREAS, UOM_OPTIONS } from "../../utils/helpers";

export default function AIGoalCoach({ onGoalGenerated }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateGoal = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: `You are an expert OKR/KPI coach. Convert vague goal ideas into SMART goals.
Return ONLY a JSON object (no markdown, no backticks):
{
  "title": "Concise SMART goal title (max 60 chars)",
  "description": "How to achieve this goal in 2 sentences",
  "thrustArea": one of [${THRUST_AREAS.map(a=>`"${a}"`).join(",")}],
  "uom": one of ["min","max","zero","timeline"],
  "uomExplanation": "Why this UoM was chosen",
  "target": "numeric target value only (number as string)",
  "weightage": "suggested weightage 10-40",
  "smartBreakdown": {
    "specific": "one line",
    "measurable": "one line", 
    "achievable": "one line",
    "relevant": "one line",
    "timeBound": "one line"
  }
}`,
          messages: [{ role: "user", content: `Convert this goal idea into a SMART goal: "${input}"` }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch(e) {
      setError("AI Coach failed. Check API connection.");
    }
    setLoading(false);
  };

  const uomLabels = { min:"Higher is better", max:"Lower is better", zero:"Zero = success", timeline:"Date-based" };

  return (
    <div style={{ background:"#fff", border:"1.5px solid #EBEBEB", borderRadius:"12px", overflow:"hidden", marginBottom:"1.5rem" }}>
      {/* Header */}
      <div style={{ background:"#111", padding:"1rem 1.5rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <div style={{ fontSize:"1.5rem" }}>🧠</div>
        <div>
          <div style={{ color:"#F5C500", fontWeight:700, fontSize:"0.95rem" }}>AI Goal Coach</div>
          <div style={{ color:"#888", fontSize:"0.75rem" }}>Type a rough idea → AI writes a perfect SMART goal</div>
        </div>
      </div>

      <div style={{ padding:"1.25rem" }}>
        {/* Input */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem" }}>
          <input
            className="form-input"
            placeholder='e.g. "I want to improve customer satisfaction" or "reduce team costs"'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generateGoal()}
            style={{ flex:1 }}
          />
          <button
            onClick={generateGoal}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ whiteSpace:"nowrap", background:loading?"#EEE":"#111", color:loading?"#999":"#F5C500", minWidth:"120px" }}
          >
            {loading ? "✨ Writing..." : "✨ Generate"}
          </button>
        </div>

        {error && <div style={{ background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"6px", padding:"0.75rem", color:"#991B1B", fontSize:"0.8rem", marginBottom:"1rem" }}>⚠ {error}</div>}

        {/* Result */}
        {result && (
          <div style={{ border:"1.5px solid #F5C500", borderRadius:"10px", overflow:"hidden" }}>
            {/* Goal preview */}
            <div style={{ background:"#FFFBEB", padding:"1.25rem", borderBottom:"1px solid #FDE68A" }}>
              <div style={{ fontSize:"0.65rem", fontWeight:700, color:"#854D0E", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>✨ AI Generated SMART Goal</div>
              <div style={{ fontWeight:700, fontSize:"1rem", color:"#111", marginBottom:"0.5rem" }}>{result.title}</div>
              <div style={{ fontSize:"0.8rem", color:"#555", lineHeight:1.6, marginBottom:"1rem" }}>{result.description}</div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.65rem" }}>
                {[
                  { label:"Thrust Area", value:result.thrustArea },
                  { label:"UoM", value:uomLabels[result.uom] },
                  { label:"Target", value:result.target },
                  { label:"Suggested Weight", value:result.weightage+"%" },
                ].map(item => (
                  <div key={item.label} style={{ background:"#fff", border:"1px solid #FDE68A", borderRadius:"6px", padding:"0.6rem 0.75rem" }}>
                    <div style={{ fontSize:"0.65rem", fontWeight:700, color:"#854D0E", textTransform:"uppercase", marginBottom:"0.2rem" }}>{item.label}</div>
                    <div style={{ fontSize:"0.82rem", fontWeight:600, color:"#111" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SMART breakdown */}
            <div style={{ padding:"1rem 1.25rem", background:"#FAFAFA" }}>
              <div style={{ fontSize:"0.7rem", fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.65rem" }}>SMART Breakdown</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                {result.smartBreakdown && Object.entries(result.smartBreakdown).map(([key, val]) => (
                  <div key={key} style={{ display:"flex", gap:"0.65rem", fontSize:"0.78rem" }}>
                    <span style={{ background:"#111", color:"#F5C500", borderRadius:"4px", padding:"0.1rem 0.4rem", fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", flexShrink:0, height:"fit-content", marginTop:"0.1rem" }}>{key[0].toUpperCase()}</span>
                    <span style={{ color:"#444", lineHeight:1.5 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:"0.72rem", color:"#777", marginTop:"0.75rem", fontStyle:"italic" }}>
                Why {uomLabels[result.uom]}? {result.uomExplanation}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding:"1rem 1.25rem", borderTop:"1px solid #EBEBEB", display:"flex", gap:"0.65rem", justifyContent:"flex-end" }}>
              <button className="btn btn-outline" onClick={() => { setResult(null); setInput(""); }}>Discard</button>
              <button className="btn btn-primary" style={{ background:"#111", color:"#F5C500" }}
                onClick={() => { onGoalGenerated(result); setResult(null); setInput(""); }}>
                ✓ Add to Goal Sheet
              </button>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
            {["Improve customer satisfaction", "Reduce operational costs", "Launch new product feature", "Increase team productivity"].map(ex => (
              <button key={ex} onClick={() => setInput(ex)}
                style={{ background:"#F5F5F5", border:"1px solid #E5E5E5", borderRadius:"999px", padding:"0.3rem 0.75rem", fontSize:"0.72rem", color:"#555", cursor:"pointer", fontFamily:"'Sora',sans-serif" }}>
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
