$(function() {
  // position source modal
  markdown_source_left = ($(window).width() - 900) / $(window).width() / 2;
  Styles.prototype.write('markdown-source-frame-aspect', Styles.prototype.formatPercentages('#markdown-source', {
    left: markdown_source_left
  }));

  // click handler: open modal
  $(document).on('click', '[data-alongslide-id=footer] a:first', function() {
    $('#markdown-source').addClass('on')
    return false
  })

  // click handler: close modal
  $(document).on('click', function(event) {
    if ($(event.target).is('a') && !$(event.target).is('a.close')) return true
    $('#markdown-source').removeClass('on')
    return false
  })
})
;
