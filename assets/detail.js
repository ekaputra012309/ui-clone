/* GLOBALS */

let db;

const params = new URLSearchParams(window.location.search);
const slug = params.get("app");

let screenshotImages = [];
let currentImageIndex = 0;

/* APP INIT */

$(document).ready(function () {
  initTabs();
  initInstallBar();
  initImageViewer();
});

/* SQL INIT */

initSqlJs({
  locateFile: (file) =>
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/" + file,
}).then(async (SQL) => {
  const response = await fetch("./db/store.db");
  const buffer = await response.arrayBuffer();

  db = new SQL.Database(new Uint8Array(buffer));

  loadApp(slug);
});

/* HELPERS */

function row(result) {
  let obj = {};

  result.values[0].forEach((value, index) => {
    obj[result.columns[index]] = value;
  });

  return obj;
}

/* APP LOADER */

function loadApp(slug) {
  const res = db.exec(`
    SELECT 
      a.*,      
      GROUP_CONCAT(DISTINCT c.name) as category
    FROM apps a    
    LEFT JOIN app_category ac ON ac.app_id = a.id
    LEFT JOIN category c ON c.id = ac.category_id    
    WHERE slug='${slug}'
     GROUP BY a.id
  `);

  if (!res.length) return;

  const app = row(res[0]);

  renderApp(app);

  loadPlatforms(app.id);
  loadScreenshots(app.id);
  loadReviews(app.id);
  loadUpdates(app.id);
}

/* APP HEADER */

function renderApp(app) {
  $("#appIcon").attr("src", app.icon_url);

  $("#appName").text(app.name);

  $("#appDesc").text(app.description || "");

  $("#appRating").text(app.rating || "0");

  const category = (app.category || "")
    .split(",")
    .map((c) => c.trim())
    .join(" • ");

  $("#appMeta").text(`${category} | ${app.download_count || 0} Downloads`);
}

/* PLATFORMS */

function loadPlatforms(appId) {
  const res = db.exec(`
    SELECT p.name, ap.download_url
    FROM app_platforms ap
    JOIN platforms p ON p.id = ap.platform_id
    WHERE ap.app_id = ${appId}
  `);

  if (!res.length) return;

  let installHTML = "";
  let badgeHTML = "";
  let platformList = [];

  res[0].values.forEach(([name, url]) => {
    platformList.push(name);

    // desktop buttons
    if (name === "Android") {
      installHTML += `
        <a href="${url}" class="store-btn android-btn">
          <i class="fab fa-android"></i> Android
        </a>
      `;
    }

    if (name === "Windows") {
      installHTML += `
        <a href="${url}" class="store-btn windows-btn">
          <i class="fab fa-windows"></i> Windows
        </a>
      `;
    }

    // badges
    if (name === "android") {
      badgeHTML += `<span class="badge-platform android mr-1">Android</span>`;
    }

    if (name === "windows") {
      badgeHTML += `<span class="badge-platform windows">Windows</span>`;
    }
  });

  $(".install-actions").html(installHTML);
  $("#platformBadges").html(badgeHTML);

  // ✅ mobile sticky bar
  renderMobileDownloadBar(platformList);
}

function renderMobileDownloadBar(platforms = []) {
  let html = "";

  const hasAndroid = platforms.includes("Android");
  const hasWindows = platforms.includes("Windows");

  if (!hasAndroid && !hasWindows) {
    $("#mobileDownloadBar").hide();
    return;
  }

  if (hasAndroid) {
    html += `
      <a class="android" href="#">
        <i class="fab fa-android"></i> Android
      </a>
    `;
  }

  if (hasWindows) {
    html += `
      <a class="windows" href="#">
        <i class="fab fa-windows"></i> Windows
      </a>
    `;
  }

  $("#mobileDownloadBar").html(html).show();
}

/* SCREENSHOTS */

function loadScreenshots(appId) {
  const res = db.exec(`
    SELECT *
    FROM screenshots
    WHERE app_id = ${appId}
    ORDER BY sort_order
  `);

  if (!res.length) {
    $("#screenshots").html("");
    updateScreenshotArrows();
    return;
  }

  let html = "";

  screenshotImages = [];

  res[0].values.forEach((row) => {
    const imageUrl = row[2];

    screenshotImages.push(imageUrl);

    html += `
      <img
        src="${imageUrl}"
        class="screenshot-img"
      />
    `;
  });

  $("#screenshots").html(html);

  const container = document.getElementById("screenshots");

  container.addEventListener("scroll", updateScreenshotArrows);

  window.addEventListener("resize", updateScreenshotArrows);

  const imgs = document.querySelectorAll(".screenshot-img");

  Promise.all(
    [...imgs].map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
    )
  ).then(() => {
    updateScreenshotArrows();
  });
}

