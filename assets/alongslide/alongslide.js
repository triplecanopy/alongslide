(function() {
  var Alongslide,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Alongslide = (function() {
    Alongslide.prototype.panels = {};

    Alongslide.prototype.sections = {};

    Alongslide.prototype.parser = null;

    Alongslide.prototype.layout = null;

    Alongslide.prototype.scrolling = null;

    function Alongslide(options) {
      var _ref, _ref1, _ref2, _ref3;
      if (options == null) {
        options = {};
      }
      this.goToPanel = __bind(this.goToPanel, this);
      this.source = (_ref = $(options.source)) != null ? _ref : $('#content .raw');
      this.frames = (_ref1 = $(options.to)) != null ? _ref1 : $('#frames');
      this.regionCls = (_ref2 = options.regionCls) != null ? _ref2 : 'column';
      RegionFlow.prototype.init();
      this.parser = new this.Parser({
        source: this.source
      });
      _ref3 = this.parser.parse(), this.flowNames = _ref3.flowNames, this.backgrounds = _ref3.backgrounds, this.panels = _ref3.panels, this.footnotes = _ref3.footnotes, this.sourceLength = _ref3.sourceLength;
      this.layout = new this.Layout({
        sourceLength: this.sourceLength,
        frames: this.frames,
        flowNames: this.flowNames,
        backgrounds: this.backgrounds,
        panels: this.panels,
        regionCls: this.regionCls
      });
      this.scrolling = new this.Scrolling({
        frames: this.frames
      });
    }

    Alongslide.prototype.render = function(postRenderCallback) {
      var frameAspect;
      frameAspect = FixedAspect.prototype.fitFrame(this.layout.FRAME_WIDTH);
      return this.layout.render((function(_this) {
        return function(lastFramePosition) {
          _this.lastFramePosition = lastFramePosition;
          _this.refresh(frameAspect);
          _this.applyFootnotes();
          _this.applyAnchorScrolling();
          $(document).triggerHandler('alongslide.ready', _this.frames);
          _this.hashToPosition();
          FixedAspect.prototype.fitPanels(frameAspect);
          return postRenderCallback();
        };
      })(this));
    };

    Alongslide.prototype.refresh = function() {
      var frameAspect;
      frameAspect = FixedAspect.prototype.fitFrame(this.layout.FRAME_WIDTH);
      this.scrolling.render(frameAspect, this.lastFramePosition);
      return FixedAspect.prototype.fitPanels(frameAspect);
    };

    Alongslide.prototype.hashToPosition = function() {
      var hash;
      hash = window.location.hash;
      if (hash.length > 0) {
        return this.goToPanel(hash.substr(1));
      } else {
        return this.goToPanel('titlesplash');
      }
    };

    Alongslide.prototype.applyFootnotes = function() {
      return this.frames.find('a[rel=footnote]').each((function(_this) {
        return function(i, el) {
          var $el, $footnote;
          $el = $(el);
          $footnote = _this.footnotes.find($el.attr('href'));
          $el.parent('sup').append($footnote);
          return $el.on("click", function(e) {
            return $(this).toggleClass('active');
          });
        };
      })(this));
    };

    Alongslide.prototype.applyAnchorScrolling = function() {
      var self;
      self = this;
      return this.frames.find('a[href*=#]:not([href=#])').on('click', function(e) {
        return self.goToPanel(this.hash.substr(1));
      });
    };

    Alongslide.prototype.goToPanel = function(alsId) {
      var $target, targetPos;
      $target = $('#frames').find('[data-alongslide-id=' + alsId + ']');
      targetPos = $target.data('als-in-position');
      return this.scrolling.scrollToPosition(targetPos);
    };

    return Alongslide;

  })();

  window.Alongslide = Alongslide;

}).call(this);
