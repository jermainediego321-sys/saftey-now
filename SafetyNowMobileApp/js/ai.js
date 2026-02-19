// ------------------------------------------------------------
// SafetyNow • Ask AI
// Updated to use videos.js as knowledge base
// ------------------------------------------------------------

import { videos } from "./videos.js";

document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("aiInput");
  const askBtn = document.getElementById("askAI");
  const answerBox = document.getElementById("aiAnswer");

  if (!textarea || !askBtn || !answerBox) return;

  const USE_DEMO = true; 

  askBtn.addEventListener("click", async () => {
    const question = (textarea.value || "").trim();
    if (!question) {
      answerBox.innerHTML = "Please type a question about safety.";
      return;
    }

    askBtn.disabled = true;
    const original = askBtn.textContent;
    askBtn.textContent = "Thinking…";
    answerBox.innerHTML = "⏳ Analyzing your question…";

    try {
      let responseText = "";

      if (USE_DEMO) {
        // Try to answer using videos first
        const videoMatch = searchVideos(question);

        if (videoMatch) {
          responseText = 
            `🎥 **Related Video: ${videoMatch.title}**<br>` +
            `${videoMatch.aiSummary}`;
        } 
        else {
          responseText = demoAnswer(question);
        }

        await new Promise(r => setTimeout(r, 500));

      } else {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question })
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();
        responseText = data?.answer || "No answer returned.";
      }

      answerBox.innerHTML = formatAsHtml(responseText);

    } catch (err) {
      answerBox.innerHTML = `❗ Error: ${err.message}`;
    } finally {
      askBtn.disabled = false;
      askBtn.textContent = original;
    }
  });

  // ------------------------------------------------------------
  // Search your videos.js for a match
  // ------------------------------------------------------------
  function searchVideos(question) {
    const q = question.toLowerCase();

    return videos.find(v =>
      v.title.toLowerCase().includes(q) ||
      v.meta.toLowerCase().includes(q) ||
      v.aiSummary.toLowerCase().includes(q)
    );
  }

  // ------------------------------------------------------------
  // Demo fallback answers
  // ------------------------------------------------------------
  function demoAnswer(q) {
    const lower = q.toLowerCase();

    if (lower.includes("heights") || lower.includes("ladder")) {
      return [
        "Key controls for *Working at Heights*:",
        "1) Wear full body harness with double lanyards.",
        "2) Secure anchor points above D‑ring height.",
        "3) Maintain 3 points of contact.",
        "4) Barricade drop zones; use tool lanyards.",
        "5) Inspect ladders before use."
      ].join("\n");
    }

    if (lower.includes("road") || lower.includes("driving")) {
      return [
        "Road Safety Tips:",
        "• Avoid speeding — keep safe following distance.",
        "• Stay alert; avoid distractions.",
        "• Use indicators early.",
        "• Adjust speed for weather and visibility."
      ].join("\n");
    }

    if (lower.includes("ppe")) {
      return [
        "PPE Guidance:",
        "• Select PPE for the hazard.",
        "• Fit‑check respirators.",
        "• Replace damaged PPE.",
        "• PPE is last line of defence."
      ].join("\n");
    }

    return [
      "General Safety Process:",
      "• Identify the hazard.",
      "• Assess the risk.",
      "• Apply controls (Eliminate → Substitute → Engineer → Admin → PPE).",
      "• Stop work if unsure.",
      "• Report near-misses."
    ].join("\n");
  }

  // ------------------------------------------------------------
  // Formatting helper
  // ------------------------------------------------------------
  function formatAsHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }
});