// Fidget Detox App State
let state = {
  savedMoney: 0,
  successCount: 0,
  lastSuccessDate: "",
  todaySavedMoney: 0
};

// Current Session State
let currentSelectedFood = null;
let currentRotation = 0;
let countdownInterval = null;
let missionTimer = 0;
let isSpinning = false;

// Mock Store & Menu Data
const MOCK_STORES = [
  {
    name: "🍗 치킨천국",
    rating: "4.9",
    items: [
      { id: "chicken_1", name: "황금바삭 치킨 세트", price: 18000, emoji: "🍗", description: "바삭함의 끝판왕, 감자튀김과 콜라 포함" },
      { id: "chicken_2", name: "매콤달콤 양념치킨", price: 19000, emoji: "🍗", description: "입맛 돋우는 특제 고추장 양념 소스" }
    ]
  },
  {
    name: "🍕 피자월드",
    rating: "4.8",
    items: [
      { id: "pizza_1", name: "치즈 폭탄 시카고 피자", price: 25000, emoji: "🍕", description: "흘러넘치는 자연산 모짜렐라 치즈의 향연" },
      { id: "pizza_2", name: "수제 갈릭 쉬림프 피자", price: 27000, emoji: "🍕", description: "탱글한 새우와 갈릭 칩의 환상적인 만남" }
    ]
  },
  {
    name: "🐷 족발마을",
    rating: "4.9",
    items: [
      { id: "jokbal_1", name: "야들야들 한방 족발", price: 32000, emoji: "🐷", description: "12가지 한방 약재로 푹 삶아 쫄깃한 식감" }
    ]
  },
  {
    name: "🍜 분식나라",
    rating: "4.7",
    items: [
      { id: "bunsik_1", name: "매콤 치즈 떡튀순 세트", price: 15000, emoji: "🍜", description: "치즈떡볶이, 모둠튀김, 찰순대 알찬 구성" }
    ]
  },
  {
    name: "🍔 버거캠프",
    rating: "4.6",
    items: [
      { id: "burger_1", name: "더블 비프 치즈 버거 세트", price: 12000, emoji: "🍔", description: "수제 소고기 패티 2장과 진한 아메리칸 치즈" }
    ]
  }
];

// Mission definitions mapped to spinner wheel sectors
// Sector angles: 30s Wait (36°), Water (108°), Breath (180°), Walk (252°), 1m Wait (324°)
const MISSION_DEFS = [
  {
    id: "30s",
    emoji: "⏱️",
    title: "30초 참기 미션",
    instruction: "잠시 눈을 감고 배달 음식을 시켰을 때의 후회를 상상하며 30초 동안 참아보세요.",
    duration: 30,
    centerAngle: 36
  },
  {
    id: "water",
    emoji: "💧",
    title: "시원한 물 한잔 마시기",
    instruction: "부엌으로 가서 물을 한 잔 가득 따라 천천히 음미하며 마셔보세요. 물이 몸을 깨끗하게 채웁니다.",
    duration: 30,
    centerAngle: 108
  },
  {
    id: "breath",
    emoji: "🌬️",
    title: "4-4-4 심호흡 미션",
    instruction: "화면의 링이 커질 때 숨을 들이쉬고, 멈출 때 참고, 작아질 때 내쉬세요. 마음을 차분히 가라앉힙니다.",
    duration: 40,
    centerAngle: 180
  },
  {
    id: "walk",
    emoji: "🚶",
    title: "가벼운 스트레칭과 산책",
    instruction: "방 안을 가볍게 걷거나, 팔다리를 쭉 펴고 기지개를 켜며 몸의 굳은 근육을 풀어보세요.",
    duration: 45,
    centerAngle: 252
  },
  {
    id: "1m",
    emoji: "⏳",
    title: "1분 참기 미션",
    instruction: "1분만 기다리면 배달 금액을 지키고 오늘의 챌린지에 멋지게 성공할 수 있습니다!",
    duration: 60,
    centerAngle: 324
  }
];

