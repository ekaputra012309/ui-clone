$(document).ready(function () {
        /* ================= TAB SYSTEM ================= */
        $(".tab-btn").click(function () {
          $(".tab-btn").removeClass("active");
          $(this).addClass("active");

          let tab = $(this).data("tab");

          $(".tab-content-box").addClass("hidden");
          $("#" + tab).removeClass("hidden");
        });

        let images = [];
        let currentIndex = 0;

        // collect all images
        $(".screenshots img").each(function () {
          images.push($(this).attr("src"));
        });

        /* OPEN VIEWER */
        $(".screenshots img").click(function () {
          currentIndex = $(this).index();
          $("#viewerImg").attr("src", images[currentIndex]);
          $("#viewer").removeClass("hidden");
        });

        /* CLOSE */
        $(".viewer-close").click(function () {
          $("#viewer").addClass("hidden");
        });

        /* NEXT */
        function showNext() {
          currentIndex = (currentIndex + 1) % images.length;
          $("#viewerImg").attr("src", images[currentIndex]);
        }

        /* PREV */
        function showPrev() {
          currentIndex = (currentIndex - 1 + images.length) % images.length;
          $("#viewerImg").attr("src", images[currentIndex]);
        }

        $(".viewer-btn.right").click(showNext);
        $(".viewer-btn.left").click(showPrev);

        /* SWIPE (MOBILE + MOUSE) */
        let startX = 0;

        $("#viewer").on("touchstart mousedown", function (e) {
          startX = e.originalEvent.touches
            ? e.originalEvent.touches[0].clientX
            : e.clientX;
        });

        $("#viewer").on("touchend mouseup", function (e) {
          let endX = e.originalEvent.changedTouches
            ? e.originalEvent.changedTouches[0].clientX
            : e.clientX;

          let diff = startX - endX;

          if (Math.abs(diff) > 50) {
            if (diff > 0) {
              showNext(); // swipe left
            } else {
              showPrev(); // swipe right
            }
          }
        });
      });