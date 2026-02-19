// ------------------------------------------------------------
// SafetyNow - Frontend Login Flow (No Backend Yet)
// Handles UI transitions + basic validation
// ------------------------------------------------------------
// ------------------------------------------------------------
// Simple client-side auth & routing helpers for GitHub Pages
// ------------------------------------------------------------

// If your repo is published at https://<user>.github.io/SAFETYNOWMOBILEAPP/
// set BASE_PATH to "/SAFETYNOWMOBILEAPP/". If publishing as user site,
// set it to "/".
const BASE_PATH = "/SAFETYNOWMOBILEAPP/"; // <-- change if your repo name differs

const Auth = {
  key: "safetynow_user",

  isLoggedIn() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      // optionally check expiry here
      return !!obj?.username;
    } catch {
      return false;
    }
  },

  login(username) {
    const data = { username, ts: Date.now() };
    localStorage.setItem(this.key, JSON.stringify(data));
  },

  logout() {
    localStorage.removeItem(this.key);
    this.goLogin();
  },

  goLogin() {
    window.location.href = BASE_PATH + "login.html";
  },

  goVideos() {
    window.location.href = BASE_PATH + "videos.html";
  },

  // Put this at the top of protected pages
  requireLogin() {
    if (!this.isLoggedIn()) {
      this.goLogin();
      return false;
    }
    return true;
  }
};

export default Auth;





const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");

const phoneInput = document.getElementById("phoneInput");
const codeInput = document.getElementById("codeInput");

const btnSendCode = document.getElementById("btnSendCode");
const btnVerifyCode = document.getElementById("btnVerifyCode");
const resendCode = document.getElementById("resendCode");

// ------------------------------------------------------------
// STEP 1 → Send SMS Code (UI only for now)
// ------------------------------------------------------------
btnSendCode.onclick = async () => {
  const phone = phoneInput.value.trim();

  if (!phone.startsWith("+")) {
    alert("Please enter phone number with country code.\nExample: +27 62 345 6789");
    return;
  }

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
};

// ------------------------------------------------------------
// STEP 2 → Verify code (UI only)
// ------------------------------------------------------------
btnVerifyCode.onclick = async () => {
  const code = codeInput.value.trim();

  if (code.length < 4) {
    alert("Enter the 6‑digit code sent to you.");
    return;
  }

  // FINAL FIX: store login session
  localStorage.setItem("safetyNowUser", "yes");

  // Redirect to video feed
  window.location.href = "videos.html";
};

// ------------------------------------------------------------
// Resend Code (UI only for now)
// ------------------------------------------------------------
resendCode.onclick = () => {
  alert("A new code would be sent (backend not connected yet).");
};