// DOM Elements
const todaySavedTxt = document.getElementById("today-saved-txt");
const totalSavedTxt = document.getElementById("total-saved-txt");
const streakTxt = document.getElementById("streak-txt");
const menuListContainer = document.getElementById("menu-list-container");
const timerTxt = document.getElementById("timer-txt");
const missionTitle = document.getElementById("mission-title");
const missionInstruction = document.getElementById("mission-instruction");
const missionTypeBadge = document.getElementById("mission-type-badge");
const breathingRingContainer = document.getElementById("breathing-ring-container");
const breathingRing = document.querySelector(".breathing-ring");
const breathingText = document.getElementById("breathing-text");
const successSavedMessage = document.getElementById("success-saved-message");
const shareCanvas = document.getElementById("share-canvas");

// Overlays & Overlay Subsections
const missionOverlay = document.getElementById("mission-overlay");
const overlaySpinnerSection = document.getElementById("overlay-spinner-section");
const overlayActiveSection = document.getElementById("overlay-active-section");
const successOverlay = document.getElementById("success-overlay");

// Fidget Spinner elements
const spinnerWheel = document.getElementById("spinner-wheel");
const startMissionBtn = document.getElementById("start-mission-btn");

// Reset Button & Action Buttons
const resetBtn = document.getElementById("reset-btn");
const completeMissionBtn = document.getElementById("complete-mission-btn");
const downloadShareBtn = document.getElementById("download-share-btn");
const eatHomeBtn = document.getElementById("eat-home-btn");
const keepResistingBtn = document.getElementById("keep-resisting-btn");

// Reset Modal Elements
const confirmModal = document.getElementById("confirm-modal");
const confirmOkBtn = document.getElementById("confirm-ok-btn");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");

// Initialization
window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateMainScreenUI();
  setupEventListeners();
  generateFictionalMenu();
  resetFoodSelection();
});

// Helper: Get today's local date string (YYYY-MM-DD)
function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: Get yesterday's local date string (YYYY-MM-DD)
function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// State Management
function loadState() {
  const stored = localStorage.getItem("delivery_detox_state");
  if (stored) {
    try {
      state = JSON.parse(stored);
    } catch (e) {
      console.error("데이터 로드 오류:", e);
    }
  }

  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  // If a new day has arrived, reset today's saved money
  if (state.lastSuccessDate !== todayStr) {
    state.todaySavedMoney = 0;
    
    // If the user also missed yesterday, break the streak
    if (state.lastSuccessDate !== yesterdayStr && state.lastSuccessDate !== "") {
      state.successCount = 0;
    }
    saveState();
  }
}

function saveState() {
  localStorage.setItem("delivery_detox_state", JSON.stringify(state));
}

function updateMainScreenUI() {
  todaySavedTxt.innerText = `${state.todaySavedMoney.toLocaleString()}원`;
  totalSavedTxt.innerText = `${state.savedMoney.toLocaleString()}원`;
  
  if (state.successCount > 0) {
    streakTxt.innerText = `${state.successCount}일째 🔥`;
  } else {
    streakTxt.innerText = `0일째 📅`;
  }
}

// Fictional Menu Generator
function generateFictionalMenu() {
  menuListContainer.innerHTML = "";

  MOCK_STORES.forEach(store => {
    const storeCard = document.createElement("div");
    storeCard.className = "store-card";

    const storeHeader = document.createElement("div");
    storeHeader.className = "store-header";
    storeHeader.innerText = store.name;
    storeCard.appendChild(storeHeader);

    store.items.forEach(item => {
      const foodItem = document.createElement("div");
      foodItem.className = "food-item";
      foodItem.id = `food-${item.id}`;
      
      const foodInfo = document.createElement("div");
      foodInfo.className = "food-info";

      const foodName = document.createElement("span");
      foodName.className = "food-name";
      foodName.innerText = item.name;

      const foodRatingPrice = document.createElement("div");
      foodRatingPrice.className = "food-rating-price";

      const foodRating = document.createElement("span");
      foodRating.className = "food-rating";
      foodRating.innerText = `⭐ ${store.rating}`;

      const foodPrice = document.createElement("span");
      foodPrice.className = "food-price";
      foodPrice.innerText = `${item.price.toLocaleString()}원`;

      foodRatingPrice.appendChild(foodRating);
      foodRatingPrice.appendChild(foodPrice);
      foodInfo.appendChild(foodName);
      foodInfo.appendChild(foodRatingPrice);

      const actionBadge = document.createElement("div");
      actionBadge.className = "food-action-badge";
      actionBadge.innerText = "선택";

      foodItem.appendChild(foodInfo);
      foodItem.appendChild(actionBadge);

      foodItem.addEventListener("click", () => {
        if (isSpinning) return;
        selectFoodItem(item);
      });

      storeCard.appendChild(foodItem);
    });

    menuListContainer.appendChild(storeCard);
  });
}

