/* ----------------------------------------------------
   VIDEO DATA (GLOBAL)
---------------------------------------------------- */
window.videos = [
  { id: "vid-ct-n2-accident", title: "Cape Town N2 Accident", url: "https://storedata09090909.blob.core.windows.net/videos/CapeTownN2Accident.mp4", meta: "Driving Safety • 60–120s", aiSummary: "Highlights the dangers of distracted and high-speed driving." },
  { id: "vid-cage-ladder", title: "Fall in Cage Ladder", url: "https://storedata09090909.blob.core.windows.net/videos/Fallincageladder.mp4", meta: "Work at Height • PPE", aiSummary: "Shows the consequences of improper ladder use." },
  { id: "vid-safety-moment", title: "Safety Moment Clip", url: "https://storedata09090909.blob.core.windows.net/videos/SafetyMomentVideoClip.mp4", meta: "General Awareness", aiSummary: "Covers the importance of reporting near-misses." },
  { id: "vid-slips-trips-falls", title: "Prevent Slips, Trips & Falls", url: "https://storedata09090909.blob.core.windows.net/videos/Hazards.mp4", meta: "Housekeeping • 2–3 min", aiSummary: "Explains slip & trip hazards and safe walking practices." },
  { id: "vid-Road", title: "Please be aware on the roads.", url: "https://storedata09090909.blob.core.windows.net/videos/Roadsafety.mp4", meta: "Road Safety • 2–3 min", aiSummary: "Road Safety awareness." }
];

const tableSASUrl = "https://storedata09090909.table.core.windows.net/?sv=2024-11-04&ss=t&srt=sco&sp=rau&se=2027-02-24T04:17:26Z&st=2026-02-23T20:02:26Z&spr=https&sig=wq0S8zC1Lab9UhgF0cPynYfJLMeSkAL5tk6phjV7GXo%3D";
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
    video.setAttribute("muted", ""); 
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.muted = true;

    // MOVED INSIDE LOOP: Updates title and AI summary when video plays
    video.addEventListener("play", () => {
      document.getElementById("videoTitle").innerText = v.title;
      document.getElementById("videoDesc").innerText = v.meta;
      if (!document.getElementById("aiSummaryBox").classList.contains("hidden")) {
        updateAiSummary();
      }
    });

    video.addEventListener("click", () => {
      video.muted = !video.muted;
      video.volume = video.muted ? 0 : 1;
    });

    card.appendChild(video);
    feed.appendChild(card);
  });
  setupAutoPlay();
}

