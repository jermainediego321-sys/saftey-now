/* ----------------------------------------------------
   VIDEO DATA (GLOBAL)
---------------------------------------------------- */

window.videos = [
  {
    id: "vid-ct-n2-accident",
    title: "Cape Town N2 Accident",
    url: "https://storedata09090909.blob.core.windows.net/videos/Cape%20Town%20N2%20Accident.mp4",
    meta: "Driving Safety • 60–120s",
    aiSummary: "Highlights the dangers of distracted and high-speed driving."
  },
  {
    id: "vid-cage-ladder",
    title: "Fall in Cage Ladder",
    url: "https://storedata09090909.blob.core.windows.net/videos/Fall%20in%20cage%20ladder.mp4",
    meta: "Work at Height • PPE",
    aiSummary: "Shows the consequences of improper ladder use."
  },
  {
    id: "vid-safety-moment",
    title: "Safety Moment Clip",
    url: "https://storedata09090909.blob.core.windows.net/videos/SafetyMomentVideoClip.mp4",
    meta: "General Awareness",
    aiSummary: "Covers the importance of reporting near-misses."
  },
  {
    id: "vid-slips-trips-falls",
    title: "Prevent Slips, Trips & Falls",
    url: "https://storedata09090909.blob.core.windows.net/videos/Watch%20Out!%20Hazards%20-%20Prevent%20Slips%20Trips%20and%20Falls%20-%20Safety%20Training%20Video.mp4",
    meta: "Housekeeping • 2–3 min",
    aiSummary: "Explains slip & trip hazards and safe walking practices."
  },
  {
    id: "vid-Road",
    title: "Please be aware on the roads.",
    url: "https://storedata09090909.blob.core.windows.net/videos/Roadsafety.mp4",
    meta: "Road Safety • 2–3 min",
    aiSummary: "Road Safety awareness."
  }
];


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
    video.autoplay = false;
    video.muted = true;
    video.controls = false;
    video.setAttribute("playsinline", "");

    video.addEventListener("loadedmetadata", () => {
      if (video.videoHeight > video.videoWidth) {
        video.style.objectFit = "cover";
      } else {
        video.style.objectFit = "contain";
        video.style.background = "black";
      }
    });

    video.addEventListener("click", () => {
      video.muted = false;
      video.volume = 1;
    });

    video.addEventListener("play", () => {
      document.getElementById("videoTitle").innerText = v.title;
      document.getElementById("videoDesc").innerText = v.meta;
    });

    card.appendChild(video);
    feed.appendChild(card);
  });

  setupAutoPlay();
}


/* ----------------------------------------------------
   AUTOPLAY ON SCROLL LIKE TIKTOK
---------------------------------------------------- */

function setupAutoPlay() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target.querySelector("video");
      if (!video) return;

      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.75 });

  cards.forEach(card => observer.observe(card));
}


/* ----------------------------------------------------
   AI SUMMARY
---------------------------------------------------- */
document.getElementById("aiBtn").onclick = () => {
  const index = getCurrentVideoIndex();
  document.getElementById("aiSummaryText").innerText = videos[index].aiSummary;
  document.getElementById("aiSummaryBox").classList.toggle("hidden");
};


/* ----------------------------------------------------
   COMMENT SYSTEM
---------------------------------------------------- */

let localComments = {};

document.getElementById("commentBtn2").onclick =
document.getElementById("commentBtn").onclick = () => {
  openCommentsModal(getCurrentVideoIndex());
};

function openCommentsModal(index) {
  document.getElementById("commentModal").classList.remove("hidden");
  loadComments(index);
}

document.getElementById("closeComment").onclick = () => {
  document.getElementById("commentModal").classList.add("hidden");
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