function selectFoodItem(item) {
  document.querySelectorAll(".food-item").forEach(el => {
    el.classList.remove("selected");
    const badge = el.querySelector(".food-action-badge");
    if (badge) badge.innerText = "선택";
  });

  const selectedEl = document.getElementById(`food-${item.id}`);
  if (selectedEl) {
    selectedEl.classList.add("selected");
    const badge = selectedEl.querySelector(".food-action-badge");
    if (badge) badge.innerText = "선택됨";
  }

  currentSelectedFood = item;
  
  startMissionBtn.disabled = false;
  startMissionBtn.innerText = `⚡ ${item.name} 참기 시작하기`;
}

function resetFoodSelection() {
  currentSelectedFood = null;
  document.querySelectorAll(".food-item").forEach(el => {
    el.classList.remove("selected");
    const badge = el.querySelector(".food-action-badge");
    if (badge) badge.innerText = "선택";
  });

  startMissionBtn.disabled = true;
  startMissionBtn.innerText = "⚡ 참기 미션 시작하기";
}

// Show overlays
function showOverlay(overlay) {
  overlay.classList.remove("hidden");
}

function hideAllOverlays() {
  missionOverlay.classList.add("hidden");
  successOverlay.classList.add("hidden");
}

// Setup Event Listeners
function setupEventListeners() {
  // Reset storage stats
  resetBtn.addEventListener("click", () => {
    confirmModal.classList.remove("hidden");
  });

  // CTA triggers immediate overlay slide-up & starts spinner
  startMissionBtn.addEventListener("click", () => {
    if (!currentSelectedFood || isSpinning) return;

    // 1. Immediately slide-up the mission overlay
    showOverlay(missionOverlay);
    
    // 2. Display spinner section and hide active timer
    overlaySpinnerSection.classList.remove("hidden");
    overlayActiveSection.classList.add("hidden");

    // 3. Fire the automatic spin
    startMissionSpinner();
  });

  // Manual completion button
  completeMissionBtn.addEventListener("click", finalizeSuccess);

  // Share card save
  downloadShareBtn.addEventListener("click", downloadShareCard);

  // Success screen returns
  eatHomeBtn.addEventListener("click", () => {
    showToast("🍳 건강한 집밥 요리를 시작해보세요!");
    hideAllOverlays();
    resetFoodSelection();
    document.querySelector(".app-frame").scrollTop = 0;
  });

  keepResistingBtn.addEventListener("click", () => {
    showToast("🛡️ 굳건한 의지로 배달을 철저히 막아냈습니다!");
    hideAllOverlays();
    resetFoodSelection();
    document.querySelector(".app-frame").scrollTop = 0;
  });

  // Modal actions
  confirmCancelBtn.addEventListener("click", () => {
    confirmModal.classList.add("hidden");
  });

  confirmOkBtn.addEventListener("click", () => {
    localStorage.removeItem("delivery_detox_state");
    state = {
      savedMoney: 0,
      successCount: 0,
      lastSuccessDate: "",
      todaySavedMoney: 0
    };
    saveState();
    updateMainScreenUI();
    resetFoodSelection();
    confirmModal.classList.add("hidden");
    showToast("🧹 기록이 모두 깨끗하게 초기화되었습니다.");
    document.querySelector(".app-frame").scrollTop = 0;
  });
}

