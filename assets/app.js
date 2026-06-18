$(function () {
  let currentFilter = "all";

  $(".chip").click(function () {
    $(".chip").removeClass("active");
    $(this).addClass("active");

    currentFilter = $(this).data("filter");
    filterApps();
  });

  $("#searchInput").on("keyup", function () {
    filterApps();
  });

  function filterApps() {
    let keyword = $("#searchInput").val().toLowerCase();

    $(".app-section").each(function () {
      let section = $(this);
      let hasVisibleApp = false;

      section.find(".app-item").each(function () {
        let categories = ($(this).data("category") + "").split(" ");
        let name = ($(this).data("name") + "").toLowerCase();

        let matchCategory =
          currentFilter === "all" || categories.includes(currentFilter);

        let matchSearch = name.includes(keyword);

        if (matchCategory && matchSearch) {
          $(this).show();
          hasVisibleApp = true;
        } else {
          $(this).hide();
        }
      });

      // 👉 THIS is the key fix
      if (hasVisibleApp) {
        section.show();
      } else {
        section.hide();
      }
    });
  }
});

$(document).ready(function () {
  function scrollContainer(button, direction) {
    const section = $(button).closest(".app-section");
    const container = section.find(".app-scroll").get(0);

    const scrollAmount = 300; // adjust speed

    if (direction === "left") {
      container.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    } else {
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }

  // LEFT arrow click
  $(".scroll-btn.left").on("click", function () {
    scrollContainer(this, "left");
  });

  // RIGHT arrow click
  $(".scroll-btn.right").on("click", function () {
    scrollContainer(this, "right");
  });
});

// sql
let db;
let allApps = [];
let currentFilter = "all";

// init SQL.js
initSqlJs({
  locateFile: (file) =>
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/" + file,
}).then(async (SQL) => {
  const response = await fetch("./db/store.db");
  const buffer = await response.arrayBuffer();

  db = new SQL.Database(new Uint8Array(buffer));

  loadApps();
});

// load apps from DB
function loadApps() {
  const result = db.exec(`
    SELECT 
      a.*,
      GROUP_CONCAT(p.name) as platforms
    FROM apps a
    LEFT JOIN app_platforms ap ON ap.app_id = a.id
    LEFT JOIN platforms p ON p.id = ap.platform_id
    GROUP BY a.id
  `);

  if (!result.length) return;

  const cols = result[0].columns;
  const values = result[0].values;

  allApps = values.map((row) => {
    let obj = {};
    row.forEach((val, i) => (obj[cols[i]] = val));
    return obj;
  });

  renderApps();
}

// render UI
function renderApps() {
  let html = "";

  let filtered = allApps.filter((app) => {
    const platforms = (app.platforms || "").toLowerCase();

    const matchPlatform =
      currentFilter === "all" || platforms.includes(currentFilter);

    const matchSearch = app.name
      .toLowerCase()
      .includes($("#searchInput").val().toLowerCase());

    return matchPlatform && matchSearch;
  });

  $("#appList").empty();

  filtered.forEach((app) => {
    html += `
      <a href="detail.html?app=${app.slug}" class="text-dark">
        <div class="card m-2 p-2" style="width:280px">
          <img src="${app.banner_url}" style="height:120px; object-fit:cover"/>
          <div class="d-flex mt-2 align-items-center">
            <img src="${app.icon_url}" width="40" height="40" class="mr-2"/>
            <div>
              <b>${app.name}</b><br/>
              <i class="fas fa-star text-warning"></i> ${app.rating}

              <div class="mt-1">
                ${renderPlatformBadges(app.platforms)}
              </div>
            </div>
          </div>
        </div>
      </a>
    `;
  });

  function renderPlatformBadges(platforms) {
    return (platforms || "")
      .split(",")
      .map((p) => {
        const name = p.trim().toLowerCase();

        const map = {
          android: "badge-success",
          windows: "badge-primary",
        };

        return `<span class="badge ${
          map[name] || "badge-secondary"
        } mr-1">${p}</span>`;
      })
      .join("");
  }

  $("#appList").html(html);
}

// search
$("#searchInput").on("input", function () {
  renderApps();
});

function renderCustom(list) {
  let html = "";

  list.forEach((app) => {
    html += `
      <a href="detail.html?app=${app.slug}" class="text-dark">
        <div class="card m-2 p-2" style="width:280px">
          <img src="${app.banner_url}" style="height:120px; object-fit:cover"/>
          <div class="d-flex mt-2 align-items-center">
            <img src="${app.icon_url}" width="40" height="40" class="mr-2"/>
            <div>
              <b>${app.name}</b><br/>
              <i class="fas fa-star text-warning"></i> ${app.rating}
            </div>
          </div>
        </div>
      </a>
    `;
  });

  $("#appList").html(html);
}

// filter
$(".chip").on("click", function () {
  $(".chip").removeClass("active");
  $(this).addClass("active");

  currentFilter = $(this).data("filter");
  renderApps();
});
