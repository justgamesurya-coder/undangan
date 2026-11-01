/**
 * ============================================================================
 * JAVASCRIPT: UNDANGAN DIGITAL ONLINE DENGAN DATABASE GOOGLE SPREADSHEET
 * ============================================================================
 * Pasangan: Anggi Nuraini S.Pd & Syaiful Rachman (A & R)
 * Tanggal Acara: Sabtu, 5 Desember 2026
 * Arsitektur: Headless API Apps Script (100% Bebas Google Warning Banner)
 * ============================================================================
 */

// ============================================================================
// 1. KONFIGURASI GOOGLE APPS SCRIPT WEB APP
// Masukkan URL Web App hasil Deploy Google Apps Script Anda:
// (Contoh: https://script.google.com/macros/s/AKfycbx.../exec)
// ============================================================================
const CONFIG = {
  // URL Web App Google Apps Script hasil deploy (Database Spreadsheet):
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzoQKS1sD5MNtmqj1nvruNX8oPXt-Yu62AQSJjmw_kdCXQESOfL6JjGgywxGh2pO1gwqg/exec",
  
  // Tanggal target acara: Sabtu, 5 Desember 2026 09:00 WIB (Bulan 11 = Desember)
  EVENT_DATE: new Date(2026, 11, 5, 9, 0, 0).getTime()
};

// State Aplikasi
let isMusicPlaying = false;
let wishesData = [];

// ============================================================================
// 2. INISIALISASI SAAT HALAMAN DIMUAT
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initGuestNameFromUrl();
  initCountdown();
  initCoverAndAudio();
  initRsvpForm();
  initGalleryLightbox();
  initShareTool();
  initAdminMode();
  loadWishesFromDatabase();
});

// ============================================================================
// 3. PARSING NAMA TAMU DARI URL PARAMETER (?to=Nama+Tamu)
// ============================================================================
function initGuestNameFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get("to") || urlParams.get("u") || urlParams.get("nama");
  
  const coverGuestEl = document.getElementById("coverGuestName");
  const inputNameEl = document.getElementById("inputName");
  
  if (guestParam) {
    const formattedName = decodeURIComponent(guestParam).replace(/\+/g, " ");
    if (coverGuestEl) coverGuestEl.textContent = formattedName;
    if (inputNameEl) inputNameEl.value = formattedName;
  }
}

// ============================================================================
// 4. COVER OPEN & BACKGROUND AUDIO CONTROLLER
// ============================================================================
function initCoverAndAudio() {
  const coverOverlay = document.getElementById("coverOverlay");
  const btnOpen = document.getElementById("btnOpenInvitation");
  const btnMusicToggle = document.getElementById("btnMusicToggle");
  const bgMusic = document.getElementById("bgMusic");

  if (btnOpen) {
    btnOpen.addEventListener("click", () => {
      coverOverlay.classList.add("opened");
      playAudio();
    });
  }

  if (btnMusicToggle) {
    btnMusicToggle.addEventListener("click", () => {
      if (isMusicPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    });
  }

  const DRIVE_STREAM_URL = "https://docs.google.com/uc?export=download&id=1NXz2GbI8JTW6VcQVQ3oPkX0WCipBZ664";

  function playAudio() {
    if (!bgMusic) return;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isMusicPlaying = true;
        btnMusicToggle.classList.add("playing");
      }).catch(err => {
        console.warn("Mencoba memutar audio melalui stream Google Drive:", err);
        // Jika file lokal gagal/404 di GitHub Pages, otomatis arahkan ke Google Drive stream
        if (!bgMusic.src.includes("docs.google.com")) {
          bgMusic.src = DRIVE_STREAM_URL;
          bgMusic.load();
          bgMusic.play().then(() => {
            isMusicPlaying = true;
            btnMusicToggle.classList.add("playing");
          }).catch(e => {
            console.log("Autoplay ditahan browser sampai user berinteraksi:", e);
          });
        }
      });
    }
  }

  function pauseAudio() {
    if (!bgMusic) return;
    bgMusic.pause();
    isMusicPlaying = false;
    btnMusicToggle.classList.remove("playing");
  }
}

