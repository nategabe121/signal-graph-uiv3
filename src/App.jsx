
import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import domtoimage from "dom-to-image";
import { ResponsiveContainer, ForceGraph2D } from "react-force-graph";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as ChartContainer } from "recharts";

const SIGNALS = [
  { id: "criminal_felony_recent", label: "Recent Felony" },
  { id: "criminal_felony_old", label: "Old Felony" },
  { id: "criminal_misdemeanor", label: "Misdemeanor" },
  { id: "alias_mismatch", label: "Alias Mismatch" },
  { id: "employment_gap", label: "Employment Gap" },
  { id: "education_unverified", label: "Education Unverified" },
  { id: "address_instability", label: "Address Instability" },
  { id: "ssn_mismatch", label: "SSN Mismatch" },
  { id: "jurisdiction_delay", label: "Jurisdiction Delay" },
  { id: "multiple_employers", label: "Multiple Employers" },
  { id: "pattern_reform", label: "Pattern of Reform" }
];

const weights = {
  criminal_felony_recent: 8,
  criminal_felony_old: 4,
  criminal_misdemeanor: 3,
  alias_mismatch: 5,
  employment_gap: 4,
  education_unverified: 6,
  address_instability: 3,
  ssn_mismatch: 7,
  jurisdiction_delay: 2,
  multiple_employers: 2,
  pattern_reform: -5
};

const syntheticProfiles = [
  {
    candidateId: "Candidate_Synth_001",
    selectedFlags: ["criminal_felony_old", "employment_gap", "alias_mismatch", "pattern_reform"]
  },
  {
    candidateId: "Candidate_Synth_002",
    selectedFlags: ["criminal_felony_recent", "ssn_mismatch", "education_unverified"]
  },
  {
    candidateId: "Candidate_Synth_003",
    selectedFlags: ["criminal_misdemeanor", "multiple_employers", "address_instability"]
  }
];

export default function SignalGraphUI() {
  const [candidateId, setCandidateId] = useState("Candidate_001");
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [feedback, setFeedback] = useState("");
  const graphRef = useRef();

  const toggleFlag = (id) => {
    setSelectedFlags((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const buildGraphData = () => {
    const nodes = [
      { id: candidateId, name: candidateId, color: "#60a5fa", type: "entity" },
      ...selectedFlags.map((flag) => ({
        id: flag,
        name: SIGNALS.find((s) => s.id === flag).label,
        color: "#facc15",
        type: "signal"
      }))
    ];

    const links = selectedFlags.map((flag) => ({
      source: candidateId,
      target: flag,
      value: Math.abs(weights[flag] || 1)
    }));

    return { nodes, links };
  };

  const calculateScore = () => {
    const score = selectedFlags.reduce((sum, flag) => sum + (weights[flag] || 0), 0);
    if (score >= 10) setFeedback("⚠️ High risk: Proceed with caution.");
    else if (score >= 1) setFeedback("⚖️ Moderate risk: Review context.");
    else setFeedback("✅ Low risk: Signs of stability or reform.");
    return score;
  };

  const loadSyntheticProfile = (index) => {
    const profile = syntheticProfiles[index];
    setCandidateId(profile.candidateId);
    setSelectedFlags(profile.selectedFlags);
  };

  const handleCSVExport = () => {
    const rows = [["Candidate ID", "Flags"], [candidateId, selectedFlags.join(",")]];
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${candidateId}_profile.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePDFExport = () => {
    domtoimage.toPng(graphRef.current).then((dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
      const container = document.getElementById("pdf-summary");
      container.appendChild(img);
      setTimeout(() => {
        html2pdf().set({ margin: 0.5, filename: `${candidateId}_report.pdf`, html2canvas: { scale: 2 } }).from(container).save();
        container.removeChild(img);
      }, 1000);
    });
  };

  const scores = syntheticProfiles.map((profile) => ({
    name: profile.candidateId,
    score: profile.selectedFlags.reduce((sum, flag) => sum + (weights[flag] || 0), 0)
  }));

  return (
    <div style={{ padding: 24 }}>
      <h2>Signal Graph UI</h2>
      <input
        value={candidateId}
        onChange={(e) => setCandidateId(e.target.value)}
        placeholder="Candidate ID"
        style={{ padding: 8, marginBottom: 12 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {SIGNALS.map((signal) => (
          <label key={signal.id}>
            <input
              type="checkbox"
              checked={selectedFlags.includes(signal.id)}
              onChange={() => toggleFlag(signal.id)}
            />
            {" "}{signal.label}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => loadSyntheticProfile(0)}>Load Profile 1</button>{" "}
        <button onClick={() => loadSyntheticProfile(1)}>Load Profile 2</button>{" "}
        <button onClick={() => loadSyntheticProfile(2)}>Load Profile 3</button>{" "}
        <button onClick={handleCSVExport}>Export CSV</button>{" "}
        <button onClick={handlePDFExport}>Export PDF</button>
        <div style={{ fontSize: 18, marginTop: 8 }}>
          Score: <strong>{calculateScore()}</strong> – {feedback}
        </div>
      </div>
      <div ref={graphRef} style={{ height: 400, marginTop: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ForceGraph2D
            graphData={buildGraphData()}
            nodeLabel={(node) => node.name}
            nodeAutoColorBy="type"
            linkWidth={(link) => link.value}
            nodeCanvasObject={(node, ctx) => {
              ctx.fillStyle = node.color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.fillStyle = "black";
              ctx.fillText(node.name, node.x + 12, node.y + 4);
            }}
          />
        </ResponsiveContainer>
      </div>
      <div id="pdf-summary" style={{ marginTop: 40 }}>
        <h3>Synthetic Profile Risk Comparison</h3>
        <ChartContainer width="100%" height={300}>
          <BarChart data={scores}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#6366f1" />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
