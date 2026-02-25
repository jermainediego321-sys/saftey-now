/* ----------------------------------------------------
   VIDEO DATA & CONFIG
---------------------------------------------------- */
window.videos = [
  { id: "vid-ct-n2-accident", title: "Cape Town N2 Accident", url: "https://storedata09090909.blob.core.windows.net/videos/CapeTownN2Accident.mp4", meta: "Driving Safety • 60–120s", aiSummary: "Highlights the dangers of distracted and high-speed driving." },
  { id: "vid-cage-ladder", title: "Fall in Cage Ladder", url: "https://storedata09090909.blob.core.windows.net/videos/Fallincageladder.mp4", meta: "Work at Height • PPE", aiSummary: "Shows the consequences of improper ladder use." },
  { id: "vid-safety-moment", title: "Safety Moment Clip", url: "https://storedata09090909.blob.core.windows.net/videos/Hazards.mp4", meta: "General Awareness", aiSummary: "Covers the importance of reporting near-misses." },
  { id: "vid-slips-trips-falls", title: "Prevent Slips, Trips & Falls", url: "https://storedata09090909.blob.core.windows.net/videos/SafetyMomentVideoClip.mp4", meta: "Housekeeping • 2–3 min", aiSummary: "Explains slip & trip hazards and safe walking practices." },
  { id: "vid-Road", title: "Please be aware on the roads.", url: "https://storedata09090909.blob.core.windows.net/videos/Roadsafety.mp4", meta: "Road Safety • 2–3 min", aiSummary: "Road Safety awareness." }
];

const tableSASUrl = "https://storedata09090909.table.core.windows.net";
const tableName = "VideoInteractions";

/* ----------------------------------------------------
   TIKTOK VIDEO FEED (UPDATED)
---------------------------------------------------- */
window.onload = loadFeed;

function loadFeed() {
  const feed = document.getElementById("feed");

  videos.forEach((v) => {
    const card = document.createElement("section");
    card.className = "card";

    const video = document.createElement("video");
    video.src = v.url;
    
    // Laptop/UX Fix: Enable native controls for Volume, Rewind, and Timeline
    video.controls = true; 
    
    // Initial audio setup: Start at 50% volume
    // Note: Browser will block sound until user clicks anywhere on the page once.
    video.muted = false; 
    video.volume = 0.5;

    video.setAttribute("playsinline", ""); 
    video.setAttribute("preload", "metadata");

    // Playback Logic: Update UI and Fetch Likes
    video.addEventListener("play", async () => {
      document.getElementById("videoTitle").innerText = v.title;
      document.getElementById("videoDesc").innerText = v.meta;
      
      if (!document.getElementById("aiSummaryBox").classList.contains("hidden")) {
        updateAiSummary();
      }

      const queryUrl = `${tableSASUrl.replace('?', `/${tableName}(PartitionKey='${v.id}',RowKey='LikeCount')?`)}`;
      try {
        const res = await fetch(queryUrl, { headers: { 'Accept': 'application/json;odata=nometadata' } });
        const data = await res.json();
        document.getElementById("likeCount").innerText = data.Count || 0;
      } catch { document.getElementById("likeCount").innerText = 0; }
    });

    // Double-tap seeking like YouTube (Left 30% = Rewind, Right 30% = FF)
    video.addEventListener("click", (e) => {
      const rect = video.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.3) {
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else if (x > rect.width * 0.7) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
      } else {
        video.paused ? video.play() : video.pause();
      }
    });

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
      if (entry.isIntersecting) {
        video?.play().catch(() => {
          // If auto-play fails (blocked by browser), mute and try again
          if (video) video.muted = true;
          video?.play();
        });
      } else {
        video?.pause();
      }
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
  if (el) {
    el.style.transform = "scale(1.3)";
    setTimeout(() => el.style.transform = "scale(1)", 150);
  }
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
