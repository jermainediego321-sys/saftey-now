/* ----------------------------------------------------
   VIDEO DATA & CONFIG
---------------------------------------------------- */
window.videos = [
  { id: "vid-ct-n2-accident", title: "Cape Town N2 Accident", url: "https://storedata09090909.blob.core.windows.net", meta: "Driving Safety • 60–120s", aiSummary: "Highlights the dangers of distracted and high-speed driving." },
  { id: "vid-cage-ladder", title: "Fall in Cage Ladder", url: "https://storedata09090909.blob.core.windows.net", meta: "Work at Height • PPE", aiSummary: "Shows the consequences of improper ladder use." },
  { id: "vid-safety-moment", title: "Safety Moment Clip", url: "https://storedata09090909.blob.core.windows.net", meta: "General Awareness", aiSummary: "Covers the importance of reporting near-misses." },
  { id: "vid-slips-trips-falls", title: "Prevent Slips, Trips & Falls", url: "https://storedata09090909.blob.core.windows.net", meta: "Housekeeping • 2–3 min", aiSummary: "Explains slip & trip hazards and safe walking practices." },
  { id: "vid-Road", title: "Please be aware on the roads.", url: "https://storedata09090909.blob.core.windows.net", meta: "Road Safety • 2–3 min", aiSummary: "Road Safety awareness." }
];

const tableSASUrl = "https://storedata09090909.table.core.windows.net";
const tableName = "VideoInteractions";

/* ----------------------------------------------------
   TIKTOK VIDEO FEED
---------------------------------------------------- */
window.onload = loadFeed;

function loadFeed() {
  const feed = document.getElementById("feed");

  videos.forEach((v) => {
    const card = document.createElement("section");
    card.className = "card";

    const video = document.createElement("video");
    video.src = v.url;
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", ""); // Fixes iOS/Safari black screen
    video.setAttribute("preload", "metadata");

    video.addEventListener("play", async () => {
      document.getElementById("videoTitle").innerText = v.title;
      document.getElementById("videoDesc").innerText = v.meta;
      
      // Update AI Summary if open
      if (!document.getElementById("aiSummaryBox").classList.contains("hidden")) {
        updateAiSummary();
      }

      // Fetch Likes from Azure for this specific video
      const queryUrl = `${tableSASUrl.replace('?', `/${tableName}(PartitionKey='${v.id}',RowKey='LikeCount')?`)}`;
      try {
        const res = await fetch(queryUrl, { headers: { 'Accept': 'application/json;odata=nometadata' } });
        const data = await res.json();
        document.getElementById("likeCount").innerText = data.Count || 0;
      } catch { document.getElementById("likeCount").innerText = 0; }
    });

    video.addEventListener("click", () => { video.muted = !video.muted; });

    card.appendChild(video);
    feed.appendChild(card);
  });
  setupAutoPlay();
}

/* ----------------------------------------------------
   AUTOPLAY & AI
---------------------------------------------------- */
function setupAutoPlay() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target.querySelector("video");
      if (entry.isIntersecting) video?.play().catch(() => {});
      else video?.pause();
    });
  }, { threshold: 0.75 });
  document.querySelectorAll(".card").forEach(card => observer.observe(card));
}

function updateAiSummary() {
  const index = getCurrentVideoIndex();
  document.getElementById("aiSummaryText").innerText = videos[index].aiSummary;
}

document.getElementById("aiBtn").onclick = () => {
  updateAiSummary();
  document.getElementById("aiSummaryBox").classList.toggle("hidden");
};

/* ----------------------------------------------------
   COMMENTS & LIKES (AZURE)
---------------------------------------------------- */
document.getElementById("commentBtn").onclick = () => {
  const index = getCurrentVideoIndex();
  document.getElementById("commentModal").classList.remove("hidden");
  loadComments(index);
};

document.getElementById("closeComment").onclick = () => document.getElementById("commentModal").classList.add("hidden");

document.getElementById("submitComment").onclick = async () => {
  const val = document.getElementById("commentInput").value.trim();
  if (!val) return;

  const currentVid = videos[getCurrentVideoIndex()];
  const entity = {
    PartitionKey: currentVid.id,
    RowKey: new Date().getTime().toString(),
    Text: val,
    UserName: JSON.parse(localStorage.getItem("pending_login"))?.fullname || "User"
  };

  try {
    const response = await fetch(`${tableSASUrl.replace('?', `/${tableName}?`)}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json;odata=nometadata', 'Content-Type': 'application/json' },
      body: JSON.stringify(entity)
    });
    if (response.ok) {
      document.getElementById("commentInput").value = "";
      loadComments(getCurrentVideoIndex()); 
    }
  } catch (e) { console.error(e); }
};

async function loadComments(index) {
  const container = document.getElementById("commentList");
  container.innerHTML = "Loading...";
  const queryUrl = `${tableSASUrl.replace('?', `/${tableName}()?`)}&$filter=PartitionKey eq '${videos[index].id}'`;
  try {
    const res = await fetch(queryUrl, { headers: { 'Accept': 'application/json;odata=nometadata' } });
    const data = await res.json();
    container.innerHTML = data.value.length ? "" : "No comments yet.";
    data.value.forEach(c => {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${c.UserName}:</strong> ${c.Text}`;
      container.appendChild(p);
    });
  } catch { container.innerHTML = "Error."; }
}

document.getElementById("likeBtn").onclick = async () => {
  const countEl = document.getElementById("likeCount");
  let newCount = parseInt(countEl.innerText) + 1;
  countEl.innerText = newCount;
  pulse("likeBtn");

  const currentVid = videos[getCurrentVideoIndex()];
  try {
    await fetch(`${tableSASUrl.replace('?', `/${tableName}(PartitionKey='${currentVid.id}',RowKey='LikeCount')?`)}`, {
      method: 'MERGE',
      headers: { 'Accept': 'application/json;odata=nometadata', 'Content-Type': 'application/json', 'If-Match': '*' },
      body: JSON.stringify({ PartitionKey: currentVid.id, RowKey: "LikeCount", Count: newCount })
    });
  } catch (e) { console.error(e); }
};

/* ----------------------------------------------------
   UTILITIES
---------------------------------------------------- */
function pulse(id) {
  const el = document.getElementById(id);
  el.style.transform = "scale(1.3)";
  setTimeout(() => el.style.transform = "scale(1)", 150);
}

function getCurrentVideoIndex() {
  const cards = document.querySelectorAll(".card");
  let index = 0;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    if (rect.top >= -100 && rect.top < window.innerHeight / 2) index = i;
  });
  return index;
}

document.getElementById("shareBtn2").onclick = () => {
  const video = videos[getCurrentVideoIndex()];
  if (navigator.share) navigator.share({ title: video.title, url: video.url });
  else alert("Link copied!");
};
