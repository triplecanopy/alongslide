(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Alongslide.prototype.Scrolling = (function() {
    Scrolling.prototype.TRANSITIONS = {
      "in": [-1, 0],
      out: [0, 1]
    };

    Scrolling.prototype.FLIP_THRESHOLD = 0.04;

    Scrolling.prototype.WAIT_BEFORE_RESET_MS = 250;

    Scrolling.prototype.SLIDE_DURATION_MS = 250;

    Scrolling.prototype.FORCE_SLIDE_DURATION_MS = 100;

    Scrolling.prototype.NUM_WHEEL_HISTORY_EVENTS = 10;

    Scrolling.prototype.MAGNITUDE_THRESHOLD = 2.2;

    Scrolling.prototype.currentPosition = 0;

    Scrolling.prototype.indexedTransitions = {};

    Scrolling.prototype.wheelHistory = [];

    Scrolling.prototype.lastAverageMagnitude = 0;

    Scrolling.prototype.ignoreScroll = false;

    Scrolling.prototype.lastRequestedPosition = 0;

    Scrolling.prototype.mouseDown = false;

    function Scrolling(options) {
      if (options == null) {
        options = {};
      }
      this.scrollToPosition = __bind(this.scrollToPosition, this);
      this.events = __bind(this.events, this);
      this.frames = options.frames;
      this.skrollr = skrollr.init({
        emitEvents: true,
        horizontal: true,
        edgeStrategy: 'set',
        render: this.snap,
        easing: {
          easeInOutQuad: function(p) {
            if (p < 0.5) {
              return Math.pow(p * 2, 1.5) / 2;
            } else {
              return 1 - Math.pow(p * -2 + 2, 1.5) / 2;
            }
          },
          easeOutQuad: function(p) {
            return 1 - Math.pow(1 - p, 2);
          }
        }
      });
      this.arrowKeys();
      this.events();
      if (!this.skrollr.isMobile()) {
        this.throttleScrollEvents();
        this.monitorScroll();
        this.monitorMouse();
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
      this.indexedTransitions = {};
      this.frames.find('.frame').each((function(_this) {
        return function(index, frameEl) {
          var frame, keyframes, _base, _base1, _name, _name1;
          frame = $(frameEl);
          keyframes = {
            "in": parseInt(frame.data(alongslide.layout.IN_POINT_KEY)),
            out: parseInt(frame.data(alongslide.layout.OUT_POINT_KEY))
          };
          if ((keyframes["in"] === lastFramePosition) || (keyframes.out === -1)) {
            keyframes.out = null;
          } else {
            keyframes.out || (keyframes.out = keyframes["in"]);
          }
          if ((_base = _this.indexedTransitions)[_name = keyframes["in"]] == null) {
            _base[_name] = {
              "in": [],
              out: []
            };
          }
          _this.indexedTransitions[keyframes["in"]]["in"].push(frame);
          if (keyframes.out != null) {
            if ((_base1 = _this.indexedTransitions)[_name1 = keyframes.out] == null) {
              _base1[_name1] = {
                "in": [],
                out: []
              };
            }
            _this.indexedTransitions[keyframes.out].out.push(frame);
          }
          return _this.applyTransition(frame, _(keyframes).extend({
            lastFramePosition: lastFramePosition
          }));
        };
      })(this));
      if (this.skrollr.isMobile()) {
        return _.each([0, 1], (function(_this) {
          return function(position) {
            return _.each(_this.indexedTransitions[position]["in"], function(frame) {
              return frame.removeClass('unstaged');
            });
          };
        })(this));
      } else {
        return this.frames.find('.frame').each((function(_this) {
          return function(index, frameEl) {
            return $(frameEl).removeClass('unstaged');
          };
        })(this));
      }
    };

    Scrolling.prototype.applyTransition = function(frame, options) {
      var A_LITTLE_MORE, direction, directions, frameScale, keypoint, keypoints, magnitude, offset, oppositeEdge, panelAlignment, position, scale, styles, transition, translateBy, translateByPx, _ref, _results;
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
              if (Math.abs(direction) > 0) {
                if (frame.parent().hasClass('panels')) {
                  panelAlignment = alongslide.layout.panelAlignment(frame);
                  if (_(alongslide.layout.HORIZONTAL_EDGES).contains(panelAlignment)) {
                    oppositeEdge = frame.hasClass('left') ? 'right' : frame.hasClass('right') ? 'left' : void 0;
                    if (alongslide.layout.horizontalPanelAt(options[transition], oppositeEdge) && alongslide.layout.horizontalPanelAt(options[transition] + direction, oppositeEdge)) {
                      frameScale = 0.495;
                    }
                  }
                }
              }
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
                  if (!(position > options.lastFramePosition)) {
                    styles = {};
                    translateBy = (offset - direction) * scale;
                    translateByPx = Math.round(translateBy * Math.max($(window).width(), alongslide.layout.FRAME_WIDTH));
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
      return $(window).on('wheel mousewheel DOMMouseScroll MozMousePixelScroll', (function(_this) {
        return function(e) {
          var averageMagnitude, deltaX, deltaY;
          deltaX = e.originalEvent.deltaX || e.originalEvent.wheelDeltaX || 0;
          deltaY = e.originalEvent.deltaY || e.originalEvent.wheelDeltaY || 0;
          averageMagnitude = _this.updateWheelHistory(deltaX);
          if (_this.ignoreScroll) {
            if (averageMagnitude > _this.lastAverageMagnitude * _this.MAGNITUDE_THRESHOLD) {
              _this.ignoreScroll = false;
            } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
              e.preventDefault();
            }
          }
          return _this.lastAverageMagnitude = averageMagnitude;
        };
      })(this));
    };

    Scrolling.prototype.monitorScroll = function() {
      var zeroHistory;
      zeroHistory = (function(_this) {
        return function() {
          return _this.lastAverageMagnitude = _this.updateWheelHistory(0);
        };
      })(this);
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

    Scrolling.prototype.monitorMouse = function() {
      $(document).mousedown((function(_this) {
        return function() {
          return _this.mouseDown = true;
        };
      })(this));
      return $(document).mouseup((function(_this) {
        return function() {
          var requestedPosition, _ref;
          _this.mouseDown = false;
          requestedPosition = $(window).scrollLeft() / $(window).width();
          return (_ref = window.alongslide) != null ? _ref.scrolling.scrollToPosition(requestedPosition) : void 0;
        };
      })(this));
    };

    Scrolling.prototype.scrollToPosition = function(requestedPosition, options) {
      var deltaPosition, deltaRequestedPosition, duration, position, scrollTo, skrollr;
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
        scrollTo = position;
        duration = this.SLIDE_DURATION_MS;
        if (alongslide.layout.horizontalPanelAt(position) && alongslide.layout.horizontalPanelAt(this.currentPosition)) {
          duration /= 2;
        }
      } else if (requestedPosition !== this.currentPosition) {
        this.resetTimeout = setTimeout(((function(_this) {
          return function() {
            return _this.scrollToPosition(_this.currentPosition, {
              force: true
            });
          };
        })(this)), this.WAIT_BEFORE_RESET_MS);
      } else if (options.force) {
        if ((position * $(window).width()) !== skrollr.getScrollPosition()) {
          scrollTo = this.currentPosition;
          duration = this.FORCE_SLIDE_DURATION_MS;
        }
      }
      if (scrollTo != null) {
        this.doScroll(scrollTo, skrollr, duration, options);
      }
      return this.lastRequestedPosition = requestedPosition;
    };

    Scrolling.prototype.doScroll = function(scrollTo, skrollr, duration, options) {
      var scrollDelta;
      scrollDelta = scrollTo - this.currentPosition;
      this.currentPosition = scrollTo;
      if (!(skrollr.isMobile() || options.scrollMethod === "keys")) {
        this.ignoreScroll = true;
      }
      skrollr.animateTo(scrollTo * $(window).width(), {
        duration: duration,
        easing: 'easeOutQuad',
        done: function(skrollr) {}
      });
      if (this.skrollr.isMobile()) {
        return setTimeout(((function(_this) {
          return function() {
            var stagePosition, stageTransition, unstagePosition, unstageTransition, _ref, _ref1;
            if (Math.abs(scrollDelta) > 0) {
              stagePosition = scrollTo + scrollDelta;
              stageTransition = scrollDelta > 0 ? 'in' : 'out';
              _.each((_ref = _this.indexedTransitions[stagePosition]) != null ? _ref[stageTransition] : void 0, function(frame) {
                frame.removeClass('unstaged').hide();
                return setTimeout((function() {
                  return frame.show();
                }), 0);
              });
              unstagePosition = _this.currentPosition - 2 * scrollDelta;
              unstageTransition = scrollDelta > 0 ? 'out' : 'in';
              return _.each((_ref1 = _this.indexedTransitions[unstagePosition]) != null ? _ref1[unstageTransition] : void 0, function(frame) {
                return frame.addClass('unstaged');
              });
            }
          };
        })(this)), duration);
      }
    };

    Scrolling.prototype.snap = function(info) {
      var requestedPosition, _ref, _ref1;
      if (this.isAnimatingTo()) {
        return;
      }
      if (info.curTop > info.maxTop) {
        return;
      }
      if ((_ref = window.alongslide) != null ? _ref.scrolling.mouseDown : void 0) {
        return;
      }
      requestedPosition = info.curTop / $(window).width();
      return (_ref1 = window.alongslide) != null ? _ref1.scrolling.scrollToPosition(requestedPosition, {
        skrollr: this
      }) : void 0;
    };

    Scrolling.prototype.arrowKeys = function() {
      return $(document).keydown((function(_this) {
        return function(event) {
          var propagate_event;
          if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
            return true;
          } else {
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
          }
        };
      })(this));
    };

    return Scrolling;

  })();

}).call(this);