// ============================================================================
// 5. HITUNG MUNDUR (COUNTDOWN TIMER KE 5 DESEMBER 2026)
// ============================================================================
function initCountdown() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  function updateTimer() {
    const now = new Date().getTime();
    const distance = CONFIG.EVENT_DATE - now;

    if (distance < 0) {
      if (daysEl) daysEl.textContent = "00";
      if (hoursEl) hoursEl.textContent = "00";
      if (minutesEl) minutesEl.textContent = "00";
      if (secondsEl) secondsEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ============================================================================
// 6. INTEGRASI DATABASE GOOGLE SPREADSHEET (FETCH GET & POST)
// ============================================================================

/**
 * Mengambil data ucapan dari Google Apps Script (doGet)
 */
async function loadWishesFromDatabase() {
  const container = document.getElementById("wishesContainer");
  const countEl = document.getElementById("totalWishesCount");
  const loadingEl = document.getElementById("loadingWishes");

  if (!CONFIG.APPS_SCRIPT_URL) {
    if (loadingEl) loadingEl.style.display = "none";
    wishesData = [];
    if (countEl) countEl.textContent = "0";
    renderWishesList([]);
    return;
  }

  try {
    if (loadingEl) loadingEl.style.display = "block";
    
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    
    const resData = await response.json();
    if (loadingEl) loadingEl.style.display = "none";
    
    if (resData.status === "success" && Array.isArray(resData.data)) {
      wishesData = resData.data;
      if (countEl) countEl.textContent = wishesData.length;
      renderWishesList(wishesData);
    } else {
      wishesData = [];
      if (countEl) countEl.textContent = "0";
      renderWishesList([]);
    }
  } catch (error) {
    console.warn("Koneksi ke spreadsheet backend:", error);
    if (loadingEl) loadingEl.style.display = "none";
    wishesData = [];
    if (countEl) countEl.textContent = "0";
    renderWishesList([]);
  }
}

/**
 * Menampilkan daftar ucapan ke elemen DOM
 */
function renderWishesList(list) {
  const container = document.getElementById("wishesContainer");
  if (!container) return;
  
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 28px 16px; border: 1px dashed rgba(212, 175, 55, 0.25); border-radius: var(--radius-md); background: rgba(0,0,0,0.25);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px; color: var(--text-gold);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <div style="color: #cbd5e1; font-weight: 500; font-size: 0.95rem;">Belum ada ucapan & doa restu</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Jadilah yang pertama memberikan doa restu untuk kedua mempelai melalui form di atas.</div>
      </div>
    `;
    return;
  }

  let html = "";
  list.forEach(item => {
    const initial = (item.name || "T").charAt(0).toUpperCase();
    let badgeClass = "badge-hadir";
    let badgeLabel = "Hadir";

    if (item.attendance === "Tidak Hadir") {
      badgeClass = "badge-tidak";
      badgeLabel = "Tidak Hadir";
    } else if (item.attendance === "Masih Ragu") {
      badgeClass = "badge-ragu";
      badgeLabel = "Masih Ragu";
    }

    html += `
      <div class="wish-item">
        <div class="wish-header">
          <div class="wish-user">
            <div class="wish-avatar">${initial}</div>
            <div>
              <div class="wish-name">${escapeHtml(item.name)}</div>
              <div class="wish-time">${escapeHtml(item.timestamp || "Baru saja")}</div>
            </div>
          </div>
          <span class="wish-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <p class="wish-message">${escapeHtml(item.message)}</p>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Kirim Form RSVP ke Google Apps Script (doPost)
 */
function initRsvpForm() {
  const form = document.getElementById("rsvpForm");
  const btnSubmit = document.getElementById("btnSubmitRsvp");
  const btnSubmitText = document.getElementById("btnSubmitText");
  const btnRefresh = document.getElementById("btnRefreshWishes");

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      showToast("Memperbarui ucapan...");
      loadWishesFromDatabase();
    });
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("inputName").value.trim();
    const attendance = document.getElementById("selectAttendance").value;
    const guestCount = document.getElementById("selectGuestCount").value;
    const message = document.getElementById("inputMessage").value.trim();

    if (!name || !message) {
      showToast("Harap isi nama dan ucapan Anda!");
      return;
    }

    btnSubmit.disabled = true;
    btnSubmitText.textContent = "Mengirimkan doa restu...";

    const payload = {
      name: name,
      attendance: attendance,
      guestCount: parseInt(guestCount) || 1,
      message: message,
      timestamp: new Date().toISOString()
    };

    try {
      if (CONFIG.APPS_SCRIPT_URL) {
        await fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }

      // Optimistic UI Update: langsung tampilkan ucapan paling atas
      const newItem = {
        name: name,
        attendance: attendance,
        guestCount: guestCount,
        message: message,
        timestamp: "Baru saja"
      };

      wishesData.unshift(newItem);
      renderWishesList(wishesData);
      
      const countEl = document.getElementById("totalWishesCount");
      if (countEl) countEl.textContent = wishesData.length;

      document.getElementById("inputMessage").value = "";
      showToast("✨ Terima kasih! Doa restu dan ucapan Anda berhasil terkirim.");

    } catch (err) {
      console.error("Error submit RSVP:", err);
      showToast("✨ Terima kasih! Doa restu dan ucapan Anda berhasil terkirim.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmitText.textContent = "Kirim Ucapan & Konfirmasi";
    }
  });
}

