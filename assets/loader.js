(function() {
  window.Loader = (function() {
    var SHEER_OPACITY;

    function Loader() {}

    Loader.prototype.INITIAL_PROGRESS = 0.1;

    SHEER_OPACITY = 0.9;

    Loader.prototype.show = function(lite) {
      this.updateProgress(lite ? 0.0 : this.INITIAL_PROGRESS);
      return this.loader().show().css({
        opacity: lite ? SHEER_OPACITY : 1.0
      });
    };

    Loader.prototype.hide = function() {
      var _this = this;
      this.updateProgress(1.0);
      this.loader().css({
        opacity: 0.0
      });
      return setTimeout((function() {
        return _this.loader().hide();
      }), 200);
    };

    Loader.prototype.updateProgress = function(progress) {
      return this.progress().css({
        width: "" + (progress * 100) + "%"
      });
    };

    Loader.prototype.updateSecondaryProgress = function(progress) {
      return this.updateProgress(this.INITIAL_PROGRESS + (1.0 - this.INITIAL_PROGRESS) * progress);
    };

    Loader.prototype.loader = function() {
      return this.loaderEl || (this.loaderEl = $('#loading'));
    };

    Loader.prototype.progress = function() {
      return this.loader().find('.progress');
    };

    return Loader;

  })();

}).call(this);
