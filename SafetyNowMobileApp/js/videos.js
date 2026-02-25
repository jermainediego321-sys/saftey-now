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
   TIKTOK VIDEO FEED (CORE LOGIC)
---------------------------------------------------- */
window.onload = loadFeed;

function loadFeed() {
  const feed = document.getElementById("feed");
  feed.innerHTML = ""; // Clear initial "Loading" text

  videos.forEach((v, index) => {
    const card = document.createElement("section");
    card.className = "card";
    card.dataset.index = index; // Used to sync titles while swiping

    const video = document.createElement("video");
    video.src = v.url;
    
    // Laptop UX: Enable native Seek Bar, Pause, and Volume
    video.controls = true; 
    video.muted = false; 
    video.volume = 0.5;

    video.setAttribute("playsinline", ""); 
    video.setAttribute("preload", "metadata");

    // YouTube-style: Double tap sides to seek, center to pause
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
   AUTOPLAY & SWIPE SYNC
---------------------------------------------------- */
function setupAutoPlay() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const card = entry.target;
      const video = card.querySelector("video");
      const index = card.dataset.index;
      const data = videos[index];

      if (entry.isIntersecting) {
        // IMMEDIATE UI UPDATE: Fixes the "Loading..." bug
        const titleEl = document.getElementById("videoTitle");
        const descEl = document.getElementById("videoDesc");
        
        if (titleEl) titleEl.innerText = data.title;
        if (descEl) descEl.innerText = data.meta;
        
        // Start playing
        video?.play().catch(() => {
          video.muted = true; // Fallback for browser autoplay block
          video.play();
        });
      } else {
        video?.pause();
      }
    });
  }, { threshold: 0.6 }); // Triggers when 60% of the video is visible
  
  document.querySelectorAll(".card").forEach(card => observer.observe(card));
}


async function fetchLikeCount(videoId) {
  const queryUrl = `${tableSASUrl.replace('?', `/${tableName}(PartitionKey='${videoId}',RowKey='LikeCount')?`)}`;
  try {
    const res = await fetch(queryUrl, { headers: { 'Accept': 'application/json;odata=nometadata' } });
    const data = await res.json();
    document.getElementById("likeCount").innerText = data.Count || 0;
  } catch { 
    document.getElementById("likeCount").innerText = 0; 
  }
}

/* ----------------------------------------------------
   AI SUMMARY
---------------------------------------------------- */
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
    await fetch(`${tableSASUrl.replace('?', `/${tableName}?`)}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json;odata=nometadata', 'Content-Type': 'application/json' },
      body: JSON.stringify(entity)
    });
    document.getElementById("commentInput").value = "";
    loadComments(getCurrentVideoIndex()); 
  } catch (e) { console.error("Azure Post Error:", e); }
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
  } catch { container.innerHTML = "Error loading comments."; }
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
  } catch (e) { console.error("Azure Like Error:", e); }
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
  else alert("Link copied to clipboard!");
};