// ============================================================================
// 7. DATA STATUS DOA RESTU
// ============================================================================
function resetWishesState() {
  wishesData = [];
  const countEl = document.getElementById("totalWishesCount");
  if (countEl) countEl.textContent = "0";
  renderWishesList([]);
}

// ============================================================================
// 8. INTERACTIVE LIGHTBOX CAROUSEL DENGAN SWIPE & NAVIGATION
// ============================================================================
function initGalleryLightbox() {
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImg");
  const captionEl = document.getElementById("lightboxCaption");
  const counterEl = document.getElementById("lightboxCounter");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  const closeBtn = document.getElementById("lightboxClose");
  const thumbsContainer = document.getElementById("lightboxThumbs");
  const stageEl = document.getElementById("lightboxStage");

  if (!modal || !modalImg) return;

  // Daftar lengkap foto prewedding dengan caption
  const photos = [
    { src: "1%20(1).jpeg", caption: "Harmoni Kasih di Alam Terbuka" },
    { src: "1%20(2).jpeg", caption: "Menapaki Langkah Bersama" },
    { src: "1%20(3).jpeg", caption: "Untaian Senyum & Bahagia" },
    { src: "1%20(4).jpeg", caption: "Teduhnya Jalan Menuju Bahagia" },
    { src: "1%20(5).jpeg", caption: "Di Bawah Rindang Pepohonan Hijau" },
    { src: "1%20(6).jpeg", caption: "Menatap Masa Depan Berdua" },
    { src: "1%20(7).jpeg", caption: "Bersama Selamanya dalam Dekapan Semesta" }
  ];

  let currentIndex = 0;

  // Inisialisasi Thumbnail Bar
  if (thumbsContainer) {
    thumbsContainer.innerHTML = "";
    photos.forEach((photo, idx) => {
      const thumb = document.createElement("div");
      thumb.className = `lightbox-thumb ${idx === 0 ? "active" : ""}`;
      thumb.dataset.index = idx;
      thumb.innerHTML = `<img src="${photo.src}" alt="Thumb ${idx + 1}" loading="lazy">`;
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        goToPhoto(idx);
      });
      thumbsContainer.appendChild(thumb);
    });
  }

  // Tampilkan foto pada index tertentu
  function updatePhotoDisplay(direction = "none") {
    const photo = photos[currentIndex];
    
    // Terapkan animasi slide
    modalImg.classList.remove("slide-next", "slide-prev");
    void modalImg.offsetWidth; // Trigger reflow untuk reset animation
    if (direction === "next") {
      modalImg.classList.add("slide-next");
    } else if (direction === "prev") {
      modalImg.classList.add("slide-prev");
    }

    modalImg.src = photo.src;
    modalImg.alt = photo.caption;
    if (captionEl) captionEl.textContent = photo.caption;
    if (counterEl) counterEl.textContent = `Foto ${currentIndex + 1} / ${photos.length}`;

    // Update status active pada thumbnail
    if (thumbsContainer) {
      const allThumbs = thumbsContainer.querySelectorAll(".lightbox-thumb");
      allThumbs.forEach((th, idx) => {
        if (idx === currentIndex) {
          th.classList.add("active");
          th.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        } else {
          th.classList.remove("active");
        }
      });
    }
  }

  function goToPhoto(index, direction = "none") {
    if (index < 0) {
      currentIndex = photos.length - 1;
    } else if (index >= photos.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }
    updatePhotoDisplay(direction);
  }

  function nextPhoto() {
    goToPhoto(currentIndex + 1, "next");
  }

  function prevPhoto() {
    goToPhoto(currentIndex - 1, "prev");
  }

  function openLightbox(index) {
    currentIndex = index >= 0 && index < photos.length ? index : 0;
    updatePhotoDisplay("none");
    modal.classList.add("show");
    document.addEventListener("keydown", handleKeyNavigation);
  }

  function closeLightbox() {
    modal.classList.remove("show");
    document.removeEventListener("keydown", handleKeyNavigation);
  }

  // Keyboard Navigation: Panah Kiri, Kanan, Esc
  function handleKeyNavigation(e) {
    if (!modal.classList.contains("show")) return;
    if (e.key === "ArrowRight") {
      nextPhoto();
    } else if (e.key === "ArrowLeft") {
      prevPhoto();
    } else if (e.key === "Escape") {
      closeLightbox();
    }
  }

  // Event Listeners Tombol Navigasi
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nextPhoto();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      prevPhoto();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  // Klik di luar foto untuk menutup
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stageEl) {
      closeLightbox();
    }
  });

  // Pasang click listener pada setiap kartu foto galeri di halaman
  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.dataset.index) || 0;
      openLightbox(idx);
    });
  });

  // ==========================================================================
  // TOUCH SWIPE GESTURES (UNTUK HP / MOBILE)
  // ==========================================================================
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let isSwiping = false;

  const swipeTarget = stageEl || modalImg;

  swipeTarget.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    }
  }, { passive: true });

  swipeTarget.addEventListener("touchmove", (e) => {
    if (!isSwiping || e.touches.length !== 1) return;
    touchEndX = e.touches[0].clientX;
  }, { passive: true });

  swipeTarget.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const diffX = touchEndX - touchStartX;
    const diffY = (e.changedTouches[0]?.clientY || touchStartY) - touchStartY;

    // Jika geseran horizontal lebih dominan daripada vertikal dan melewati threshold 35px
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Geser ke kiri -> Next foto
        nextPhoto();
      } else {
        // Geser ke kanan -> Prev foto
        prevPhoto();
      }
    }
    touchStartX = 0;
    touchEndX = 0;
  });

  // ==========================================================================
  // MOUSE DRAG GESTURES (UNTUK PC / DESKTOP)
  // ==========================================================================
  let mouseStartX = 0;
  let isMouseDown = false;

  modalImg.addEventListener("mousedown", (e) => {
    mouseStartX = e.clientX;
    isMouseDown = true;
  });

  window.addEventListener("mouseup", (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    const diffX = e.clientX - mouseStartX;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  });
}