// Toast notification helper
function showToast(message) {
  const toast = document.createElement("div");
  toast.style.position = "absolute";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%) translateY(100px)";
  toast.style.backgroundColor = "rgba(33, 37, 41, 0.95)";
  toast.style.color = "#FFFFFF";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "30px";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "750";
  toast.style.zIndex = "1000";
  toast.style.textAlign = "center";
  toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
  toast.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  toast.style.width = "85%";
  toast.style.maxWidth = "350px";
  toast.innerText = message;

  document.querySelector(".app-frame").appendChild(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 2800);
}

// Spinner Spin Mechanics inside Overlay
function startMissionSpinner() {
  isSpinning = true;

  // Pick a random mission
  const chosenIndex = Math.floor(Math.random() * MISSION_DEFS.length);
  const chosenMission = MISSION_DEFS[chosenIndex];

  // Rotate alignment calculation
  const targetAngle = (270 - chosenMission.centerAngle + 360) % 360;
  
  // Spin forward
  const currentBase = Math.ceil(currentRotation / 360) * 360;
  currentRotation = currentBase + (360 * 5) + targetAngle;

  spinnerWheel.style.transform = `rotate(${currentRotation}deg)`;

  // Transition is 5s, wait for completion
  setTimeout(() => {
    isSpinning = false;
    activateMission(chosenMission);
  }, 5200);
}

// Activate selected mission inside the Overlay
function activateMission(mission) {
  // Swap subsections: hide roulette spinner, show active countdown card
  overlaySpinnerSection.classList.add("hidden");
  overlayActiveSection.classList.remove("hidden");

  // Set up details
  missionTitle.innerText = `${mission.emoji} ${mission.title}`;
  missionInstruction.innerText = mission.instruction;
  missionTypeBadge.innerText = mission.id === "breath" ? "정신 디톡스" : "인내 챌린지";

  // Set timer
  missionTimer = mission.duration;
  updateTimerDisplay();

  // Setup completion button state
  completeMissionBtn.disabled = true;
  completeMissionBtn.className = "success-btn";
  completeMissionBtn.innerText = "⌛ 미션 완료 대기 중";

  // Check breathing layout
  if (mission.id === "breath") {
    breathingRingContainer.classList.remove("hidden");
    updateBreathingRing(missionTimer);
  } else {
    breathingRingContainer.classList.add("hidden");
  }

  // Clear any existing countdown
  if (countdownInterval) clearInterval(countdownInterval);

  // Start ticking
  countdownInterval = setInterval(() => {
    missionTimer--;
    updateTimerDisplay();

    if (mission.id === "breath") {
      updateBreathingRing(missionTimer);
    }

    if (missionTimer <= 0) {
      clearInterval(countdownInterval);
      enableMissionCompletion();
    }
  }, 1000);
}

// Timer helpers
function updateTimerDisplay() {
  const mins = String(Math.floor(missionTimer / 60)).padStart(2, '0');
  const secs = String(missionTimer % 60).padStart(2, '0');
  timerTxt.innerText = `${mins}:${secs}`;
}

// Breathing Visual Sync
function updateBreathingRing(remaining) {
  const elapsed = 40 - remaining;
  const cycle = elapsed % 12;

  if (cycle < 4) {
    breathingRing.className = "breathing-ring breath-in";
    breathingText.innerText = "들숨 🌬️";
  } else if (cycle < 8) {
    breathingRing.className = "breathing-ring breath-hold";
    breathingText.innerText = "멈춤 ✋";
  } else {
    breathingRing.className = "breathing-ring breath-out";
    breathingText.innerText = "날숨 💨";
  }
}

