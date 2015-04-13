$(function() {
  var $source = $('#markdown-source')

  // click handler: open modal
  $(document).on('click', '[data-alongslide-id=footer] a:eq(1)', function() {
    $source.css({
      left: ($(window).width() - $source.outerWidth()) / 2
    }).addClass('on')
    return false
  })

  // click handler: close modal
  $(document).on('click', function(event) {
    if ($(event.target).is('a') && !$(event.target).is('a.close')) return true
    $source.removeClass('on')
    return false
  })
})
;
