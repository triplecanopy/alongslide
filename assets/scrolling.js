(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Alongslide.prototype.Scrolling = (function() {
    Scrolling.prototype.TRANSITIONS = {
      "in": [-1, 0],
      out: [0, 1]
    };

    Scrolling.prototype.FLIP_THRESHOLD = 0.04;

    Scrolling.prototype.WAIT_BEFORE_RESET_MS = 250;

    Scrolling.prototype.SLIDE_DURATION_MS = 400;

    Scrolling.prototype.FORCE_SLIDE_DURATION_MS = 100;

    Scrolling.prototype.NUM_WHEEL_HISTORY_EVENTS = 10;

    Scrolling.prototype.MAGNITUDE_THRESHOLD = 2;

    Scrolling.prototype.currentPosition = 0;

    Scrolling.prototype.wheelHistory = [];

    Scrolling.prototype.lastAverageMagnitude = 0;

    Scrolling.prototype.ignoreScroll = false;

    Scrolling.prototype.lastRequestedPosition = 0;

    function Scrolling(options) {
      if (options == null) {
        options = {};
      }
      this.events = __bind(this.events, this);
      this.frames = options.frames;
      this.skrollr = skrollr.init({
        emitEvents: true,
        horizontal: true,
        edgeStrategy: 'set',
        render: this.snap
      });
      this.arrowKeys();
      this.events();
      if (!this.skrollr.isMobile()) {
        this.throttleScrollEvents();
        this.monitorScroll();
      }
    }

    Scrolling.prototype.render = function(frameAspect, lastFramePosition) {
      this.frameAspect = frameAspect;
      this.applyTransitions(lastFramePosition);
      return this.skrollr.refresh();
    };

    Scrolling.prototype.events = function() {
      this.frames.on('skrollrBefore', function(e) {
        return e.target;
      });
      this.frames.on('skrollrBetween', function(e) {
        return e.target;
      });
      return this.frames.on('skrollrAfter', function(e) {
        return e.target;
      });
    };

    Scrolling.prototype.applyTransitions = function(lastFramePosition) {
      var _this = this;
      return this.frames.find('.frame').each(function(index, frameEl) {
        var frame, keyframes;
        frame = $(frameEl);
        keyframes = {
          "in": parseInt(frame.data('als-in-position')),
          out: parseInt(frame.data('als-out-position'))
        };
        if ((keyframes["in"] === lastFramePosition) || (keyframes.out === -1)) {
          keyframes.out = null;
        } else {
          keyframes.out || (keyframes.out = keyframes["in"]);
        }
        return _this.applyTransition(frame, keyframes, lastFramePosition);
      });
    };

    Scrolling.prototype.applyTransition = function(frame, options, lastFramePosition) {
      var A_LITTLE_MORE, direction, directions, frameScale, keypoint, keypoints, magnitude, offset, position, scale, styles, transition, translateBy, translateByPx, _ref, _results;
      if (options == null) {
        options = {};
      }
      A_LITTLE_MORE = 2;
      options = this.transitionOptions(frame, options);
      offset = frame.parent().hasClass('flow') ? this.frameAspect.left : 0;
      frameScale = alongslide.layout.framePartialWidth(frame);
      _ref = this.TRANSITIONS;
      _results = [];
      for (transition in _ref) {
        directions = _ref[transition];
        if (options[transition] != null) {
          _results.push((function() {
            var _i, _len, _results1;
            _results1 = [];
            for (_i = 0, _len = directions.length; _i < _len; _i++) {
              direction = directions[_i];
              keypoints = frameScale != null ? _.map([frameScale, 1.0], function(scale, index) {
                var magnitude, position;
                magnitude = direction * (parseInt(index) + 1);
                position = options[transition] + magnitude;
                if (!alongslide.layout.horizontalPanelAt(position)) {
                  scale = 1.0;
                }
                return [
                  {
                    magnitude: magnitude,
                    scale: scale * A_LITTLE_MORE
                  }, {
                    magnitude: magnitude * 0.99,
                    scale: scale
                  }
                ];
              }) : options.transition[transition] === "fade" && direction !== 0 ? [
                {
                  magnitude: direction * 0.99,
                  scale: 0.0
                }, {
                  magnitude: direction,
                  scale: 1.0
                }
              ] : [
                {
                  magnitude: direction,
                  scale: 1.0
                }
              ];
              _results1.push((function() {
                var _j, _len1, _ref1, _results2;
                _ref1 = _.flatten(keypoints);
                _results2 = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  keypoint = _ref1[_j];
                  magnitude = keypoint.magnitude, scale = keypoint.scale;
                  position = options[transition] + magnitude;
                  if (!(position > lastFramePosition)) {
                    styles = {};
                    translateBy = (offset - direction) * scale;
                    translateByPx = Math.round(translateBy * $(window).width());
                    styles["" + prefix.css + "transform"] = "translate(" + translateByPx + "px, 0) translateZ(0)";
                    styles.opacity = options.transition[transition] === "fade" ? 1.0 - Math.abs(direction) : 1.0;
                    _results2.push(frame.attr("data-" + (Math.round(position * 100)) + "p", (_.map(styles, function(value, key) {
                      return "" + key + ": " + value;
                    })).join("; ")));
                  } else {
                    _results2.push(void 0);
                  }
                }
                return _results2;
              })());
            }
            return _results1;
          })());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Scrolling.prototype.transitionOptions = function(frame, options) {
      var frameClass;
      if (options == null) {
        options = {};
      }
      frameClass = frame.get(0).className;
      options.transition = _.object(_.map(this.TRANSITIONS, function(directions, transition) {
        var effect, effectMatch;
        effectMatch = frameClass.match(new RegExp("(\\S+)-" + transition));
        effect = effectMatch ? effectMatch[1] : "slide";
        return [transition, effect];
      }));
      return options;
    };

    Scrolling.prototype.throttleScrollEvents = function() {
      var _this = this;
      return $(window).on('wheel mousewheel DOMMouseScroll MozMousePixelScroll', function(e) {
        var averageMagnitude, deltaX, deltaY;
        deltaX = e.originalEvent.deltaX || e.originalEvent.wheelDeltaX;
        deltaY = e.originalEvent.deltaY || e.originalEvent.wheelDeltaY;
        averageMagnitude = _this.updateWheelHistory(deltaX);
        if (_this.ignoreScroll) {
          if (averageMagnitude > _this.lastAverageMagnitude * _this.MAGNITUDE_THRESHOLD) {
            _this.ignoreScroll = false;
          } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault();
          }
        }
        return _this.lastAverageMagnitude = averageMagnitude;
      });
    };

    Scrolling.prototype.monitorScroll = function() {
      var zeroHistory,
        _this = this;
      zeroHistory = function() {
        return _this.lastAverageMagnitude = _this.updateWheelHistory(0);
      };
      _(this.NUM_WHEEL_HISTORY_EVENTS).times(function() {
        return zeroHistory();
      });
      return setInterval(zeroHistory, 5);
    };

    Scrolling.prototype.updateWheelHistory = function(delta) {
      var average, sum;
      this.wheelHistory.unshift(delta);
      while (this.wheelHistory.length > this.NUM_WHEEL_HISTORY_EVENTS) {
        this.wheelHistory.pop();
      }
      sum = _.reduce(this.wheelHistory, (function(memo, num) {
        return memo + num;
      }), 0);
      average = sum / this.wheelHistory.length;
      return Math.abs(average);
    };

    Scrolling.prototype.scrollToPosition = function(requestedPosition, options) {
      var deltaPosition, deltaRequestedPosition, duration, position, scrollTo, skrollr,
        _this = this;
      if (options == null) {
        options = {};
      }
      skrollr = this.skrollr || options.skrollr;
      clearTimeout(this.resetTimeout);
      deltaRequestedPosition = requestedPosition - this.lastRequestedPosition;
      deltaPosition = requestedPosition - this.currentPosition;
      position = deltaRequestedPosition > 0 ? deltaPosition > this.FLIP_THRESHOLD ? Math.ceil(requestedPosition) : void 0 : deltaRequestedPosition < 0 ? deltaPosition < -this.FLIP_THRESHOLD ? Math.floor(requestedPosition) : void 0 : void 0;
      if (position == null) {
        position = this.currentPosition;
      }
      position = Math.max(0, position);
      if (typeof alongslide !== "undefined" && alongslide !== null) {
        position = Math.min(position, typeof alongslide !== "undefined" && alongslide !== null ? alongslide.layout.lastFramePosition() : void 0);
      }
      if (position !== this.currentPosition) {
        scrollTo = position * $(window).width();
        duration = this.SLIDE_DURATION_MS;
        if (alongslide.layout.horizontalPanelAt(position) && alongslide.layout.horizontalPanelAt(this.currentPosition)) {
          duration /= 2;
        }
        this.currentPosition = position;
      } else if (requestedPosition !== this.currentPosition) {
        this.resetTimeout = setTimeout((function() {
          return _this.scrollToPosition(_this.currentPosition, {
            force: true
          });
        }), this.WAIT_BEFORE_RESET_MS);
      } else if (options.force) {
        if ((position * $(window).width()) !== skrollr.getScrollPosition()) {
          scrollTo = this.currentPosition * $(window).width();
          duration = this.FORCE_SLIDE_DURATION_MS;
        }
      }
      if (scrollTo != null) {
        if (!(skrollr.isMobile() || options.scrollMethod === "keys")) {
          this.ignoreScroll = true;
        }
        skrollr.animateTo(scrollTo, {
          duration: duration,
          easing: 'sqrt'
        });
      }
      return this.lastRequestedPosition = requestedPosition;
    };

    Scrolling.prototype.snap = function(info) {
      var requestedPosition, _ref;
      if (this.isAnimatingTo()) {
        return;
      }
      if (info.curTop > info.maxTop) {
        return;
      }
      requestedPosition = info.curTop / $(window).width();
      return (_ref = window.alongslide) != null ? _ref.scrolling.scrollToPosition(requestedPosition, {
        skrollr: this,
        force: this.isMobile()
      }) : void 0;
    };

    Scrolling.prototype.arrowKeys = function() {
      var _this = this;
      return $(document).keydown(function(event) {
        var propagate_event;
        switch (event.keyCode) {
          case 37:
            _this.scrollToPosition(_this.currentPosition - 1, {
              scrollMethod: "keys"
            });
            break;
          case 39:
            _this.scrollToPosition(_this.currentPosition + 1, {
              scrollMethod: "keys"
            });
            break;
          default:
            propagate_event = true;
        }
        return propagate_event != null;
      });
    };

    return Scrolling;

  })();

}).call(this);
