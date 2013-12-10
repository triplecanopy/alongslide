(function() {
  $(function() {
    return FastClick.attach(document.body);
  });

  $(function() {
    return $('.static').find('a.read_more').click(function() {
      $(this).parent().prev('div').slideToggle();
      $(this).find('span').toggleClass('hide');
      return false;
    });
  });

  $(function() {
    return $('ul.partners a').one('click', function() {
      return window.top.ga('send', 'event', "Ad", "Click", $(this).attr('title'));
    });
  });

}).call(this);
