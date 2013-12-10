(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Alongslide.prototype.Layout = (function() {
    Layout.prototype.WITH_HORIZONTAL_PANEL_CLASSES = ['with-panel-pinned-left', 'with-panel-pinned-right'];

    Layout.prototype.HORIZONTAL_EDGES = ["left", "right"];

    Layout.prototype.VERTICAL_EDGES = ["top", "bottom"];

    Layout.prototype.EDGES = Layout.prototype.HORIZONTAL_EDGES.concat(Layout.prototype.VERTICAL_EDGES);

    Layout.prototype.SIZES = ["one-third", "half", "two-thirds"];

    Layout.prototype.ALIGNMENTS = Layout.prototype.EDGES.concat('fullscreen');

    Layout.prototype.IN_POINT_KEY = 'als-in-position';

    Layout.prototype.OUT_POINT_KEY = 'als-out-position';

    Layout.prototype.frameWidth = $(window).width();

    Layout.prototype.defaultNumFrameColumns = 2;

    Layout.prototype.debug = false;

    Layout.prototype.SUPER_FRAME_LEVEL = 1;

    Layout.prototype.FRAME_LEVEL = 2;

    Layout.prototype.SUB_FRAME_LEVEL = 3;

    function Layout(options) {
      if (options == null) {
        options = {};
      }
      this.layout = __bind(this.layout, this);
      this.frames = options.frames, this.flowNames = options.flowNames, this.backgrounds = options.backgrounds, this.panels = options.panels, this.regionCls = options.regionCls, this.sourceLength = options.sourceLength;
    }

    Layout.prototype.render = function(postRenderCallback) {
      this.postRenderCallback = postRenderCallback;
      this.reset();
      this.writeBackgrounds();
      return this.layout();
    };

    Layout.prototype.layout = function() {
      this.startTime = new Date;
      this.log("Beginning layout");
      this.currentFlowIndex = 0;
      return this.renderSection();
    };

    Layout.prototype.renderSection = function() {
      var background, flowName;
      flowName = this.flowNames[this.currentFlowIndex];
      this.log("Laying out section \"" + flowName + "\"", this.SUPER_FRAME_LEVEL);
      background = this.findBackground(flowName);
      if (background.length) {
        this.setPositionOf(background, {
          to: this.nextFramePosition()
        });
      }
      return this.renderFrame(flowName);
    };

    Layout.prototype.renderFrame = function(flowName, frame, lastColumn) {
      var background, column, hasThreeColumns,
        _this = this;
      frame = this.findOrBuildNextFlowFrame(frame);
      while (frame.find('.' + this.regionCls).length < this.numFrameColumns(frame)) {
        column = this.buildRegion(frame, flowName);
        hasThreeColumns = (column.children('.three-columns').length);
        if (hasThreeColumns) {
          column.find('.section').removeClass('three-columns');
          column.parent().addClass('three-columns');
        }
        if (lastColumn != null) {
          this.checkForOrphans(lastColumn);
          this.updateProgress(lastColumn);
          this.checkForDirectives(lastColumn);
        }
        if (this.flowComplete(flowName)) {
          this.updateProgress(column);
          this.checkForDirectives(column, true);
          this.checkForEmpties(column);
          this.currentFlowIndex++;
          if (this.currentFlowIndex !== this.flowNames.length) {
            background = this.findBackground(flowName);
            if (background.length) {
              this.setPositionOf(background, {
                until: this.lastFramePosition()
              });
            }
            setTimeout((function() {
              return _this.renderSection();
            }), 1);
          } else {
            this.log("Layout complete");
            this.index();
            this.postRenderCallback(this.lastFramePosition());
          }
          return;
        }
        lastColumn = column;
      }
      return setTimeout((function() {
        return _this.renderFrame(flowName, frame, lastColumn);
      }), 1);
    };

    Layout.prototype.checkForDirectives = function(column, layoutComplete) {
      var _this = this;
      return (column.find(".alongslide")).each(function(index, directiveElement) {
        var directive, flowFrame, framesWithPinnedPanels, id, nextFlowFrame, nextFlowFramePosition, panelFrame, panelPosition, postPanelFlowFrame;
        directive = $(directiveElement).detach();
        id = directive.data('alongslide-id');
        flowFrame = column.parent('.frame');
        switch (false) {
          case !directive.hasClass("show"):
            if (!layoutComplete) {
              nextFlowFrame = _this.findOrBuildNextFlowFrame(flowFrame);
            }
            nextFlowFramePosition = nextFlowFrame ? _this.getPositionOf(nextFlowFrame) : _this.nextFramePosition();
            panelPosition = directive.hasClass("now") ? _this.getPositionOf(flowFrame) : nextFlowFramePosition;
            panelFrame = _this.buildPanel(id, panelPosition);
            _this.updateProgress(panelFrame);
            switch (false) {
              case !directive.hasClass("pin"):
                _this.setPositionOf(panelFrame, {
                  until: -1
                });
                framesWithPinnedPanels = _.compact([directive.hasClass("now") ? flowFrame : void 0, nextFlowFrame]);
                _.each(framesWithPinnedPanels, function(frame) {
                  var pushToFrame, _results;
                  _this.log("Applying with-pinned-panel styles to flow frame at " + ("" + (_this.getPositionOf(frame))), _this.SUB_FRAME_LEVEL);
                  frame.addClass(_this.withPinnedClass(directive));
                  frame.addClass(_this.withSizedClass(directive));
                  _results = [];
                  while (frame.find('.' + _this.regionCls).length > _this.numFrameColumns(frame)) {
                    pushToFrame = _this.findOrBuildNextFlowFrame(frame);
                    _this.log(("Pushing last column of flow frame at " + (_this.getPositionOf(frame)) + " ") + ("to flow frame at " + (_this.getPositionOf(pushToFrame))), _this.SUB_FRAME_LEVEL);
                    _results.push(frame.find('.' + _this.regionCls).last().detach().prependTo(pushToFrame));
                  }
                  return _results;
                });
                if (directive.hasClass("now")) {
                  return document.namedFlows.get(flowFrame.data('als-section-id')).reFlow();
                }
                break;
              case !directive.hasClass("fullscreen"):
                if (directive.hasClass("now")) {
                  _this.setPositionOf(flowFrame, {
                    to: nextFlowFramePosition
                  });
                }
                if (nextFlowFrame != null) {
                  return _this.setPositionOf(nextFlowFrame, {
                    to: nextFlowFramePosition + 1
                  });
                }
            }
            break;
          case !directive.hasClass("unpin"):
            panelFrame = _this.findPanel(id);
            if (panelFrame.length !== 0) {
              _this.setPositionOf(panelFrame, {
                until: layoutComplete ? _this.nextFramePosition() - 1 : Math.max(_this.getPositionOf(flowFrame), _this.getPositionOf(panelFrame))
              });
              if (!layoutComplete) {
                postPanelFlowFrame = _this.findOrBuildNextFlowFrame(flowFrame);
                if (_this.getPositionOf(postPanelFlowFrame) === _this.getPositionOf(panelFrame)) {
                  postPanelFlowFrame = _this.findOrBuildNextFlowFrame(postPanelFlowFrame);
                }
                postPanelFlowFrame.removeClass(_this.withPinnedClass(panelFrame));
                return postPanelFlowFrame.removeClass(_this.withSizedClass(panelFrame));
              }
            }
        }
      });
    };

    Layout.prototype.checkForEmpties = function(column) {
      var columnClone, columnFrame,
        _this = this;
      columnClone = column.clone();
      columnClone.find(".alongslide").detach();
      if (this.isEmpty(columnClone)) {
        columnFrame = column.parent('.frame');
        this.log("Removing empty column from flow frame at " + ("" + (this.getPositionOf(columnFrame))), this.SUB_FRAME_LEVEL);
        column.detach();
        document.namedFlows.get(columnFrame.data('als-section-id')).resetRegions();
        if (this.isEmpty(columnFrame)) {
          this.destroyFlowFrame(columnFrame);
        }
      }
      return this.frames.children('.flow').find('.frame:empty').each(function(index, frame) {
        return _this.destroyFlowFrame($(frame));
      });
    };

    Layout.prototype.checkForOrphans = function(column) {
      return column.find(':last:header').detach().prependTo($('.' + this.regionCls + ':last'));
    };

    Layout.prototype.findOrBuildNextFlowFrame = function(lastFrame) {
      var nextFlowFrame;
      nextFlowFrame = (lastFrame != null ? lastFrame.length : void 0) ? lastFrame.next('.frame') : void 0;
      if (!(nextFlowFrame != null ? nextFlowFrame.length : void 0)) {
        nextFlowFrame = this.buildFlowFrame(lastFrame);
      }
      return nextFlowFrame;
    };

    Layout.prototype.buildFlowFrame = function(lastFrame) {
      var frame, position;
      position = (lastFrame != null ? lastFrame.length : void 0) ? this.getPositionOf(lastFrame) + 1 : this.nextFramePosition();
      this.log("Building flow frame at " + position, this.FRAME_LEVEL);
      frame = (lastFrame != null ? lastFrame.length : void 0) ? lastFrame != null ? lastFrame.clone().empty() : void 0 : $('<div class="frame"/>');
      frame.appendTo(this.frames.children('.flow'));
      return this.setPositionOf(frame, {
        to: position
      });
    };

    Layout.prototype.destroyFlowFrame = function(frame) {
      this.log("Destroying flow frame at " + (this.getPositionOf(frame)), this.FRAME_LEVEL);
      return frame.detach();
    };

    Layout.prototype.buildRegion = function(frame, flowName) {
      var region;
      this.log("Building column in flow frame at " + (this.getPositionOf(frame)), this.SUB_FRAME_LEVEL);
      region = $('<div/>').addClass(this.regionCls);
      frame.data('als-section-id', flowName);
      region.appendTo(frame);
      document.namedFlows.get(flowName).addRegion(region.get(0));
      return region;
    };

    Layout.prototype.buildPanel = function(id, position) {
      var alignment, panel;
      panel = this.panels[id].clone().show();
      alignment = _.filter(this.ALIGNMENTS, function(alignment) {
        return panel.hasClass(alignment);
      });
      this.log("Building " + alignment + " panel frame \"" + id + "\" at position " + position, this.FRAME_LEVEL);
      panel.addClass('frame');
      panel.appendTo(this.frames.children('.panels'));
      this.setPositionOf(panel, {
        to: position
      });
      return panel;
    };

    Layout.prototype.reset = function() {
      this.laidOutLength = 0;
      this.frames.find('.backgrounds').empty();
      this.frames.find('.flow').empty();
      this.frames.find('.panels').empty();
      return _.each(document.namedFlows.namedFlows, function(flow) {
        return flow.resetRegions();
      });
    };

    Layout.prototype.writeBackgrounds = function() {
      var background, _i, _len, _ref, _results;
      _ref = this.backgrounds;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        background = _ref[_i];
        _results.push(this.frames.find('.backgrounds').append(background.clone()));
      }
      return _results;
    };

    Layout.prototype.setPositionOf = function(frame, options) {
      var currentFramePosition, frameType;
      if (options == null) {
        options = {};
      }
      frameType = frame.parent().get(0).className;
      if (options.to != null) {
        if ((currentFramePosition = this.getPositionOf(frame)) != null) {
          this.log(("Moving " + frameType + " frame at " + currentFramePosition + " to ") + ("" + options.to), this.SUB_FRAME_LEVEL);
        }
        frame.data(this.IN_POINT_KEY, options.to);
      }
      if (options.until != null) {
        this.log(("Dismissing " + frameType + " frame \"" + (frame.data('alongslide-id')) + "\" ") + ("at " + options.until), this.SUB_FRAME_LEVEL);
        frame.data(this.OUT_POINT_KEY, options.until);
      }
      return frame;
    };

    Layout.prototype.getPositionOf = function(frame) {
      return frame.data(this.IN_POINT_KEY);
    };

    Layout.prototype.nextFramePosition = function() {
      var framePosition;
      framePosition = this.lastFramePosition();
      if (framePosition != null) {
        return framePosition + 1;
      } else {
        return 0;
      }
    };

    Layout.prototype.lastFramePosition = function() {
      var allFramePositions, flowsAndPanels,
        _this = this;
      flowsAndPanels = this.frames.children('.flow, .panels').find('.frame');
      allFramePositions = _(flowsAndPanels).map(function(frame) {
        return _this.getPositionOf($(frame));
      });
      if (allFramePositions.length) {
        return Math.max.apply(Math, allFramePositions);
      }
    };

    Layout.prototype.numFrameColumns = function(frame) {
      if (frame.hasClass('three-columns')) {
        return 3;
      } else if (this.isWithHorizontalPanel(frame)) {
        return 1;
      } else {
        return this.defaultNumFrameColumns;
      }
    };

    Layout.prototype.index = function() {
      var _this = this;
      this.panelIndex = {};
      return this.frames.children('.panels').find('.panel.frame').each(function(index, panel) {
        var outPosition, position, _base, _i, _ref, _results;
        outPosition = $(panel).data(_this.OUT_POINT_KEY) || $(panel).data(_this.IN_POINT_KEY);
        if (outPosition === -1) {
          outPosition = _this.lastFramePosition();
        }
        _results = [];
        for (position = _i = _ref = $(panel).data(_this.IN_POINT_KEY); _ref <= outPosition ? _i <= outPosition : _i >= outPosition; position = _ref <= outPosition ? ++_i : --_i) {
          if ((_base = _this.panelIndex)[position] == null) {
            _base[position] = [];
          }
          _results.push(_this.panelIndex[position].push(panel));
        }
        return _results;
      });
    };

    Layout.prototype.isWithHorizontalPanel = function(frame) {
      var cssClass, _i, _len, _ref;
      _ref = this.WITH_HORIZONTAL_PANEL_CLASSES;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cssClass = _ref[_i];
        if (frame.hasClass(cssClass)) {
          return true;
        }
      }
    };

    Layout.prototype.findBackground = function(flowName) {
      return this.frames.children('.backgrounds').find(".background.frame[data-alongslide-id=" + flowName + "]");
    };

    Layout.prototype.findPanel = function(id) {
      return this.frames.children('.panels').find(".panel.frame[data-alongslide-id=" + id + "]");
    };

    Layout.prototype.horizontalPanelAt = function(position) {
      var edge, panel, _i, _len, _ref;
      _ref = this.panelIndex[position] || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        panel = _ref[_i];
        edge = _.first(_.filter(this.HORIZONTAL_EDGES, function(edge) {
          return $(panel).hasClass(edge);
        }));
        return edge != null;
      }
      return false;
    };

    Layout.prototype.withPinnedClass = function(directive) {
      var edge;
      edge = _.first(_.filter(this.EDGES, function(edge) {
        return directive.hasClass(edge);
      }));
      return "with-panel-pinned-" + edge;
    };

    Layout.prototype.withSizedClass = function(directive) {
      var size;
      size = _.first(_.filter(this.SIZES, function(size) {
        return directive.hasClass(size);
      }));
      if (size == null) {
        size = "half";
      }
      return "with-panel-sized-" + size;
    };

    Layout.prototype.framePartialWidth = function(frame) {
      var $column, leftMargin, rightMargin;
      if (this.isWithHorizontalPanel(frame)) {
        $column = frame.find('.' + this.regionCls);
        leftMargin = $column.position().left;
        rightMargin = frame.width() - $column.width() - leftMargin;
        return (Math.min(leftMargin, rightMargin) * 2 + $column.width()) / frame.width();
      }
    };

    Layout.prototype.panelAlignment = function(directive) {
      return _.first(_.filter(this.ALIGNMENTS, function(alignment) {
        return directive.hasClass(alignment);
      }));
    };

    Layout.prototype.flowComplete = function(flowName) {
      return !document.namedFlows.get(flowName).overset;
    };

    Layout.prototype.isEmpty = function(el) {
      return $.trim(el.children().html()) === '';
    };

    Layout.prototype.updateProgress = function(newElement) {
      this.laidOutLength += newElement.text().length;
      return $(document).triggerHandler('alongslide.progress', this.laidOutLength / this.sourceLength);
    };

    Layout.prototype.log = function(message, indentLevel) {
      var indent;
      if (indentLevel == null) {
        indentLevel = 0;
      }
      indent = (_(indentLevel).times(function() {
        return ". ";
      })).join('');
      if ((typeof console !== "undefined" && console !== null) && this.debug) {
        return console.log("" + indent + message + " (elapsed: " + ((new Date - this.startTime).valueOf()) + "ms)");
      }
    };

    return Layout;

  })();

}).call(this);