/* ----------------------------------------------------
   AUTOPLAY & AI SUMMARY LOGIC
---------------------------------------------------- */
function setupAutoPlay() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target.querySelector("video");
      if (entry.isIntersecting) {
        video?.play().catch(() => {});
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
   AZURE COMMENT STORAGE
---------------------------------------------------- */
document.getElementById("submitComment").onclick = async () => {
  const val = document.getElementById("commentInput").value.trim();
  if (!val) return;

  const currentVid = videos[getCurrentVideoIndex()];
  const entity = {
    PartitionKey: currentVid.id,
    RowKey: new Date().getTime().toString(),
    Text: val,
    UserName: JSON.parse(localStorage.getItem("pending_login"))?.fullname || "Anonymous"
  };

  try {
    const response = await fetch(`${tableSASUrl.replace('?', `/${tableName}?`)}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json;odata=nometadata', 'Content-Type': 'application/json' },
      body: JSON.stringify(entity)
    });
    if (response.ok) {
      document.getElementById("commentInput").value = "";
      alert("Comment saved to Azure!");
    }
  } catch (error) { console.error("Azure Error:", error); }
};


function loadComments(index) {
  const container = document.getElementById("commentList");
  container.innerHTML = "";

  (localComments[index] || []).forEach(text => {
    const p = document.createElement("p");
    p.textContent = "• " + text;
    container.appendChild(p);
  });

  document.getElementById("submitComment").onclick = () => {
    const val = document.getElementById("commentInput").value.trim();
    if (!val) return;

    if (!localComments[index]) localComments[index] = [];
    localComments[index].push(val);

    document.getElementById("commentInput").value = "";
    loadComments(index);
  };
}


/* ----------------------------------------------------
   EMOJI REACTIONS
---------------------------------------------------- */

let likeCount = 0;

document.getElementById("likeBtn").onclick = () => {
  likeCount++;
  document.getElementById("likeCount").innerText = likeCount;
  pulse("likeBtn");
};

document.getElementById("funnyBtn").onclick = () => pulse("funnyBtn");
document.getElementById("wowBtn").onclick = () => pulse("wowBtn");

function pulse(id) {
  const el = document.getElementById(id);
  el.style.transform = "scale(1.3)";
  setTimeout(() => el.style.transform = "scale(1)", 150);
}


/* ----------------------------------------------------
   SHARE
---------------------------------------------------- */

document.getElementById("shareBtn2").onclick = () => {
  const index = getCurrentVideoIndex();
  const video = videos[index];

  if (navigator.share) {
    navigator.share({
      title: video.title,
      text: "Check out this SafetyNow video",
      url: video.url
    });
  } else {
    navigator.clipboard.writeText(video.url);
    alert("Link copied to clipboard:\n" + video.url);
  }
};


/* ----------------------------------------------------
   GET CURRENT VISIBLE VIDEO
---------------------------------------------------- */

function getCurrentVideoIndex() {
  const cards = document.querySelectorAll(".card");
  let index = 0;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < window.innerHeight / 1.5) index = i;
  });
  return index;
}

/* ----------------------------------------------------
   COMMENT LOADING (FROM AZURE)
---------------------------------------------------- */
async function loadComments(index) {
  const container = document.getElementById("commentList");
  container.innerHTML = "Loading comments...";
  const currentVidId = videos[index].id;

  // URL to fetch comments for THIS specific video from Azure
  const queryUrl = `${tableSASUrl.replace('?', `/${tableName}()?`)}&$filter=PartitionKey eq '${currentVidId}'`;

  try {
    const response = await fetch(queryUrl, {
      headers: { 'Accept': 'application/json;odata=nometadata' }
    });
    
    if (response.ok) {
      const data = await response.json();
      container.innerHTML = ""; // Clear loading text
      
      if (data.value.length === 0) {
        container.innerHTML = "<p>No comments yet. Be the first!</p>";
      }

      data.value.forEach(comment => {
        const p = document.createElement("p");
        p.style.marginBottom = "8px";
        p.innerHTML = `<strong>${comment.UserName || 'User'}:</strong> ${comment.Text}`;
        container.appendChild(p);
      });
    }
  } catch (error) {
    container.innerHTML = "Error loading comments.";
    console.error("Azure Load Error:", error);
  }
}

/* ----------------------------------------------------
   EMOJI REACTIONS (LIKE / WOW)
---------------------------------------------------- */
// Local counter for immediate feedback; Azure count should be fetched on load
let likeCount = 0;

document.getElementById("likeBtn").onclick = () => {
  likeCount++;
  document.getElementById("likeCount").innerText = likeCount;
  pulse("likeBtn");
  // Optional: Add handleLike(videos[getCurrentVideoIndex()].id) here for Azure saving
};

document.getElementById("funnyBtn").onclick = () => pulse("funnyBtn");
document.getElementById("wowBtn").onclick = () => pulse("wowBtn");

function pulse(id) {
  const el = document.getElementById(id);
  if(!el) return;
  el.style.transform = "scale(1.3)";
  setTimeout(() => el.style.transform = "scale(1)", 150);
}

/* ----------------------------------------------------
   SHARE & UTILS
---------------------------------------------------- */
document.getElementById("shareBtn2").onclick = () => {
  const index = getCurrentVideoIndex();
  const video = videos[index];

  if (navigator.share) {
    navigator.share({
      title: video.title,
      text: "Check out this SafetyNow video",
      url: video.url
    });
  } else {
    navigator.clipboard.writeText(video.url);
    alert("Link copied to clipboard!");
  }
};

function getCurrentVideoIndex() {
  const cards = document.querySelectorAll(".card");
  let index = 0;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    // Detects which card is currently taking up the center of the screen
    if (rect.top >= -100 && rect.top < window.innerHeight / 2) index = i;
  });
  return index;
}


