(function() {
  var Alongslide;

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

    Alongslide.prototype.render = function(frameAspect, postRenderCallback) {
      var _this = this;
      return this.layout.render(function(lastFramePosition) {
        _this.lastFramePosition = lastFramePosition;
        _this.refresh(frameAspect);
        _this.applyFootnotes();
        $(document).triggerHandler('alongslide.ready', _this.frames);
        _this.urlToPage();
        $(".inner").fitVids();
        return postRenderCallback();
      });
    };

    Alongslide.prototype.refresh = function(frameAspect) {
      return this.scrolling.render(frameAspect, this.lastFramePosition);
    };

    Alongslide.prototype.urlToPage = function() {
      var page;
      if (location.hash.length > 0) {
        page = location.hash.match(new RegExp('page' + '=([^&]*)'))[1];
        return this.scrolling.goToPage(page);
      }
    };

    Alongslide.prototype.applyFootnotes = function() {
      var _this = this;
      this.frames.find('a[rel=footnote]').each(function(i, el) {
        var footnoteId;
        footnoteId = $(el).attr('href').replace(/#/, '');
        return $(el).data('powertip', _this.footnotes[footnoteId].html());
      });
      return this.frames.find('a[rel=footnote]').powerTip({
        mouseOnToPopup: true,
        fromCenter: 0,
        placement: 'se',
        offset: 0,
        closeDelay: 300,
        intentSensitivity: 100
      });
    };

    return Alongslide;

  })();

  window.Alongslide = Alongslide;

}).call(this);
