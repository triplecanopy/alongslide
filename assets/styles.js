(function() {
  window.Styles = (function() {
    function Styles() {}

    Styles.prototype.urls = [];

    Styles.prototype.loadLater = function(snippet) {
      var _this = this;
      return $(snippet).filter('link').each(function(index, link) {
        return _this.urls.push($(link).attr('href'));
      });
    };

    Styles.prototype.doLoad = function(callback) {
      var styles,
        _this = this;
      styles = $('<style type="text/css"/>').appendTo('body');
      $.each(this.urls, function(index, url) {
        return $.ajax(url, {
          async: false,
          success: function(data, textStatus, jqXHR) {
            return styles.append(data);
          }
        });
      });
      return callback();
    };

    Styles.prototype.formatPercentages = function(selector, values) {
      var declarations,
        _this = this;
      declarations = (_.map(values, function(value, key) {
        return "" + key + ": " + (_this.formatPercentageValue(value));
      })).join(';');
      return "" + selector + " { " + declarations + " }";
    };

    Styles.prototype.formatPercentageValues = function(values) {
      var _this = this;
      return _.object(_(values).map(function(percent, key) {
        return [key, _this.formatPercentageValue(percent)];
      }));
    };

    Styles.prototype.formatPercentageValue = function(value) {
      return "" + (value * 100) + "%";
    };

    Styles.prototype.formatPixels = function(selector, values) {
      var declarations;
      declarations = (_.map(values, function(value, key) {
        return "" + key + ": " + value + "px";
      })).join(';');
      return "" + selector + " { " + declarations + " }";
    };

    Styles.prototype.write = function(id, styles) {
      $("style#" + id).remove();
      return $('<style type="text/css" id="' + id + '"/>').append(styles).appendTo('body');
    };

    return Styles;

  })();

}).call(this);
