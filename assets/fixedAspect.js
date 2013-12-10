(function() {
  window.FixedAspect = (function() {
    function FixedAspect() {}

    FixedAspect.prototype.fitFrame = function(minWidthPx, marginTopPx) {
      var FRAME_ASPECT, FRAME_SELECTOR, frameAspect, frameWidthPx, marginTop, markdown_source_left, scalar, scaleDown, scaleUp, textStyles, window_aspect;
      if (marginTopPx == null) {
        marginTopPx = 0;
      }
      FRAME_ASPECT = 1.6;
      FRAME_SELECTOR = '#frames > .flow > .frame';
      frameAspect = {
        width: 1.0,
        height: 1.0,
        left: 0,
        top: 0
      };
      window_aspect = $(window).width() / $(window).height();
      if (window_aspect > FRAME_ASPECT) {
        frameAspect.width = FRAME_ASPECT / window_aspect;
        frameAspect.left = (1.0 - frameAspect.width) / 2;
      } else {
        frameAspect.height = window_aspect / FRAME_ASPECT;
        frameAspect.top = (1.0 - frameAspect.height) / 2;
      }
      marginTop = marginTopPx / $(window).height();
      if (frameAspect.top < marginTop) {
        frameAspect.top = marginTop;
        scaleDown = (1.0 - frameAspect.top) / frameAspect.height;
        frameAspect.height *= scaleDown;
        frameAspect.width *= scaleDown;
        frameAspect.left = (1.0 - frameAspect.width) / 2;
      }
      frameWidthPx = frameAspect.width * $(window).width();
      scaleUp = minWidthPx / frameWidthPx;
      if (scaleUp > 1.0) {
        frameAspect.height *= scaleUp;
        frameAspect.width *= scaleUp;
      }
      Styles.prototype.write('debug-grid-aspect', Styles.prototype.formatPercentages('#als-debug-grid', frameAspect));
      Styles.prototype.write('frame-aspect', Styles.prototype.formatPercentages(FRAME_SELECTOR, _(frameAspect).omit('left')));
      markdown_source_left = ($(window).width() - $('#markdown-source').width()) / $(window).width() / 2;
      Styles.prototype.write('markdown-source-frame-aspect', Styles.prototype.formatPercentages('#markdown-source', {
        left: markdown_source_left
      }));
      scalar = Math.max(1.0, 1.0 / scaleUp);
      textStyles = {
        'font-size': parseInt($('#content-display').css('font-size')) * scalar,
        'line-height': parseInt($('#content-display').css('line-height')) * scalar
      };
      Styles.prototype.write('frame-text', Styles.prototype.formatPixels('#frames', textStyles));
      return frameAspect;
    };

    FixedAspect.prototype.fitPanels = function(frameAspect) {
      var _this = this;
      return $('#frames > .panels > .panel').each(function(index, panel) {
        var $contents, $panel, alignment, contentsFrame, frameAspectBottom, innerFrame, panelFrame;
        $panel = $(panel);
        $contents = $panel.find('> .contents');
        alignment = Alongslide.prototype.Layout.prototype.panelAlignment($panel);
        innerFrame = $contents.data('innerFrame');
        if (innerFrame == null) {
          innerFrame = _this.innerFrame($panel);
          $contents.data('innerFrame', innerFrame);
        }
        panelFrame = {
          width: 1.0,
          height: 1.0
        };
        switch (alignment) {
          case "left":
            panelFrame.width = frameAspect.left + (innerFrame.left + innerFrame.width) * frameAspect.width;
            break;
          case "right":
            panelFrame.width = frameAspect.left + (1.0 - innerFrame.left) * frameAspect.width;
            break;
          case "top":
            panelFrame.height = frameAspect.top + (innerFrame.top + innerFrame.height) * frameAspect.height;
            break;
          case "bottom":
            frameAspectBottom = 1.0 - frameAspect.top - frameAspect.height;
            panelFrame.height = frameAspectBottom + (1.0 - innerFrame.top) * frameAspect.height;
        }
        contentsFrame = {
          left: (frameAspect.left + innerFrame.left * frameAspect.width) / panelFrame.width,
          top: (frameAspect.top + innerFrame.top * frameAspect.height) / panelFrame.height,
          width: (innerFrame.width * frameAspect.width) / panelFrame.width,
          height: (innerFrame.height * frameAspect.height) / panelFrame.height
        };
        switch (alignment) {
          case "right":
            panelFrame['margin-left'] = frameAspect.left + innerFrame.left * frameAspect.width;
            contentsFrame.left = 0;
            break;
          case "bottom":
            panelFrame.bottom = 0;
            contentsFrame.top = 0;
        }
        $panel.css(Styles.prototype.formatPercentageValues(panelFrame));
        return $contents.css(Styles.prototype.formatPercentageValues(contentsFrame));
      });
    };

    FixedAspect.prototype.innerFrame = function($panel) {
      var $contents;
      $contents = $panel.find('> .contents');
      return {
        left: parseInt($contents.css('left')) / $panel.width(),
        top: parseInt($contents.css('top')) / $panel.height(),
        width: $contents.width() / $panel.width(),
        height: $contents.height() / $panel.height()
      };
    };

    return FixedAspect;

  })();

}).call(this);
