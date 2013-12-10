(function() {
  var GALLERY_CAPTION_HEIGHT_PX, fitGalleryAspect;

  GALLERY_CAPTION_HEIGHT_PX = 20;

  fitGalleryAspect = function() {
    return $('article.medium-format .alongslide .als-image').each(function() {
      var imageBoxHeight;
      imageBoxHeight = $(this).closest('.als-gallery').length > 0 ? $(this).closest('.panel').width() + GALLERY_CAPTION_HEIGHT_PX : $(this).find('img').height();
      return $(this).children('.image-box').height(imageBoxHeight);
    });
  };

  $(document).on('alongslide.ready', function() {
    return fitGalleryAspect();
  });

  $(window).resize(function() {
    return fitGalleryAspect();
  });

}).call(this);