// ============================================================================
// 9. TOOL GENERATOR LINK TAMU (JIKA DIAKSES DARI HALAMAN TERSEBUT)
// ============================================================================
function initShareTool() {
  const inputEl = document.getElementById("toolGuestInput");
  const btnEl = document.getElementById("btnGenerateLink");

  if (!btnEl || !inputEl) return;

  btnEl.addEventListener("click", () => {
    const guestName = inputEl.value.trim();
    if (!guestName) {
      showToast("Ketik nama tamu terlebih dahulu!");
      return;
    }

    const currentUrl = window.location.origin + window.location.pathname.replace(/generator\.html$/, "index.html");
    const personalizedUrl = `${currentUrl}?to=${encodeURIComponent(guestName)}`;

    copyToClipboard(personalizedUrl);
    showToast(`Link khusus untuk "${guestName}" berhasil disalin! Siap dikirim ke WhatsApp.`);
  });
}

// ============================================================================
// 9B. MODE ADMIN / PENGANTIN (?admin=true atau ?kelola=1)
// ============================================================================
function initAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get("admin") === "true" || urlParams.get("admin") === "1" || urlParams.get("kelola") === "1";
  
  if (isAdmin) {
    // Tombol melayang khusus pengantin untuk mengelola / generate link tamu
    const adminBadge = document.createElement("a");
    adminBadge.href = "generator.html";
    adminBadge.className = "admin-floating-badge";
    adminBadge.title = "Buka Portal Generator Link Tamu";
    adminBadge.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
      </svg>
      <span>Portal Generator Tamu 🔑</span>
    `;
    adminBadge.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 999;
      background: linear-gradient(135deg, #d4af37, #aa8010);
      color: #0b0f19;
      font-weight: 700;
      font-size: 0.82rem;
      padding: 10px 18px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 4px 18px rgba(212, 175, 55, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
    `;
    document.body.appendChild(adminBadge);
  }
}

// ============================================================================
// 10. HELPER FUNCTIONS
// ============================================================================
function copyText(text, successMsg) {
  copyToClipboard(text);
  showToast(successMsg || "Teks berhasil disalin!");
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Gagal salin teks:', err);
    }
    textArea.remove();
  }
}

function showToast(message) {
  const toast = document.getElementById("toastBox");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

function escapeHtml(string) {
  if (!string) return "";
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
