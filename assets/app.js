$(function () {

  let currentFilter = 'all';

  $('.chip').click(function () {
    $('.chip').removeClass('active');
    $(this).addClass('active');

    currentFilter = $(this).data('filter');
    filterApps();
  });

  $('#searchInput').on('keyup', function () {
    filterApps();
  });

  function filterApps() {

    let keyword = $('#searchInput').val().toLowerCase();

    $('.app-section').each(function () {

      let section = $(this);
      let hasVisibleApp = false;

      section.find('.app-item').each(function () {

        let categories = ($(this).data('category') + '').split(' ');
        let name = ($(this).data('name') + '').toLowerCase();

        let matchCategory =
          currentFilter === 'all' ||
          categories.includes(currentFilter);

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
    const section = $(button).closest('.app-section');
    const container = section.find('.app-scroll').get(0);

    const scrollAmount = 300; // adjust speed

    if (direction === 'left') {
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    } else {
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  // LEFT arrow click
  $('.scroll-btn.left').on('click', function () {
    scrollContainer(this, 'left');
  });

  // RIGHT arrow click
  $('.scroll-btn.right').on('click', function () {
    scrollContainer(this, 'right');
  });

});