// Unlock complete button
function enableMissionCompletion() {
  completeMissionBtn.disabled = false;
  completeMissionBtn.innerText = "🎉 미션 성공! 완료하기";
  completeMissionBtn.style.animation = "pulse 1.5s infinite";
  
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

// Record success and swap to success overlay
function finalizeSuccess() {
  if (countdownInterval) clearInterval(countdownInterval);
  completeMissionBtn.style.animation = "none";

  if (!currentSelectedFood) {
    currentSelectedFood = { name: "가상 배달 메뉴", price: 15000, emoji: "🍔" };
  }

  // Update localStorage and state
  const foodPrice = currentSelectedFood.price;
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  if (state.lastSuccessDate === todayStr) {
    state.todaySavedMoney += foodPrice;
    state.savedMoney += foodPrice;
  } else if (state.lastSuccessDate === yesterdayStr) {
    state.successCount += 1;
    state.todaySavedMoney = foodPrice;
    state.savedMoney += foodPrice;
    state.lastSuccessDate = todayStr;
  } else {
    state.successCount = 1;
    state.todaySavedMoney = foodPrice;
    state.savedMoney += foodPrice;
    state.lastSuccessDate = todayStr;
  }

  saveState();
  updateMainScreenUI();

  // Draw shared certificate canvas
  drawShareCertificate();

  // Update success screen messages
  successSavedMessage.innerHTML = `오늘 가상의 배달비 <strong>${foodPrice.toLocaleString()}원</strong>을 지켰습니다!`;

  // Hide countdown, show success
  missionOverlay.classList.add("hidden");
  showOverlay(successOverlay);
}

// Draw Viral Card using Canvas
function drawShareCertificate() {
  const ctx = shareCanvas.getContext("2d");
  const foodName = currentSelectedFood ? currentSelectedFood.name : "배달 음식";
  const foodEmoji = currentSelectedFood ? currentSelectedFood.emoji : "🍗";
  const savedPrice = currentSelectedFood ? currentSelectedFood.price : 15000;

  ctx.clearRect(0, 0, 400, 400);

  const bgGrad = ctx.createLinearGradient(0, 0, 400, 400);
  bgGrad.addColorStop(0, "#FF8787");
  bgGrad.addColorStop(1, "#FF6B6B");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 400, 400);

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(24, 24, 352, 352, 20);
  } else {
    ctx.rect(24, 24, 352, 352);
  }
  ctx.fill();

  ctx.strokeStyle = "#FFC9C9";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(34, 34, 332, 332, 14);
  } else {
    ctx.rect(34, 34, 332, 332);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FF6B6B";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("🏆 배달 방어 성공 인증서", 200, 75);

  ctx.fillStyle = "#868E96";
  ctx.font = "600 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(new Date().toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' }), 200, 100);

  ctx.font = "68px system-ui, sans-serif";
  ctx.fillText(foodEmoji, 200, 175);

  ctx.strokeStyle = "#FF6B6B";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(200, 160, 46, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(167, 127);
  ctx.lineTo(233, 193);
  ctx.stroke();

  ctx.strokeStyle = "#E9ECEF";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 225);
  ctx.lineTo(350, 225);
  ctx.stroke();

  const startY = 252;
  const stepY = 28;
  
  ctx.font = "bold 13px system-ui, sans-serif";
  
  ctx.textAlign = "left";
  ctx.fillStyle = "#868E96";
  ctx.fillText("방어해낸 음식", 60, startY);
  ctx.fillText("지켜낸 가상 머니", 60, startY + stepY);
  ctx.fillText("누적 절약 금액", 60, startY + stepY * 2);
  ctx.fillText("연속 도전 성공", 60, startY + stepY * 3);

  ctx.textAlign = "right";
  
  ctx.fillStyle = "#212529";
  ctx.fillText(foodName, 340, startY);

  ctx.fillStyle = "#FF6B6B";
  ctx.fillText(`+${savedPrice.toLocaleString()}원`, 340, startY + stepY);

  ctx.fillStyle = "#212529";
  ctx.fillText(`${state.savedMoney.toLocaleString()}원`, 340, startY + stepY * 2);

  ctx.fillStyle = "#51CF66";
  ctx.fillText(`${state.successCount}일 연속 성공!`, 340, startY + stepY * 3);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ADB5BD";
  ctx.font = "italic bold 11px system-ui, sans-serif";
  ctx.fillText("🔥 Delivery Detox Challenge", 200, 362);
}

// Download certificate to local storage
function downloadShareCard() {
  const link = document.createElement("a");
  const dateStr = getTodayString();
  
  link.download = `배달방어성공-${dateStr}.png`;
  link.href = shareCanvas.toDataURL("image/png");
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("💾 인증 사진이 파일함에 안전하게 다운로드되었습니다!");
}
