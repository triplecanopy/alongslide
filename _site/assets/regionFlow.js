(function() {
  var RegionFlow;

  RegionFlow = (function() {
    function RegionFlow() {}

    RegionFlow.prototype.lazyMode = true;

    RegionFlow.prototype.init = function() {
      return document.namedFlows = new this.NamedFlowMap;
    };

    return RegionFlow;

  })();

  RegionFlow.prototype.NamedFlowMap = (function() {
    function NamedFlowMap() {}

    NamedFlowMap.prototype.namedFlows = {};

    NamedFlowMap.prototype.build = function(flowName) {
      return this.namedFlows[flowName] = new RegionFlow.prototype.NamedFlow(flowName);
    };

    NamedFlowMap.prototype.get = function(flowName) {
      return this.namedFlows[flowName] || this.build(flowName);
    };

    NamedFlowMap.prototype.has = function(flowName) {
      return this.namedFlows[flowName] != null;
    };

    NamedFlowMap.prototype.set = function(flowName, flowValue) {
      return this.namedFlows[flowName] = flowValue;
    };

    NamedFlowMap.prototype["delete"] = function(flowName) {
      return delete this.namedFlows[flowName];
    };

    return NamedFlowMap;

  })();

  RegionFlow.prototype.NamedFlow = (function() {
    function NamedFlow(name) {
      this.name = name;
      this.contentNodes = [];
      this.overset = false;
      this.resetRegions();
    }

    NamedFlow.prototype.resetRegions = function() {
      this.regions = [];
      this.firstEmptyRegionIndex = -1;
      if (!RegionFlow.prototype.lazyMode) {
        return this.updateOverset();
      }
    };

    NamedFlow.prototype.getRegions = function() {
      return this.regions;
    };

    NamedFlow.prototype.addRegion = function(regionNode) {
      this.regions.push(new RegionFlow.prototype.Region(regionNode));
      this.firstEmptyRegionIndex = this.regions.length - 1;
      return this.doFlow();
    };

    NamedFlow.prototype.getContent = function() {
      return this.contentNodes;
    };

    NamedFlow.prototype.addContent = function(contentNode) {
      this.contentNodes.push($(contentNode));
      return this.doFlow();
    };

    NamedFlow.prototype.reFlow = function() {
      var node, _i, _len, _ref, _results;
      _ref = _.pluck(this.regions, 'node');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        node.empty();
      }
      this.firstEmptyRegionIndex = 0;
      _results = [];
      while (true) {
        this.doFlow();
        if (this.firstEmptyRegionIndex === this.regions.length - 1) {
          break;
        }
        _results.push(this.firstEmptyRegionIndex++);
      }
      return _results;
    };

    NamedFlow.prototype.doFlow = function() {
      var nodes;
      if (this.firstEmptyRegionIndex === 0) {
        this.populateRegions();
      } else if (this.firstEmptyRegionIndex > 0) {
        nodes = $(this.oversetRegion().node).contents().remove();
        this.lastRegion().appendNode(nodes);
        this.breakUp({
          nodes: nodes
        });
      }
      if (!RegionFlow.prototype.lazyMode) {
        return this.updateOverset();
      }
    };

    NamedFlow.prototype.populateRegions = function() {
      var node, _i, _len, _ref, _results;
      _ref = this.contentNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        _results.push(this.lastRegion().appendNode(node.clone()));
      }
      return _results;
    };

    NamedFlow.prototype.breakUp = function(options) {
      var nodes, targetNode;
      if (options == null) {
        options = {};
      }
      nodes = options.nodes || $(options.node).contents();
      targetNode = options.into || this.oversetRegion().node;
      if (options.node != null) {
        targetNode = $(options.node).clone().empty().appendTo(targetNode).get(0);
      }
      return nodes.each((function(_this) {
        return function(index, childNode) {
          var formerParent;
          if ($(childNode).hasClass('break-before-always') && !$(targetNode).empty()) {
            return false;
          }
          formerParent = $(childNode).parent();
          $(childNode).remove().appendTo(targetNode);
          if (_this.oversetRegion().updateOverset() === 'overset') {
            $(childNode).remove().prependTo(formerParent);
            if (childNode.nodeType === Node.TEXT_NODE) {
              _this.breakUpText({
                node: childNode,
                into: targetNode
              });
            } else {
              _this.breakUp({
                node: childNode,
                into: targetNode
              });
            }
            return false;
          } else if ($(childNode).hasClass('break-after-always')) {
            return false;
          }
        };
      })(this));
    };

    NamedFlow.prototype.breakUpText = function(options) {
      var highIndex, lowIndex, targetNode, textNode, tryIndex, words;
      if (options == null) {
        options = {};
      }
      textNode = options.node;
      targetNode = document.createTextNode("");
      $(targetNode).appendTo(options.into);
      words = textNode.nodeValue.split(/[ ]+/);
      highIndex = words.length - 1;
      lowIndex = 0;
      tryIndex = highIndex;
      while (true) {
        targetNode.textContent = words.slice(0, +tryIndex + 1 || 9e9).join(" ");
        if (this.oversetRegion().updateOverset() === 'overset') {
          highIndex = tryIndex;
        } else {
          lowIndex = tryIndex;
        }
        tryIndex = Math.floor(lowIndex + (highIndex - lowIndex) / 2);
        if (highIndex - lowIndex <= 1) {
          break;
        }
      }
      if (tryIndex === 0) {
        $(targetNode).remove();
      } else {
        targetNode.textContent = words.slice(0, +tryIndex + 1 || 9e9).join(" ");
        textNode.nodeValue = words.slice(tryIndex + 1, +(words.length - 1) + 1 || 9e9).join(" ");
        $(textNode).parent().addClass("region-flow-post-text-break");
      }
      if (!RegionFlow.prototype.lazyMode) {
        return this.oversetRegion().updateOverset();
      }
    };

    NamedFlow.prototype.updateOverset = function() {
      var _ref;
      return this.overset = ((_ref = this.regions[this.firstEmptyRegionIndex]) != null ? _ref.updateOverset() : void 0) === 'overset';
    };

    NamedFlow.prototype.oversetRegion = function() {
      return this.regions[this.firstEmptyRegionIndex - 1];
    };

    NamedFlow.prototype.lastRegion = function() {
      return this.regions[this.firstEmptyRegionIndex];
    };

    return NamedFlow;

  })();

  RegionFlow.prototype.Region = (function() {
    function Region(node) {
      this.node = $(node);
      if (!RegionFlow.prototype.lazyMode) {
        this.updateOverset();
      }
    }

    Region.prototype.appendNode = function(contentNode) {
      $(this.node).append(contentNode);
      if (!RegionFlow.prototype.lazyMode) {
        return this.updateOverset();
      }
    };

    Region.prototype.updateOverset = function() {
      var containsUnrespectedBreak, isOverset, node;
      node = this.node.get(0);
      isOverset = node.scrollHeight > node.clientHeight;
      containsUnrespectedBreak = false;
      this.node.find('.break-before-always').each(function() {
        if ($(this).prev().length !== 0) {
          containsUnrespectedBreak = true;
        }
      });
      this.node.find('.break-after-always').each(function() {
        if ($(this).next().length !== 0) {
          containsUnrespectedBreak = true;
        }
      });
      return this.regionOverset = this.node.is(':empty') ? 'empty' : isOverset || containsUnrespectedBreak ? 'overset' : 'fit';
    };

    return Region;

  })();

  window.RegionFlow = RegionFlow;

}).call(this);