function scrollScreenshots(direction) {
  const container = document.getElementById("screenshots");

  container.scrollBy({
    left: direction * 300,
    behavior: "smooth",
  });
}

function updateScreenshotArrows() {
  const container = document.getElementById("screenshots");

  if (!container) return;

  const wrapper = container.closest(".screenshots-container");

  if (!wrapper) return;

  const leftBtn = wrapper.querySelector(".scroll-btn.left");

  const rightBtn = wrapper.querySelector(".scroll-btn.right");

  if (container.scrollWidth <= container.clientWidth) {
    leftBtn.classList.add("hidden-arrow");
    rightBtn.classList.add("hidden-arrow");
    return;
  }

  if (container.scrollLeft <= 5) {
    leftBtn.classList.add("hidden-arrow");
  } else {
    leftBtn.classList.remove("hidden-arrow");
  }

  if (
    container.scrollLeft + container.clientWidth >=
    container.scrollWidth - 5
  ) {
    rightBtn.classList.add("hidden-arrow");
  } else {
    rightBtn.classList.remove("hidden-arrow");
  }
}

/*  IMAGE VIEWER */

function initImageViewer() {
  $(document).on("click", ".screenshot-img", function () {
    currentImageIndex = $(this).index();

    $("#viewerImage").attr("src", screenshotImages[currentImageIndex]);

    $("#imageViewer").removeClass("hidden");
  });

  $(document).on("click", ".viewer-close", function () {
    $("#imageViewer").addClass("hidden");
  });

  $(document).on("click", ".viewer-prev", showPrevImage);

  $(document).on("click", ".viewer-next", showNextImage);

  $("#imageViewer").on("click", function (e) {
    if (e.target === this) {
      $(this).addClass("hidden");
    }
  });

  $(document).on("keydown", function (e) {
    if ($("#imageViewer").hasClass("hidden")) {
      return;
    }

    if (e.key === "Escape") {
      $("#imageViewer").addClass("hidden");
    }

    if (e.key === "ArrowLeft") {
      showPrevImage();
    }

    if (e.key === "ArrowRight") {
      showNextImage();
    }
  });
}

function showPrevImage() {
  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex = screenshotImages.length - 1;
  }

  $("#viewerImage").attr("src", screenshotImages[currentImageIndex]);
}

function showNextImage() {
  currentImageIndex++;

  if (currentImageIndex >= screenshotImages.length) {
    currentImageIndex = 0;
  }

  $("#viewerImage").attr("src", screenshotImages[currentImageIndex]);
}

/*  REVIEWS */

function loadReviews(appId) {
  const res = db.exec(`
    SELECT *
    FROM reviews
    WHERE app_id = ${appId}
  `);

  if (!res.length) {
    $("#reviews").html("<p class='text-muted'>No reviews yet.</p>");
    return;
  }

  let html = "";

  res[0].values.forEach((row) => {
    html += `
      <div class="border rounded p-3 mb-2">
        <strong>${row[2]}</strong><br>
        ⭐ ${row[3]}<br>
        <small>${row[4]}</small>
      </div>
    `;
  });

  $("#reviews").html(html);
}

/*  UPDATES */

function loadUpdates(appId) {
  const res = db.exec(`
    SELECT *
    FROM updates
    WHERE app_id = ${appId}
    ORDER BY id DESC
  `);

  if (!res.length) {
    $("#updates").html("<p class='text-muted'>No updates available.</p>");
    return;
  }

  let html = `
    <h5>What's New</h5>
    <ul>
  `;

  res[0].values.forEach((row) => {
    html += `<li>${row[4]}</li>`;
  });

  html += `</ul>`;

  $("#updates").html(html);
}

/*  TABS */

function initTabs() {
  $(".tab-btn").on("click", function () {
    $(".tab-btn").removeClass("active");

    $(this).addClass("active");

    $(".tab-content-box").addClass("hidden");

    $("#" + $(this).data("tab")).removeClass("hidden");
  });
}

/* INSTALL BAR */

function initInstallBar() {
  renderInstallUI();
  $(window).on("resize", renderInstallUI);
}

function renderInstallUI() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (isMobile) {
    $("#mobileDownloadBar").css("display", "flex");
    // $(".install-actions").hide();
  } else {
    $("#mobileDownloadBar").css("display", "none");
    // $(".install-actions").show();
  }
}
