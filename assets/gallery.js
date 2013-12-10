(function() {
  var GALLERY_CAPTION_HEIGHT_PX, fitGalleryAspect;

  GALLERY_CAPTION_HEIGHT_PX = 20;

  $(document).on('alongslide.ready', function(e, frames) {
    return $(frames).find('.als-gallery').each(function() {
      var captions, gallery;
      gallery = $(this);
      gallery.children('.items').flickery({
        prev: gallery.children('a.prev.control'),
        next: gallery.children('a.next.control'),
        dimension: $('body').hasClass('project') ? 'y' : 'x'
      });
      captions = gallery.find('.caption');
      return captions.each(function(index) {
        return $(this).find('.index').html("" + (index + 1) + " / " + captions.length + ":");
      });
    });
  });

  fitGalleryAspect = function() {
    return $('article.medium-format .als-gallery ul').each(function() {
      var container_width;
      container_width = $(this).closest('.panel').width();
      $(this).width(container_width * $(this).children('li').length);
      return $(this).children('li').each(function() {
        $(this).width(container_width);
        return $(this).height(container_width + GALLERY_CAPTION_HEIGHT_PX);
      });
    });
  };

  $(document).on('alongslide.ready', function() {
    return fitGalleryAspect();
  });

  $(window).resize(function() {
    return fitGalleryAspect();
  });

  jQuery.fn.flickery = function(options) {
    var DAMPEN_MOVEMENT, IGNORE_FOR_MS, SCROLL_DURATION, THRESHOLD_TO_JUMP;
    SCROLL_DURATION = 250;
    DAMPEN_MOVEMENT = 0.4;
    THRESHOLD_TO_JUMP = 0.4;
    IGNORE_FOR_MS = 600;
    return this.each(function() {
      var currentIndex, done, gallery, gallery_items, getPosition, ignoreScroll, jumping, lastTouchX, lastTouchY, move, movingX;
      gallery = $(this);
      gallery_items = gallery.find('> ul > li');
      currentIndex = 0;
      movingX = 0;
      jumping = false;
      ignoreScroll = false;
      options.prev.click(function() {
        var prevX;
        if (currentIndex > 0) {
          prevX = getPosition(gallery_items.eq(currentIndex - 1));
          gallery.scrollTo(prevX, SCROLL_DURATION);
          return currentIndex -= 1;
        }
      });
      options.next.click(function() {
        var nextX;
        if (currentIndex < gallery_items.length - 1) {
          nextX = getPosition(gallery_items.eq(currentIndex + 1));
          gallery.scrollTo(nextX, SCROLL_DURATION);
          return currentIndex += 1;
        }
      });
      move = function(deltaX) {
        var currentX, ignoreTimeout, nextX, noScroll, prevX;
        if (jumping) {
          return true;
        }
        noScroll = true;
        currentX = getPosition(gallery_items.eq(currentIndex));
        if ((movingX + deltaX) > 0) {
          if (currentIndex < gallery_items.length - 1) {
            movingX += deltaX * DAMPEN_MOVEMENT;
            nextX = getPosition(gallery_items.eq(currentIndex + 1));
            if (movingX > Math.abs(nextX - currentX) * THRESHOLD_TO_JUMP) {
              gallery.scrollTo(nextX, SCROLL_DURATION);
              currentIndex += 1;
              jumping = true;
            }
          }
        } else if ((movingX + deltaX) < 0) {
          if (currentIndex > 0) {
            movingX += deltaX * DAMPEN_MOVEMENT;
            prevX = getPosition(gallery_items.eq(currentIndex - 1));
            if (movingX < Math.abs(currentX - prevX) * THRESHOLD_TO_JUMP) {
              gallery.scrollTo(prevX, SCROLL_DURATION);
              currentIndex -= 1;
              jumping = true;
            }
          }
        }
        if (jumping) {
          movingX = 0;
          setTimeout((function() {
            return jumping = false;
          }), SCROLL_DURATION * 2);
          noScroll = false;
          ignoreScroll = true;
          ignoreTimeout = setTimeout((function() {
            return ignoreScroll = false;
          }), IGNORE_FOR_MS);
        }
        if (jumping || noScroll) {
          return true;
        } else {
          return false;
        }
      };
      done = function() {
        return movingX = 0;
      };
      gallery.mousewheel(function(e, delta, deltaX, deltaY) {
        var res;
        if (!ignoreScroll) {
          if ((options.dimension === 'x') && (Math.abs(deltaX) > Math.abs(deltaY))) {
            res = !move(deltaX);
          }
          if ((options.dimension === 'y') && (Math.abs(deltaY) > Math.abs(deltaX))) {
            res = !move(-deltaY);
          } else {
            res = true;
          }
        } else {
          res = false;
        }
        return res;
      });
      lastTouchX = 0;
      lastTouchY = 0;
      gallery.on('touchstart', function(e) {
        lastTouchX = e.originalEvent.touches[0].pageX;
        return lastTouchY = e.originalEvent.touches[0].pageY;
      });
      gallery.on('touchmove', function(e) {
        var deltaX, deltaY, hijacked;
        deltaX = e.originalEvent.touches[0].pageX - lastTouchX;
        deltaY = e.originalEvent.touches[0].pageY - lastTouchY;
        switch (options.dimension) {
          case 'x':
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              hijacked = move(-deltaX);
            }
            break;
          case 'y':
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
              hijacked = move(-deltaY);
            }
        }
        lastTouchX = e.originalEvent.touches[0].pageX;
        lastTouchY = e.originalEvent.touches[0].pageY;
        if (hijacked) {
          return e.preventDefault();
        }
      });
      gallery.on('touchend', function(e) {
        return done();
      });
      return getPosition = function(element) {
        return element.position()[options.dimension === 'x' ? 'left' : 'top'];
      };
    });
  };

}).call(this);
