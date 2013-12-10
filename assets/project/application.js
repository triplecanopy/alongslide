(function() {
  var RegionFlow;

  RegionFlow = (function() {
    function RegionFlow() {}

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
      return this.updateOverset();
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
      return this.updateOverset();
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
      var nodes, targetNode,
        _this = this;
      if (options == null) {
        options = {};
      }
      nodes = options.nodes || $(options.node).contents();
      targetNode = options.into || this.oversetRegion().node;
      if (options.node != null) {
        targetNode = $(options.node).clone().empty().appendTo(targetNode).get(0);
      }
      return nodes.each(function(index, childNode) {
        var formerParent;
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
        }
      });
    };

    NamedFlow.prototype.breakUpText = function(options) {
      var breakIndex, targetNode, textNode, tryIndex, words, _i, _ref, _ref1;
      if (options == null) {
        options = {};
      }
      textNode = options.node;
      targetNode = document.createTextNode("");
      $(targetNode).appendTo(options.into);
      words = textNode.nodeValue.split(/[ ]+/);
      breakIndex = words.length - 1;
      while (true) {
        targetNode.textContent = words.slice(0, +breakIndex + 1 || 9e9).join(" ");
        if (this.oversetRegion().updateOverset() === 'overset') {
          if (breakIndex === 0) {
            breakIndex = -1;
            break;
          } else {
            breakIndex = Math.floor(breakIndex / 2);
          }
        } else {
          for (tryIndex = _i = _ref = breakIndex + 1, _ref1 = words.length - 1; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; tryIndex = _ref <= _ref1 ? ++_i : --_i) {
            targetNode.textContent += " " + words[tryIndex];
            if (this.oversetRegion().updateOverset() === 'overset') {
              breakIndex = tryIndex - 1;
              break;
            }
          }
          break;
        }
      }
      if (breakIndex === -1) {
        $(targetNode).remove();
      } else {
        targetNode.textContent = words.slice(0, +breakIndex + 1 || 9e9).join(" ");
        textNode.nodeValue = words.slice(breakIndex + 1, +(words.length - 1) + 1 || 9e9).join(" ");
        $(textNode).parent().addClass("region-flow-post-text-break");
      }
      return this.oversetRegion().updateOverset();
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
      this.updateOverset();
    }

    Region.prototype.appendNode = function(contentNode) {
      $(this.node).append(contentNode);
      return this.updateOverset();
    };

    Region.prototype.updateOverset = function() {
      var isOverset, node;
      node = this.node.get(0);
      isOverset = node.scrollHeight > node.clientHeight;
      return this.regionOverset = this.node.is(':empty') ? 'empty' : isOverset ? 'overset' : 'fit';
    };

    return Region;

  })();

  window.RegionFlow = RegionFlow;

}).call(this);
/*!
 * skrollr core
 *
 * Alexander Prinzhorn - https://github.com/Prinzhorn/skrollr
 *
 * Free to use under terms of MIT license
 */

(function(window, document, undefined) {
	'use strict';

	/*
	 * Global api.
	 */
	var skrollr = window.skrollr = {
		get: function() {
			return _instance;
		},
		//Main entry point.
		init: function(options) {
			return _instance || new Skrollr(options);
		},
		VERSION: '0.6.13'
	};

	//Minify optimization.
	var hasProp = Object.prototype.hasOwnProperty;
	var Math = window.Math;
	var getStyle = window.getComputedStyle;

	//They will be filled when skrollr gets initialized.
	var documentElement;
	var body;

	var EVENT_TOUCHSTART = 'touchstart';
	var EVENT_TOUCHMOVE = 'touchmove';
	var EVENT_TOUCHCANCEL = 'touchcancel';
	var EVENT_TOUCHEND = 'touchend';

	var SKROLLABLE_CLASS = 'skrollable';
	var SKROLLABLE_BEFORE_CLASS = SKROLLABLE_CLASS + '-before';
	var SKROLLABLE_BETWEEN_CLASS = SKROLLABLE_CLASS + '-between';
	var SKROLLABLE_AFTER_CLASS = SKROLLABLE_CLASS + '-after';

	var SKROLLABLE_EMIT_EVENTS = false;
	var SKROLLABLE_OLD_IE_EVENTS = !document.createEvent;
	var SKROLLABLE_CACHED_EVENTS = {};

	var SKROLLABLE_EVENT = 'skrollr';
	var SKROLLABLE_EVENT_BEFORE = SKROLLABLE_EVENT + 'Before';
	var SKROLLABLE_EVENT_BETWEEN = SKROLLABLE_EVENT + 'Between';
	var SKROLLABLE_EVENT_AFTER = SKROLLABLE_EVENT + 'After';

	var SKROLLR_CLASS = 'skrollr';
	var NO_SKROLLR_CLASS = 'no-' + SKROLLR_CLASS;
	var SKROLLR_DESKTOP_CLASS = SKROLLR_CLASS + '-desktop';
	var SKROLLR_MOBILE_CLASS = SKROLLR_CLASS + '-mobile';

	var DEFAULT_EASING = 'linear';
	var DEFAULT_DURATION = 1000;//ms
	var DEFAULT_MOBILE_DECELERATION = 0.004;//pixel/ms²

	var DEFAULT_SMOOTH_SCROLLING_DURATION = 200;//ms

	var ANCHOR_START = 'start';
	var ANCHOR_END = 'end';
	var ANCHOR_CENTER = 'center';
	var ANCHOR_BOTTOM = 'bottom';

	//The property which will be added to the DOM element to hold the ID of the skrollable.
	var SKROLLABLE_ID_DOM_PROPERTY = '___skrollable_id';

	var rxTrim = /^\s+|\s+$/g;

	//Find all data-attributes. data-[_constant]-[offset]-[anchor]-[anchor].
	var rxKeyframeAttribute = /^data(?:-(_\w+))?(?:-?(-?\d*\.?\d+p?))?(?:-?(start|end|top|center|bottom))?(?:-?(top|center|bottom))?$/;
	var rxPropValue = /\s*([\w\-\[\]]+)\s*:\s*(.+?)\s*(?:;|$)/gi;

	//Easing function names follow the property in square brackets.
	var rxPropEasing = /^([a-z\-]+)\[(\w+)\]$/;

	var rxCamelCase = /-([a-z])/g;
	var rxCamelCaseFn = function(str, letter) {
		return letter.toUpperCase();
	};

	//Numeric values with optional sign.
	var rxNumericValue = /[\-+]?[\d]*\.?[\d]+/g;

	//Used to replace occurences of {?} with a number.
	var rxInterpolateString = /\{\?\}/g;

	//Finds rgb(a) colors, which don't use the percentage notation.
	var rxRGBAIntegerColor = /rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+/g;

	//Finds all gradients.
	var rxGradient = /[a-z\-]+-gradient/g;

	//Vendor prefix. Will be set once skrollr gets initialized.
	var theCSSPrefix = '';
	var theDashedCSSPrefix = '';

	//Will be called once (when skrollr gets initialized).
	var detectCSSPrefix = function() {
		//Only relevant prefixes. May be extended.
		//Could be dangerous if there will ever be a CSS property which actually starts with "ms". Don't hope so.
		var rxPrefixes = /^(?:O|Moz|webkit|ms)|(?:-(?:o|moz|webkit|ms)-)/;

		//Detect prefix for current browser by finding the first property using a prefix.
		if(!getStyle) {
			return;
		}

		var style = getStyle(body, null);

		for(var k in style) {
			//We check the key and if the key is a number, we check the value as well, because safari's getComputedStyle returns some weird array-like thingy.
			theCSSPrefix = (k.match(rxPrefixes) || (+k == k && style[k].match(rxPrefixes)));

			if(theCSSPrefix) {
				break;
			}
		}

		//Did we even detect a prefix?
		if(!theCSSPrefix) {
			theCSSPrefix = theDashedCSSPrefix = '';

			return;
		}

		theCSSPrefix = theCSSPrefix[0];

		//We could have detected either a dashed prefix or this camelCaseish-inconsistent stuff.
		if(theCSSPrefix.slice(0,1) === '-') {
			theDashedCSSPrefix = theCSSPrefix;

			//There's no logic behind these. Need a look up.
			theCSSPrefix = ({
				'-webkit-': 'webkit',
				'-moz-': 'Moz',
				'-ms-': 'ms',
				'-o-': 'O'
			})[theCSSPrefix];
		} else {
			theDashedCSSPrefix = '-' + theCSSPrefix.toLowerCase() + '-';
		}
	};

	var polyfillRAF = function() {
		var requestAnimFrame = window.requestAnimationFrame || window[theCSSPrefix.toLowerCase() + 'RequestAnimationFrame'];

		var lastTime = _now();

		if(_isMobile || !requestAnimFrame) {
			requestAnimFrame = function(callback) {
				//How long did it take to render?
				var deltaTime = _now() - lastTime;
				var delay = Math.max(0, 1000 / 60 - deltaTime);

				return window.setTimeout(function() {
					lastTime = _now();
					callback();
				}, delay);
			};
		}

		return requestAnimFrame;
	};

	var polyfillCAF = function() {
		var cancelAnimFrame = window.cancelAnimationFrame || window[theCSSPrefix.toLowerCase() + 'CancelAnimationFrame'];

		if(_isMobile || !cancelAnimFrame) {
			cancelAnimFrame = function(timeout) {
				return window.clearTimeout(timeout);
			};
		}

		return cancelAnimFrame;
	};

	//Built-in easing functions.
	var easings = {
		begin: function() {
			return 0;
		},
		end: function() {
			return 1;
		},
		linear: function(p) {
			return p;
		},
		quadratic: function(p) {
			return p * p;
		},
		cubic: function(p) {
			return p * p * p;
		},
		swing: function(p) {
			return (-Math.cos(p * Math.PI) / 2) + 0.5;
		},
		sqrt: function(p) {
			return Math.sqrt(p);
		},
		outCubic: function(p) {
			return (Math.pow((p - 1), 3) + 1);
		},
		//see https://www.desmos.com/calculator/tbr20s8vd2 for how I did this
		bounce: function(p) {
			var a;

			if(p <= 0.5083) {
				a = 3;
			} else if(p <= 0.8489) {
				a = 9;
			} else if(p <= 0.96208) {
				a = 27;
			} else if(p <= 0.99981) {
				a = 91;
			} else {
				return 1;
			}

			return 1 - Math.abs(3 * Math.cos(p * a * 1.028) / a);
		}
	};

	/**
	 * Constructor.
	 */
	function Skrollr(options) {
		documentElement = document.documentElement;
		body = document.body;

		detectCSSPrefix();

		_instance = this;

		options = options || {};

		//Set emit events flag and prepare the events
		if(options.emitEvents === true && !SKROLLABLE_OLD_IE_EVENTS) {
			SKROLLABLE_EMIT_EVENTS = options.emitEvents;

			//Cache the events
			SKROLLABLE_CACHED_EVENTS[SKROLLABLE_EVENT_BEFORE] = document.createEvent('Event');
			SKROLLABLE_CACHED_EVENTS[SKROLLABLE_EVENT_BEFORE].initEvent(SKROLLABLE_EVENT_BEFORE, true, true);

			SKROLLABLE_CACHED_EVENTS[SKROLLABLE_EVENT_BETWEEN] = document.createEvent('Event');
			SKROLLABLE_CACHED_EVENTS[SKROLLABLE_EVENT_BETWEEN].initEvent(SKROLLABLE_EVENT_BETWEEN, true, true);

			SKROLLABLE_CACHED_EVENTS[SKROLLABLE_EVENT_AFTER] = document.createEvent('Event');
			SKROLLABLE_CACHED_EVENTS[SKROLLABLE_EVENT_AFTER].initEvent(SKROLLABLE_EVENT_AFTER, true, true);
		}

		_constants = options.constants || {};

		//We allow defining custom easings or overwrite existing.
		if(options.easing) {
			for(var e in options.easing) {
				easings[e] = options.easing[e];
			}
		}

		_edgeStrategy = options.edgeStrategy || 'set';

		_listeners = {
			//Function to be called right before rendering.
			beforerender: options.beforerender,

			//Function to be called right after finishing rendering.
			render: options.render
		};

		//forceHeight is true by default
		_forceHeight = options.forceHeight !== false;

		if(_forceHeight) {
			_scale = options.scale || 1;
		}

		_mobileDeceleration = options.mobileDeceleration || DEFAULT_MOBILE_DECELERATION;

		_smoothScrollingEnabled = options.smoothScrolling !== false;
		_smoothScrollingDuration = options.smoothScrollingDuration || DEFAULT_SMOOTH_SCROLLING_DURATION;

		//Dummy object. Will be overwritten in the _render method when smooth scrolling is calculated.
		_smoothScrolling = {
			targetTop: _instance.getScrollPosition()
		};

		//A custom check function may be passed.
		_isMobile = ((options.mobileCheck || function() {
			return (/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera);
		})());

		if(_isMobile) {
			_skrollrBody = document.getElementById('skrollr-body');

			//Detect 3d transform if there's a skrollr-body (only needed for #skrollr-body).
			if(_skrollrBody) {
				_detect3DTransforms();
			}

			_initMobile();
			_updateClass(documentElement, [SKROLLR_CLASS, SKROLLR_MOBILE_CLASS], [NO_SKROLLR_CLASS]);
		} else {
			_updateClass(documentElement, [SKROLLR_CLASS, SKROLLR_DESKTOP_CLASS], [NO_SKROLLR_CLASS]);
		}

		_scrollHorizontal = options.horizontal === true;

		//Triggers parsing of elements and a first reflow.
		_instance.refresh();

		_addEvent(window, 'resize orientationchange', function() {
			var width = documentElement.clientWidth;
			var height = documentElement.clientHeight;

			//Only reflow if the size actually changed (#271).
			if(height !== _lastViewportHeight || width !== _lastViewportWidth) {
				_lastViewportHeight = height;
				_lastViewportWidth = width;

				_requestReflow = true;
			}
		});

		var requestAnimFrame = polyfillRAF();

		//Let's go.
		(function animloop(){
			_render();
			_animFrame = requestAnimFrame(animloop);
		}());

		return _instance;
	}

	Skrollr.prototype.isMobile = function() {
		return _isMobile;
	};

	/**
	 * (Re)parses some or all elements.
	 */
	Skrollr.prototype.refresh = function(elements) {
		var elementIndex;
		var elementsLength;
		var ignoreID = false;

		//Completely reparse anything without argument.
		if(elements === undefined) {
			//Ignore that some elements may already have a skrollable ID.
			ignoreID = true;

			_skrollables = [];
			_skrollableIdCounter = 0;

			elements = document.getElementsByTagName('*');
		} else {
			//We accept a single element or an array of elements.
			elements = [].concat(elements);
		}

		elementIndex = 0;
		elementsLength = elements.length;

		for(; elementIndex < elementsLength; elementIndex++) {
			var el = elements[elementIndex];
			var anchorTarget = el;
			var keyFrames = [];

			//If this particular element should be smooth scrolled.
			var smoothScrollThis = _smoothScrollingEnabled;

			//The edge strategy for this particular element.
			var edgeStrategy = _edgeStrategy;

			if(!el.attributes) {
				continue;
			}

			//Iterate over all attributes and search for key frame attributes.
			var attributeIndex = 0;
			var attributesLength = el.attributes.length;

			for (; attributeIndex < attributesLength; attributeIndex++) {
				var attr = el.attributes[attributeIndex];

				if(attr.name === 'data-anchor-target') {
					anchorTarget = document.querySelector(attr.value);

					if(anchorTarget === null) {
						throw 'Unable to find anchor target "' + attr.value + '"';
					}

					continue;
				}

				//Global smooth scrolling can be overridden by the element attribute.
				if(attr.name === 'data-smooth-scrolling') {
					smoothScrollThis = attr.value !== 'off';

					continue;
				}

				//Global edge strategy can be overridden by the element attribute.
				if(attr.name === 'data-edge-strategy') {
					edgeStrategy = attr.value;

					continue;
				}

				var match = attr.name.match(rxKeyframeAttribute);

				if(match === null) {
					continue;
				}

				var kf = {
					props: attr.value,
					//Point back to the element as well.
					element: el
				};

				keyFrames.push(kf);

				var constant = match[1];

				//If there is a constant, get it's value or fall back to 0.
				constant = constant && _constants[constant.substr(1)] || 0;

				//Parse key frame offset. If undefined will be casted to 0.
				var offset = match[2];

				//Is it a percentage offset?
				if(/p$/.test(offset)) {
					kf.isPercentage = true;
					kf.offset = ((offset.slice(0, -1) | 0) + constant) / 100;
				} else {
					kf.offset = (offset | 0) + constant;
				}

				var anchor1 = match[3];

				//If second anchor is not set, the first will be taken for both.
				var anchor2 = match[4] || anchor1;


				//"absolute" (or "classic") mode, where numbers mean absolute scroll offset.
				if(!anchor1 || anchor1 === ANCHOR_START || anchor1 === ANCHOR_END) {
					kf.mode = 'absolute';

					//data-end needs to be calculated after all key frames are known.
					if(anchor1 === ANCHOR_END) {
						kf.isEnd = true;
					} else if(!kf.isPercentage) {
						//For data-start we can already set the key frame w/o calculations.
						//#59: "scale" options should only affect absolute mode.
						kf.frame = kf.offset * _scale;

						delete kf.offset;
					}
				}
				//"relative" mode, where numbers are relative to anchors.
				else {
					kf.mode = 'relative';
					kf.anchors = [anchor1, anchor2];
				}
			}

			//Does this element have key frames?
			if(!keyFrames.length) {
				continue;
			}

			//Will hold the original style and class attributes before we controlled the element (see #80).
			var styleAttr, classAttr;

			var id;

			if(!ignoreID && SKROLLABLE_ID_DOM_PROPERTY in el) {
				//We already have this element under control. Grab the corresponding skrollable id.
				id = el[SKROLLABLE_ID_DOM_PROPERTY];
				styleAttr = _skrollables[id].styleAttr;
				classAttr = _skrollables[id].classAttr;
			} else {
				//It's an unknown element. Asign it a new skrollable id.
				id = (el[SKROLLABLE_ID_DOM_PROPERTY] = _skrollableIdCounter++);
				styleAttr = el.style.cssText;
				classAttr = _getClass(el);
			}

			_skrollables[id] = {
				element: el,
				styleAttr: styleAttr,
				classAttr: classAttr,
				anchorTarget: anchorTarget,
				keyFrames: keyFrames,
				smoothScrolling: smoothScrollThis,
				edgeStrategy: edgeStrategy
			};

			_updateClass(el, [SKROLLABLE_CLASS], []);
		}

		//Reflow for the first time.
		_reflow();

		//Now that we got all key frame numbers right, actually parse the properties.
		elementIndex = 0;
		elementsLength = elements.length;

		for(; elementIndex < elementsLength; elementIndex++) {
			var sk = _skrollables[elements[elementIndex][SKROLLABLE_ID_DOM_PROPERTY]];

			if(sk === undefined) {
				continue;
			}

			//Parse the property string to objects
			_parseProps(sk);

			//Fill key frames with missing properties from left and right
			_fillProps(sk);
		}

		return _instance;
	};

	/**
	 * Transform "relative" mode to "absolute" mode.
	 * That is, calculate anchor position and offset of element.
	 */
	Skrollr.prototype.relativeToAbsolute = function(element, viewportAnchor, elementAnchor) {
		var viewportHeight = documentElement.clientHeight;
		var box = element.getBoundingClientRect();
		var absolute = box.top;

		//#100: IE doesn't supply "height" with getBoundingClientRect.
		var boxHeight = box.bottom - box.top;

		if(viewportAnchor === ANCHOR_BOTTOM) {
			absolute -= viewportHeight;
		} else if(viewportAnchor === ANCHOR_CENTER) {
			absolute -= viewportHeight / 2;
		}

		if(elementAnchor === ANCHOR_BOTTOM) {
			absolute += boxHeight;
		} else if(elementAnchor === ANCHOR_CENTER) {
			absolute += boxHeight / 2;
		}

		//Compensate scrolling since getBoundingClientRect is relative to viewport.
		absolute += _instance.getScrollPosition();

		return (absolute + 0.5) | 0;
	};

	/**
	 * Animates scroll top to new position.
	 */
	Skrollr.prototype.animateTo = function(top, options) {
		options = options || {};

		var now = _now();
		var scrollTop = _instance.getScrollPosition();

		//Setting this to a new value will automatically cause the current animation to stop, if any.
		_scrollAnimation = {
			startTop: scrollTop,
			topDiff: top - scrollTop,
			targetTop: top,
			duration: options.duration || DEFAULT_DURATION,
			startTime: now,
			endTime: now + (options.duration || DEFAULT_DURATION),
			easing: easings[options.easing || DEFAULT_EASING],
			done: options.done
		};

		//Don't queue the animation if there's nothing to animate.
		if(!_scrollAnimation.topDiff) {
			if(_scrollAnimation.done) {
				_scrollAnimation.done.call(_instance, false);
			}

			_scrollAnimation = undefined;
		}

		return _instance;
	};

	/**
	 * Stops animateTo animation.
	 */
	Skrollr.prototype.stopAnimateTo = function() {
		if(_scrollAnimation && _scrollAnimation.done) {
			_scrollAnimation.done.call(_instance, true);
		}

		_scrollAnimation = undefined;
	};

	/**
	 * Returns if an animation caused by animateTo is currently running.
	 */
	Skrollr.prototype.isAnimatingTo = function() {
		return !!_scrollAnimation;
	};

	Skrollr.prototype.setScrollPosition = function(top, force) {
		//Don't do smooth scrolling (last top === new top).
		if(force === true) {
			_lastTop = top;
			_forceRender = true;
		}

		if(_isMobile) {
			_mobileOffset = Math.min(Math.max(top, 0), _maxKeyFrame);
		} else {
			if (!_scrollHorizontal) {
				window.scrollTo(0, top);
			}
			else {
				window.scrollTo(top, 0);
			}
		}

		return _instance;
	};

	Skrollr.prototype.getScrollPosition = function() {
		if(_isMobile) {
			return _mobileOffset;
		} else {
			if (!_scrollHorizontal) {
				return window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
			} else {
				return window.pageXOffset || documentElement.scrollLeft || body.scrollLeft || 0;
			}
		}
	};

	Skrollr.prototype.on = function(name, fn) {
		_listeners[name] = fn;

		return _instance;
	};

	Skrollr.prototype.off = function(name) {
		delete _listeners[name];

		return _instance;
	};

	Skrollr.prototype.destroy = function() {
		var cancelAnimFrame = polyfillCAF();
		cancelAnimFrame(_animFrame);
		_removeAllEvents();

		_updateClass(documentElement, [NO_SKROLLR_CLASS], [SKROLLR_CLASS, SKROLLR_DESKTOP_CLASS, SKROLLR_MOBILE_CLASS]);

		var skrollableIndex = 0;
		var skrollablesLength = _skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			_reset(_skrollables[skrollableIndex].element);
		}

		documentElement.style.overflow = body.style.overflow = 'auto';
		documentElement.style.height = body.style.height = 'auto';

		if(_skrollrBody) {
			skrollr.setStyle(_skrollrBody, 'transform', 'none');
		}

		_instance = undefined;
		_skrollrBody = undefined;
		_listeners = undefined;
		_forceHeight = undefined;
		_maxKeyFrame = 0;
		_scale = 1;
		_constants = undefined;
		_mobileDeceleration = undefined;
		_direction = 'down';
		_lastTop = -1;
		_lastViewportWidth = 0;
		_lastViewportHeight = 0;
		_requestReflow = false;
		_scrollAnimation = undefined;
		_smoothScrollingEnabled = undefined;
		_smoothScrollingDuration = undefined;
		_smoothScrolling = undefined;
		_forceRender = undefined;
		_skrollableIdCounter = 0;
		_edgeStrategy = undefined;
		_isMobile = false;
		_mobileOffset = 0;
		_translateZ = undefined;
	};

	/*
		Private methods.
	*/

	var _initMobile = function() {
		var initialElement;
		var initialTouchY;
		var initialTouchX;
		var currentTouchY;
		var currentTouchX;
		var lastTouchY;
		var lastTouchX;
		var deltaY;
		var deltaX;

		var initialTouchTime;
		var currentTouchTime;
		var lastTouchTime;
		var deltaTime;

		_addEvent(documentElement, [EVENT_TOUCHSTART, EVENT_TOUCHMOVE, EVENT_TOUCHCANCEL, EVENT_TOUCHEND].join(' '), function(e) {
			e.preventDefault();

			var touch = e.changedTouches[0];

			currentTouchY = touch.clientY;
			currentTouchX = touch.clientX;
			currentTouchTime = e.timeStamp;

			switch(e.type) {
				case EVENT_TOUCHSTART:
					//The last element we tapped on.
					if(initialElement) {
						initialElement.blur();
					}

					_instance.stopAnimateTo();

					initialElement = e.target;
					initialTouchY = lastTouchY = currentTouchY;
					initialTouchX = lastTouchX = currentTouchX;
					initialTouchTime = currentTouchTime;

					break;
				case EVENT_TOUCHMOVE:
					deltaY = currentTouchY - lastTouchY;
					deltaX = currentTouchX - lastTouchX;
					deltaTime = currentTouchTime - lastTouchTime;

					var position = _mobileOffset - (!_scrollHorizontal ? deltaY : deltaX);
					_instance.setScrollPosition(position, true);

					lastTouchY = currentTouchY;
					lastTouchX = currentTouchX;
					lastTouchTime = currentTouchTime;
					break;
				default:
				case EVENT_TOUCHCANCEL:
				case EVENT_TOUCHEND:
					var distanceY = initialTouchY - currentTouchY;
					var distanceX = initialTouchX - currentTouchX;
					var distance2 = distanceX * distanceX + distanceY * distanceY;

					//Check if it was more like a tap (moved less than 7px).
					if(distance2 < 49) {
						//It was a tap, click the element.
						initialElement.focus();
						initialElement.click();

						return;
					}

					initialElement = undefined;

					var speed = (!_scrollHorizontal ? deltaY : deltaX) / deltaTime;

					//Cap speed at 3 pixel/ms.
					speed = Math.max(Math.min(speed, 3), -3);

					var duration = Math.abs(speed / _mobileDeceleration);
					var targetOffset = speed * duration + 0.5 * _mobileDeceleration * duration * duration;
					var targetTop = _instance.getScrollPosition() - targetOffset;

					//Relative duration change for when scrolling above bounds.
					var targetRatio = 0;

					//Change duration proportionally when scrolling would leave bounds.
					if(targetTop > _maxKeyFrame) {
						targetRatio = (_maxKeyFrame - targetTop) / targetOffset;

						targetTop = _maxKeyFrame;
					} else if(targetTop < 0) {
						targetRatio = -targetTop / targetOffset;

						targetTop = 0;
					}

					duration = duration * (1 - targetRatio);

					_instance.animateTo(targetTop, {easing: 'outCubic', duration: duration});
					break;
			}
		});

		//Just in case there has already been some native scrolling, reset it.
		window.scrollTo(0, 0);
		documentElement.style.overflow = body.style.overflow = 'hidden';
	};

	/**
	 * Updates key frames which depend on others.
	 * That is "end" in "absolute" mode and all key frames in "relative" mode.
	 */
	var _updateDependentKeyFrames = function() {
		var skrollable;
		var element;
		var anchorTarget;
		var keyFrames;
		var keyFrameIndex;
		var keyFramesLength;
		var kf;
		var skrollableIndex;
		var skrollablesLength;

		//First process all relative-mode elements and find the max key frame.
		skrollableIndex = 0;
		skrollablesLength = _skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			skrollable = _skrollables[skrollableIndex];
			element = skrollable.element;
			anchorTarget = skrollable.anchorTarget;
			keyFrames = skrollable.keyFrames;

			keyFrameIndex = 0;
			keyFramesLength = keyFrames.length;

			for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
				kf = keyFrames[keyFrameIndex];

				var offset = kf.offset;

				if(kf.isPercentage) {
					//Convert the offset to percentage of the viewport height.
					offset = offset * (_scrollHorizontal ? documentElement.clientWidth : documentElement.clientHeight);

					//Absolute + percentage mode.
					kf.frame = offset;
				}

				if(kf.mode === 'relative') {
					_reset(element);

					kf.frame = _instance.relativeToAbsolute(anchorTarget, kf.anchors[0], kf.anchors[1]) - offset;

					_reset(element, true);
				}

				//Only search for max key frame when forceHeight is enabled.
				if(_forceHeight) {
					//Find the max key frame, but don't use one of the data-end ones for comparison.
					if(!kf.isEnd && kf.frame > _maxKeyFrame) {
						_maxKeyFrame = kf.frame;
					}
				}
			}
		}

		//#133: The document can be larger than the maxKeyFrame we found.
		_maxKeyFrame = Math.max(_maxKeyFrame, _getDocumentSize());

		//Now process all data-end keyframes.
		skrollableIndex = 0;
		skrollablesLength = _skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			skrollable = _skrollables[skrollableIndex];
			keyFrames = skrollable.keyFrames;

			keyFrameIndex = 0;
			keyFramesLength = keyFrames.length;

			for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
				kf = keyFrames[keyFrameIndex];

				if(kf.isEnd) {
					kf.frame = _maxKeyFrame - kf.offset;
				}
			}

			skrollable.keyFrames.sort(_keyFrameComparator);
		}
	};

	/**
	 * Calculates and sets the style properties for the element at the given frame.
	 * @param fakeFrame The frame to render at when smooth scrolling is enabled.
	 * @param actualFrame The actual frame we are at.
	 */
	var _calcSteps = function(fakeFrame, actualFrame) {
		//Iterate over all skrollables.
		var skrollableIndex = 0;
		var skrollablesLength = _skrollables.length;

		for(; skrollableIndex < skrollablesLength; skrollableIndex++) {
			var skrollable = _skrollables[skrollableIndex];
			var element = skrollable.element;
			var frame = skrollable.smoothScrolling ? fakeFrame : actualFrame;
			var frames = skrollable.keyFrames;
			var firstFrame = frames[0].frame;
			var lastFrame = frames[frames.length - 1].frame;
			var beforeFirst = frame < firstFrame;
			var afterLast = frame > lastFrame;
			var firstOrLastFrame = frames[beforeFirst ? 0 : frames.length - 1];
			var key;
			var value;

			//If we are before/after the first/last frame, set the styles according to the given edge strategy.
			if(beforeFirst || afterLast) {
				//Check if we already handled this edge case last time.
				//Note: using setScrollPosition it's possible that we jumped from one edge to the other.
				if(beforeFirst && skrollable.edge === -1 || afterLast && skrollable.edge === 1) {
					continue;
				}

				//Add the skrollr-before or -after class.
				_updateClass(element, [beforeFirst ? SKROLLABLE_BEFORE_CLASS : SKROLLABLE_AFTER_CLASS], [SKROLLABLE_BEFORE_CLASS, SKROLLABLE_BETWEEN_CLASS, SKROLLABLE_AFTER_CLASS]);

				//Remember that we handled the edge case (before/after the first/last keyframe).
				skrollable.edge = beforeFirst ? -1 : 1;

				switch(skrollable.edgeStrategy) {
					case 'reset':
						_reset(element);
						continue;
					case 'ease':
						//Handle this case like it would be exactly at first/last keyframe and just pass it on.
						frame = firstOrLastFrame.frame;
						break;
					default:
					case 'set':
						var props = firstOrLastFrame.props;

						for(key in props) {
							if(hasProp.call(props, key)) {
								value = _interpolateString(props[key].value);

								skrollr.setStyle(element, key, value);
							}
						}

						continue;
				}
			} else {
				//Did we handle an edge last time?
				if(skrollable.edge !== 0) {
					_updateClass(element, [SKROLLABLE_CLASS, SKROLLABLE_BETWEEN_CLASS], [SKROLLABLE_BEFORE_CLASS, SKROLLABLE_AFTER_CLASS]);
					skrollable.edge = 0;
				}
			}

			//Find out between which two key frames we are right now.
			var keyFrameIndex = 0;
			var framesLength = frames.length - 1;

			for(; keyFrameIndex < framesLength; keyFrameIndex++) {
				if(frame >= frames[keyFrameIndex].frame && frame <= frames[keyFrameIndex + 1].frame) {
					var left = frames[keyFrameIndex];
					var right = frames[keyFrameIndex + 1];

					for(key in left.props) {
						if(hasProp.call(left.props, key)) {
							var progress = (frame - left.frame) / (right.frame - left.frame);

							//Transform the current progress using the given easing function.
							progress = left.props[key].easing(progress);

							//Interpolate between the two values
							value = _calcInterpolation(left.props[key].value, right.props[key].value, progress);

							value = _interpolateString(value);

							skrollr.setStyle(element, key, value);
						}
					}

					break;
				}
			}
		}
	};

	/**
	 * Renders all elements.
	 */
	var _render = function() {
		if(_requestReflow) {
			_requestReflow = false;
			_reflow();
		}

		//We may render something else than the actual scrollbar position.
		var renderTop = _instance.getScrollPosition();

		//If there's an animation, which ends in current render call, call the callback after rendering.
		var afterAnimationCallback;
		var now = _now();
		var progress;

		//Before actually rendering handle the scroll animation, if any.
		if(_scrollAnimation) {
			//It's over
			if(now >= _scrollAnimation.endTime) {
				renderTop = _scrollAnimation.targetTop;
				afterAnimationCallback = _scrollAnimation.done;
				_scrollAnimation = undefined;
			} else {
				//Map the current progress to the new progress using given easing function.
				progress = _scrollAnimation.easing((now - _scrollAnimation.startTime) / _scrollAnimation.duration);

				renderTop = (_scrollAnimation.startTop + progress * _scrollAnimation.topDiff) | 0;
			}

			_instance.setScrollPosition(renderTop, true);
		}
		//Smooth scrolling only if there's no animation running and if we're not on mobile.
		else if(!_isMobile) {
			var smoothScrollingDiff = _smoothScrolling.targetTop - renderTop;

			//The user scrolled, start new smooth scrolling.
			if(smoothScrollingDiff) {
				_smoothScrolling = {
					startTop: _lastTop,
					topDiff: renderTop - _lastTop,
					targetTop: renderTop,
					startTime: _lastRenderCall,
					endTime: _lastRenderCall + _smoothScrollingDuration
				};
			}

			//Interpolate the internal scroll position (not the actual scrollbar).
			if(now <= _smoothScrolling.endTime) {
				//Map the current progress to the new progress using easing function.
				progress = easings.sqrt((now - _smoothScrolling.startTime) / _smoothScrollingDuration);

				renderTop = (_smoothScrolling.startTop + progress * _smoothScrolling.topDiff) | 0;
			}
		}

		//That's were we actually "scroll" on mobile.
		if(_isMobile && _skrollrBody) {
			//Set the transform ("scroll it").
			var coords = [0, -_mobileOffset + 'px'];
			if (_scrollHorizontal) {
				coords.reverse();
			}
			skrollr.setStyle(_skrollrBody, 'transform', 'translate(' + coords.join(', ') + ') ' + _translateZ);
		}

		//Did the scroll position even change?
		if(_forceRender || _lastTop !== renderTop) {
			//Remember in which direction are we scrolling?
			_direction = (renderTop >= _lastTop) ? 'forward' : 'back';

			_forceRender = false;

			var listenerParams = {
				curTop: renderTop,
				lastTop: _lastTop,
				maxTop: _maxKeyFrame,
				direction: _direction
			};

			//Tell the listener we are about to render.
			var continueRendering = _listeners.beforerender && _listeners.beforerender.call(_instance, listenerParams);

			//The beforerender listener function is able the cancel rendering.
			if(continueRendering !== false) {
				//Now actually interpolate all the styles.
				_calcSteps(renderTop, _instance.getScrollPosition());

				//Remember when we last rendered.
				_lastTop = renderTop;

				if(_listeners.render) {
					_listeners.render.call(_instance, listenerParams);
				}
			}

			if(afterAnimationCallback) {
				afterAnimationCallback.call(_instance, false);
			}
		}

		_lastRenderCall = now;
	};

	/**
	 * Parses the properties for each key frame of the given skrollable.
	 */
	var _parseProps = function(skrollable) {
		//Iterate over all key frames
		var keyFrameIndex = 0;
		var keyFramesLength = skrollable.keyFrames.length;

		for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
			var frame = skrollable.keyFrames[keyFrameIndex];
			var easing;
			var value;
			var prop;
			var props = {};

			var match;

			while((match = rxPropValue.exec(frame.props)) !== null) {
				prop = match[1];
				value = match[2];

				easing = prop.match(rxPropEasing);

				//Is there an easing specified for this prop?
				if(easing !== null) {
					prop = easing[1];
					easing = easing[2];
				} else {
					easing = DEFAULT_EASING;
				}

				//Exclamation point at first position forces the value to be taken literal.
				value = value.indexOf('!') ? _parseProp(value) : [value.slice(1)];

				//Save the prop for this key frame with his value and easing function
				props[prop] = {
					value: value,
					easing: easings[easing]
				};
			}

			frame.props = props;
		}
	};

	/**
	 * Parses a value extracting numeric values and generating a format string
	 * for later interpolation of the new values in old string.
	 *
	 * @param val The CSS value to be parsed.
	 * @return Something like ["rgba(?%,?%, ?%,?)", 100, 50, 0, .7]
	 * where the first element is the format string later used
	 * and all following elements are the numeric value.
	 */
	var _parseProp = function(val) {
		var numbers = [];

		//One special case, where floats don't work.
		//We replace all occurences of rgba colors
		//which don't use percentage notation with the percentage notation.
		rxRGBAIntegerColor.lastIndex = 0;
		val = val.replace(rxRGBAIntegerColor, function(rgba) {
			return rgba.replace(rxNumericValue, function(n) {
				return n / 255 * 100 + '%';
			});
		});

		//Handle prefixing of "gradient" values.
		//For now only the prefixed value will be set. Unprefixed isn't supported anyway.
		if(theDashedCSSPrefix) {
			rxGradient.lastIndex = 0;
			val = val.replace(rxGradient, function(s) {
				return theDashedCSSPrefix + s;
			});
		}

		//Now parse ANY number inside this string and create a format string.
		val = val.replace(rxNumericValue, function(n) {
			numbers.push(+n);
			return '{?}';
		});

		//Add the formatstring as first value.
		numbers.unshift(val);

		return numbers;
	};

	/**
	 * Fills the key frames with missing left and right hand properties.
	 * If key frame 1 has property X and key frame 2 is missing X,
	 * but key frame 3 has X again, then we need to assign X to key frame 2 too.
	 *
	 * @param sk A skrollable.
	 */
	var _fillProps = function(sk) {
		//Will collect the properties key frame by key frame
		var propList = {};
		var keyFrameIndex;
		var keyFramesLength;

		//Iterate over all key frames from left to right
		keyFrameIndex = 0;
		keyFramesLength = sk.keyFrames.length;

		for(; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
			_fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
		}

		//Now do the same from right to fill the last gaps

		propList = {};

		//Iterate over all key frames from right to left
		keyFrameIndex = sk.keyFrames.length - 1;

		for(; keyFrameIndex >= 0; keyFrameIndex--) {
			_fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
		}
	};

	var _fillPropForFrame = function(frame, propList) {
		var key;

		//For each key frame iterate over all right hand properties and assign them,
		//but only if the current key frame doesn't have the property by itself
		for(key in propList) {
			//The current frame misses this property, so assign it.
			if(!hasProp.call(frame.props, key)) {
				frame.props[key] = propList[key];
			}
		}

		//Iterate over all props of the current frame and collect them
		for(key in frame.props) {
			propList[key] = frame.props[key];
		}
	};

	/**
	 * Calculates the new values for two given values array.
	 */
	var _calcInterpolation = function(val1, val2, progress) {
		var valueIndex;
		var val1Length = val1.length;

		//They both need to have the same length
		if(val1Length !== val2.length) {
			throw 'Can\'t interpolate between "' + val1[0] + '" and "' + val2[0] + '"';
		}

		//Add the format string as first element.
		var interpolated = [val1[0]];

		valueIndex = 1;

		for(; valueIndex < val1Length; valueIndex++) {
			//That's the line where the two numbers are actually interpolated.
			interpolated[valueIndex] = val1[valueIndex] + ((val2[valueIndex] - val1[valueIndex]) * progress);
		}

		return interpolated;
	};

	/**
	 * Interpolates the numeric values into the format string.
	 */
	var _interpolateString = function(val) {
		var valueIndex = 1;

		rxInterpolateString.lastIndex = 0;

		return val[0].replace(rxInterpolateString, function() {
			return val[valueIndex++];
		});
	};

	/**
	 * Resets the class and style attribute to what it was before skrollr manipulated the element.
	 * Also remembers the values it had before reseting, in order to undo the reset.
	 */
	var _reset = function(elements, undo) {
		//We accept a single element or an array of elements.
		elements = [].concat(elements);

		var skrollable;
		var element;
		var elementsIndex = 0;
		var elementsLength = elements.length;

		for(; elementsIndex < elementsLength; elementsIndex++) {
			element = elements[elementsIndex];
			skrollable = _skrollables[element[SKROLLABLE_ID_DOM_PROPERTY]];

			//Couldn't find the skrollable for this DOM element.
			if(!skrollable) {
				continue;
			}

			if(undo) {
				//Reset class and style to the "dirty" (set by skrollr) values.
				element.style.cssText = skrollable.dirtyStyleAttr;
				_updateClass(element, skrollable.dirtyClassAttr);
			} else {
				//Remember the "dirty" (set by skrollr) class and style.
				skrollable.dirtyStyleAttr = element.style.cssText;
				skrollable.dirtyClassAttr = _getClass(element);

				//Reset class and style to what it originally was.
				element.style.cssText = skrollable.styleAttr;
				_updateClass(element, skrollable.classAttr);
			}
		}
	};

	/**
	 * Detects support for 3d transforms by applying it to the skrollr-body.
	 */
	var _detect3DTransforms = function() {
		_translateZ = 'translateZ(0)';
		skrollr.setStyle(_skrollrBody, 'transform', _translateZ);

		var computedStyle = getStyle(_skrollrBody);
		var computedTransform = computedStyle.getPropertyValue('transform');
		var computedTransformWithPrefix = computedStyle.getPropertyValue(theDashedCSSPrefix + 'transform');
		var has3D = (computedTransform && computedTransform !== 'none') || (computedTransformWithPrefix && computedTransformWithPrefix !== 'none');

		if(!has3D) {
			_translateZ = '';
		}
	};

	/**
	 * Set the CSS property on the given element. Sets prefixed properties as well.
	 */
	skrollr.setStyle = function(el, prop, val) {
		var style = el.style;

		//Camel case.
		prop = prop.replace(rxCamelCase, rxCamelCaseFn).replace('-', '');

		//Make sure z-index gets a <integer>.
		//This is the only <integer> case we need to handle.
		if(prop === 'zIndex') {
			//Floor
			style[prop] = '' + (val | 0);
		}
		//#64: "float" can't be set across browsers. Needs to use "cssFloat" for all except IE.
		else if(prop === 'float') {
			style.styleFloat = style.cssFloat = val;
		}
		else {
			//Need try-catch for old IE.
			try {
				//Set prefixed property if there's a prefix.
				if(theCSSPrefix) {
					style[theCSSPrefix + prop.slice(0,1).toUpperCase() + prop.slice(1)] = val;
				}

				//Set unprefixed.
				style[prop] = val;
			} catch(ignore) {}
		}
	};

	/**
	 * Cross browser event handling.
	 */
	var _addEvent = skrollr.addEvent = function(element, names, callback) {
		var intermediate = function(e) {
			//Normalize IE event stuff.
			e = e || window.event;

			if(!e.target) {
				e.target = e.srcElement;
			}

			if(!e.preventDefault) {
				e.preventDefault = function() {
					e.returnValue = false;
				};
			}

			return callback.call(this, e);
		};

		names = names.split(' ');

    var name;
		var nameCounter = 0;
		var namesLength = names.length;

		for(; nameCounter < namesLength; nameCounter++) {
			name = names[nameCounter];

			if(element.addEventListener) {
				element.addEventListener(name, callback, false);
			} else {
				element.attachEvent('on' + name, intermediate);
			}

      //Remember the events to be able to flush them later.
			_registeredEvents.push({
				element: element,
				name: name,
				listener: callback
			});
		}
	};

	var _removeEvent = skrollr.removeEvent = function(element, names, callback) {
		names = names.split(' ');

		var nameCounter = 0;
		var namesLength = names.length;

		for(; nameCounter < namesLength; nameCounter++) {
			if(element.removeEventListener) {
				element.removeEventListener(names[nameCounter], callback, false);
			} else {
				element.detachEvent('on' + names[nameCounter], callback);
			}
		}
	};

	var _removeAllEvents = function() {
		var eventData;
		var eventCounter = 0;
		var eventsLength = _registeredEvents.length;

		for(; eventCounter < eventsLength; eventCounter++) {
			eventData = _registeredEvents[eventCounter];

			_removeEvent(eventData.element, eventData.name, eventData.listener);
		}

		_registeredEvents = [];
	};

	var _reflow = function() {
		var pos = _instance.getScrollPosition();

		//Will be recalculated by _updateDependentKeyFrames.
		_maxKeyFrame = 0;

		var size = _scrollHorizontal ? 'width' : 'height';

		if(_forceHeight && !_isMobile) {
			//un-"force" the height to not mess with the calculations in _updateDependentKeyFrames (#216).
			body.style[size] = 'auto';
		}

		_updateDependentKeyFrames();

		if(_forceHeight && !_isMobile) {
			//"force" the height.
			var clientSize = _scrollHorizontal ? documentElement.clientWidth : documentElement.clientHeight;
			body.style[size] = (_maxKeyFrame + clientSize) + 'px';
		}

		//The scroll offset may now be larger than needed (on desktop the browser/os prevents scrolling farther than the bottom).
		if(_isMobile) {
			_instance.setScrollPosition(Math.min(_instance.getScrollPosition(), _maxKeyFrame));
		} else {
			//Remember and reset the scroll pos (#217).
			_instance.setScrollPosition(pos, true);
		}

		_forceRender = true;
	};

	/*
	 * Returns the height of the document.
	 */
	var _getDocumentSize = function() {
		if (!_scrollHorizontal) {
			var skrollrBodyHeight = (_skrollrBody && _skrollrBody.offsetHeight || 0);
			var bodyHeight = Math.max(skrollrBodyHeight, body.scrollHeight, body.offsetHeight, documentElement.scrollHeight, documentElement.offsetHeight, documentElement.clientHeight);
			return bodyHeight - documentElement.clientHeight;
		} else {
			var skrollrBodyWidth = (_skrollrBody && _skrollrBody.offsetWidth || 0);
			var bodyWidth = Math.max(skrollrBodyWidth, body.scrollWidth, body.offsetWidth, documentElement.scrollWidth, documentElement.offsetWidth, documentElement.clientWidth);
			return bodyWidth - documentElement.clientWidth;
		}
	};

	/**
	 * Returns a string of space separated classnames for the current element.
	 * Works with SVG as well.
	 */
	var _getClass = function(element) {
		var prop = 'className';

		//SVG support by using className.baseVal instead of just className.
		if(window.SVGElement && element instanceof window.SVGElement) {
			element = element[prop];
			prop = 'baseVal';
		}

		return element[prop];
	};

	/**
	 * Adds and removes a CSS classes.
	 * Works with SVG as well.
	 * add and remove are arrays of strings,
	 * or if remove is ommited add is a string and overwrites all classes.
	 */
	var _updateClass = function(element, add, remove) {
		//Emit skrollr event if enabled
		if (SKROLLABLE_EMIT_EVENTS) {
			var addIndex = 0;
			var eventType = null;

			for(; addIndex < add.length; addIndex++) {
				switch (add[addIndex]) {
					case SKROLLABLE_BEFORE_CLASS:
						eventType = SKROLLABLE_EVENT_BEFORE;
					break;
					case SKROLLABLE_BETWEEN_CLASS:
						eventType = SKROLLABLE_EVENT_BETWEEN;
					break;
					case SKROLLABLE_AFTER_CLASS:
						eventType = SKROLLABLE_EVENT_AFTER;
					break;
				}

				if (eventType) {
					break;
				}
			}

			if (eventType) {
				_emitEvent(element, eventType);
			}
		}


		var prop = 'className';

		//SVG support by using className.baseVal instead of just className.
		if(window.SVGElement && element instanceof window.SVGElement) {
			element = element[prop];
			prop = 'baseVal';
		}

		//When remove is ommited, we want to overwrite/set the classes.
		if(remove === undefined) {
			element[prop] = add;
			return;
		}

		//Cache current classes. We will work on a string before passing back to DOM.
		var val = element[prop];

		//All classes to be removed.
		var classRemoveIndex = 0;
		var removeLength = remove.length;

		for(; classRemoveIndex < removeLength; classRemoveIndex++) {
			val = _untrim(val).replace(_untrim(remove[classRemoveIndex]), ' ');
		}

		val = _trim(val);

		//All classes to be added.
		var classAddIndex = 0;
		var addLength = add.length;

		for(; classAddIndex < addLength; classAddIndex++) {
			//Only add if el not already has class.
			if(_untrim(val).indexOf(_untrim(add[classAddIndex])) === -1) {
				val += ' ' + add[classAddIndex];
			}
		}

		element[prop] = _trim(val);
	};

	var _emitEvent = function(element, eventName) {
		try {
			if(!SKROLLABLE_OLD_IE_EVENTS) {
				element.dispatchEvent(SKROLLABLE_CACHED_EVENTS[eventName]);
			} else {
				element.fireEvent('on' + eventName);
			}
		} catch (err) { /* Fail silently.. */ }
	};

	var _trim = function(a) {
		return a.replace(rxTrim, '');
	};

	/**
	 * Adds a space before and after the string.
	 */
	var _untrim = function(a) {
		return ' ' + a + ' ';
	};

	var _now = Date.now || function() {
		return +new Date();
	};

	var _keyFrameComparator = function(a, b) {
		return a.frame - b.frame;
	};

	/*
	 * Private variables.
	 */

	//Singleton
	var _instance;

	/*
		A list of all elements which should be animated associated with their the metadata.
		Exmaple skrollable with two key frames animating from 100px width to 20px:

		skrollable = {
			element: <the DOM element>,
			styleAttr: <style attribute of the element before skrollr>,
			classAttr: <class attribute of the element before skrollr>,
			keyFrames: [
				{
					frame: 100,
					props: {
						width: {
							value: ['{?}px', 100],
							easing: <reference to easing function>
						}
					},
					mode: "absolute"
				},
				{
					frame: 200,
					props: {
						width: {
							value: ['{?}px', 20],
							easing: <reference to easing function>
						}
					},
					mode: "absolute"
				}
			]
		};
	*/
	var _skrollables;

	var _skrollrBody;

	var _listeners;
	var _forceHeight;
	var _maxKeyFrame = 0;

	var _scale = 1;
	var _constants;

  var _mobileDeceleration;

	//Current direction (forward/back).
	var _direction = 'forward';

	//The last top offset value. Needed to determine direction.
	var _lastTop = -1;

	//The last time we called the render method (doesn't mean we rendered!).
	var _lastRenderCall = _now();

	//For detecting if it actually resized (#271).
	var _lastViewportWidth = 0;
	var _lastViewportHeight = 0;

	var _requestReflow = false;

	//Will contain data about a running scrollbar animation, if any.
	var _scrollAnimation;

	var _smoothScrollingEnabled;

	var _smoothScrollingDuration;

	//Will contain settins for smooth scrolling if enabled.
	var _smoothScrolling;

	//Can be set by any operation/event to force rendering even if the scrollbar didn't move.
	var _forceRender;

	//Each skrollable gets an unique ID incremented for each skrollable.
	//The ID is the index in the _skrollables array.
	var _skrollableIdCounter = 0;

	var _edgeStrategy;


	//Mobile specific vars. Will be stripped by UglifyJS when not in use.
	var _isMobile = false;

	// Horizontal scrolling option.
	var _scrollHorizontal = false;

	//The virtual scroll offset when using mobile scrolling.
	var _mobileOffset = 0;

	//If the browser supports 3d transforms, this will be filled with 'translateZ(0)' (empty string otherwise).
	var _translateZ;

  //Will contain data about registered events by skrollr.
	var _registeredEvents = [];

	//Animation frame id returned by RequestAnimationFrame (or timeout when RAF is not supported).
	var _animFrame;

}(window, document));
/*!
 PowerTip - v1.2.0 - 2013-10-15
 http://stevenbenner.github.io/jquery-powertip/
 Copyright (c) 2013 Steven Benner (http://stevenbenner.com/).
 Released under MIT license.
 https://raw.github.com/stevenbenner/jquery-powertip/master/LICENSE.txt
*/

(function(factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function($) {

	// useful private variables
	var $document = $(document),
		$window = $(window),
		$body = $('body');

	// constants
	var DATA_DISPLAYCONTROLLER = 'displayController',
		DATA_HASACTIVEHOVER = 'hasActiveHover',
		DATA_HASMOUSEENTER = 'hasMouseEnter',
		DATA_FORCEDOPEN = 'forcedOpen',
		DATA_HASMOUSEMOVE = 'hasMouseMove',
		DATA_MOUSEONTOTIP = 'mouseOnToPopup',
		DATA_ORIGINALTITLE = 'originalTitle',
		DATA_POWERTIP = 'powertip',
		DATA_POWERTIPJQ = 'powertipjq',
		DATA_POWERTIPTARGET = 'powertiptarget',
		EVENT_NAMESPACE = '.powertip',
		RAD2DEG = 180 / Math.PI;

	/**
	 * Session data
	 * Private properties global to all powerTip instances
	 */
	var session = {
		elements: null,
		tooltips: null,
		isTipOpen: false,
		isFixedTipOpen: false,
		isClosing: false,
		tipOpenImminent: false,
		activeHover: null,
		currentX: 0,
		currentY: 0,
		previousX: 0,
		previousY: 0,
		desyncTimeout: null,
		closeDelayTimeout: null,
		mouseTrackingActive: false,
		delayInProgress: false,
		windowWidth: 0,
		windowHeight: 0,
		scrollTop: 0,
		scrollLeft: 0
	};

	/**
	 * Collision enumeration
	 * @enum {number}
	 */
	var Collision = {
		none: 0,
		top: 1,
		bottom: 2,
		left: 4,
		right: 8
	};

	/**
	 * Display hover tooltips on the matched elements.
	 * @param {(Object|string)=} opts The options object to use for the plugin, or
	 *     the name of a method to invoke on the first matched element.
	 * @param {*=} [arg] Argument for an invoked method (optional).
	 * @return {jQuery} jQuery object for the matched selectors.
	 */
	$.fn.powerTip = function(opts, arg) {
		var targetElements = this,
			options,
			tipController;

		// don't do any work if there were no matched elements
		if (!targetElements.length) {
			return targetElements;
		}

		// handle api method calls on the plugin, e.g. powerTip('hide')
		if ($.type(opts) === 'string' && $.powerTip[opts]) {
			return $.powerTip[opts].call(targetElements, targetElements, arg);
		}

		// extend options and instantiate TooltipController
		options = $.extend({}, $.fn.powerTip.defaults, opts);
		tipController = new TooltipController(options);

		// hook mouse and viewport dimension tracking
		initTracking();

		// setup the elements
		targetElements.each(function elementSetup() {
			var $this = $(this),
				dataPowertip = $this.data(DATA_POWERTIP),
				dataElem = $this.data(DATA_POWERTIPJQ),
				dataTarget = $this.data(DATA_POWERTIPTARGET),
				title;

			// handle repeated powerTip calls on the same element by destroying the
			// original instance hooked to it and replacing it with this call
			if ($this.data(DATA_DISPLAYCONTROLLER)) {
				$.powerTip.destroy($this);
			}

			// attempt to use title attribute text if there is no data-powertip,
			// data-powertipjq or data-powertiptarget. If we do use the title
			// attribute, delete the attribute so the browser will not show it
			title = $this.attr('title');
			if (!dataPowertip && !dataTarget && !dataElem && title) {
				$this.data(DATA_POWERTIP, title);
				$this.data(DATA_ORIGINALTITLE, title);
				$this.removeAttr('title');
			}

			// create hover controllers for each element
			$this.data(
				DATA_DISPLAYCONTROLLER,
				new DisplayController($this, options, tipController)
			);
		});

		// attach events to matched elements if the manual option is not enabled
		if (!options.manual) {
			// attach open events
			$.each(options.openEvents, function(idx, evt) {
				if ($.inArray(evt, options.closeEvents) > -1) {
					// event is in both openEvents and closeEvents, so toggle it
					targetElements.on(evt + EVENT_NAMESPACE, function elementToggle(event) {
						$.powerTip.toggle(this, event);
					});
				} else {
					targetElements.on(evt + EVENT_NAMESPACE, function elementOpen(event) {
						$.powerTip.show(this, event);
					});
				}
			});

			// attach close events
			$.each(options.closeEvents, function(idx, evt) {
				if ($.inArray(evt, options.openEvents) < 0) {
					targetElements.on(evt + EVENT_NAMESPACE, function elementClose(event) {
						// set immediate to true for any event without mouse info
						$.powerTip.hide(this, !isMouseEvent(event));
					});
				}
			});

			// attach escape key close event
			targetElements.on('keydown' + EVENT_NAMESPACE, function elementKeyDown(event) {
				// always close tooltip when the escape key is pressed
				if (event.keyCode === 27) {
					$.powerTip.hide(this, true);
				}
			});
		}

		// remember elements that the plugin is attached to
		session.elements = session.elements ? session.elements.add(targetElements) : targetElements;

		return targetElements;
	};

	/**
	 * Default options for the powerTip plugin.
	 */
	$.fn.powerTip.defaults = {
		fadeInTime: 200,
		fadeOutTime: 100,
		followMouse: false,
		popupId: 'powerTip',
		intentSensitivity: 7,
		intentPollInterval: 100,
		closeDelay: 100,
		placement: 'n',
		smartPlacement: false,
		offset: 10,
		inset: 20,
		fromCenter: 1.0,
		mouseOnToPopup: false,
		manual: false,
		openEvents: [ 'mouseenter', 'focus' ],
		closeEvents: [ 'mouseleave', 'blur' ]
	};

	/**
	 * Default smart placement priority lists.
	 * The first item in the array is the highest priority, the last is the lowest.
	 * The last item is also the default, which will be used if all previous options
	 * do not fit.
	 */
	$.fn.powerTip.smartPlacementLists = {
		n: ['n', 'ne', 'nw', 's'],
		e: ['e', 'ne', 'se', 'w', 'nw', 'sw', 'n', 's', 'e'],
		s: ['s', 'se', 'sw', 'n'],
		w: ['w', 'nw', 'sw', 'e', 'ne', 'se', 'n', 's', 'w'],
		nw: ['nw', 'w', 'sw', 'n', 's', 'se', 'nw'],
		ne: ['ne', 'e', 'se', 'n', 's', 'sw', 'ne'],
		sw: ['sw', 'w', 'nw', 's', 'n', 'ne', 'sw'],
		se: ['se', 'e', 'ne', 's', 'n', 'nw', 'se'],
		'nw-alt': ['nw-alt', 'n', 'ne-alt', 'sw-alt', 's', 'se-alt', 'w', 'e'],
		'ne-alt': ['ne-alt', 'n', 'nw-alt', 'se-alt', 's', 'sw-alt', 'e', 'w'],
		'sw-alt': ['sw-alt', 's', 'se-alt', 'nw-alt', 'n', 'ne-alt', 'w', 'e'],
		'se-alt': ['se-alt', 's', 'sw-alt', 'ne-alt', 'n', 'nw-alt', 'e', 'w']
	};

	/**
	 * Public API
	 */
	$.powerTip = {
		/**
		 * Attempts to show the tooltip for the specified element.
		 * @param {jQuery|Element} element The element to open the tooltip for.
		 * @param {jQuery.Event=} event jQuery event for hover intent and mouse
		 *     tracking (optional).
		 * @return {jQuery|Element} The original jQuery object or DOM Element.
		 */
		show: function apiShowTip(element, event) {
			// if we were supplied an event with a pageX property then it is a mouse
			// event with the information necessary to do hover intent testing
			if (isMouseEvent(event)) {
				trackMouse(event);
				session.previousX = event.pageX;
				session.previousY = event.pageY;
				$(element).data(DATA_DISPLAYCONTROLLER).show();
			} else {
				$(element).first().data(DATA_DISPLAYCONTROLLER).show(true, true);
			}
			return element;
		},

		/**
		 * Repositions the tooltip on the element.
		 * @param {jQuery|Element} element The element the tooltip is shown for.
		 * @return {jQuery|Element} The original jQuery object or DOM Element.
		 */
		reposition: function apiResetPosition(element) {
			$(element).first().data(DATA_DISPLAYCONTROLLER).resetPosition();
			return element;
		},

		/**
		 * Attempts to close any open tooltips.
		 * @param {(jQuery|Element)=} element The element with the tooltip that
		 *     should be closed (optional).
		 * @param {boolean=} immediate Disable close delay (optional).
		 * @return {jQuery|Element|undefined} The original jQuery object or DOM
		 *     Element, if one was specified.
		 */
		hide: function apiCloseTip(element, immediate) {
			var displayController;

			// set immediate to true when no element is specified
			immediate = element ? immediate : true;

			// find the relevant display controller
			if (element) {
				displayController = $(element).first().data(DATA_DISPLAYCONTROLLER);
			} else if (session.activeHover) {
				displayController = session.activeHover.data(DATA_DISPLAYCONTROLLER);
			}

			// if found, hide the tip
			if (displayController) {
				displayController.hide(immediate);
			}

			return element;
		},

		/**
		 * Toggles the tooltip for the specified element. This will open a closed
		 * tooltip, or close an open tooltip.
		 * @param {jQuery|Element} element The element with the tooltip that
		 *     should be toggled.
		 * @param {jQuery.Event=} event jQuery event for hover intent and mouse
		 *     tracking (optional).
		 * @return {jQuery|Element} The original jQuery object or DOM Element.
		 */
		toggle: function apiToggle(element, event) {
			if (session.activeHover && session.activeHover.is(element)) {
				// tooltip for element is active, so close it
				$.powerTip.hide(element, !isMouseEvent(event));
			} else {
				// tooltip for element is not active, so open it
				$.powerTip.show(element, event);
			}
			return element;
		},

		/**
		 * Destroy and roll back any powerTip() instance on the specified elements.
		 * If no elements are specified then all elements that the plugin is
		 * currently attached to will be rolled back.
		 * @param {(jQuery|Element)=} element The element with the powerTip instance.
		 * @return {jQuery|Element|undefined} The original jQuery object or DOM
		 *     Element, if one was specified.
		 */
		destroy: function apiDestroy(element) {
			var $element = element ? $(element) : session.elements;

			// if the plugin is not hooked to any elements then there is no point
			// trying to destroy anything, or dealing with the possible errors
			if (!session.elements || session.elements.length === 0) {
				return element;
			}

			// unhook events and destroy plugin changes to each element
			$element.off(EVENT_NAMESPACE).each(function destroy() {
				var $this = $(this),
					dataAttributes = [
						DATA_ORIGINALTITLE,
						DATA_DISPLAYCONTROLLER,
						DATA_HASACTIVEHOVER,
						DATA_FORCEDOPEN
					];

				// revert title attribute
				if ($this.data(DATA_ORIGINALTITLE)) {
					$this.attr('title', $this.data(DATA_ORIGINALTITLE));
					dataAttributes.push(DATA_POWERTIP);
				}

				// remove data attributes
				$this.removeData(dataAttributes);
			});

			// remove destroyed element from active elements collection
			session.elements = session.elements.not($element);

			// if there are no active elements left then we will unhook all of the
			// events that we've bound code to and remove the tooltip elements
			if (session.elements.length === 0) {
				$window.off(EVENT_NAMESPACE);
				$document.off(EVENT_NAMESPACE);
				session.mouseTrackingActive = false;
				session.tooltips.remove();
				session.tooltips = null;
			}

			return element;
		}
	};

	// API aliasing
	$.powerTip.showTip = $.powerTip.show;
	$.powerTip.closeTip = $.powerTip.hide;

	/**
	 * Creates a new CSSCoordinates object.
	 * @private
	 * @constructor
	 */
	function CSSCoordinates() {
		var me = this;

		// initialize object properties
		me.top = 'auto';
		me.left = 'auto';
		me.right = 'auto';
		me.bottom = 'auto';

		/**
		 * Set a property to a value.
		 * @private
		 * @param {string} property The name of the property.
		 * @param {number} value The value of the property.
		 */
		me.set = function(property, value) {
			if ($.isNumeric(value)) {
				me[property] = Math.round(value);
			}
		};

		/**
		 * Check if a property is set
		 * @private
		 * @param {string} property The name of the property.
		 */
		me.isSet = function(property) {
			return $.isNumeric(me[property]);
		};
	}

	/**
	 * Creates a new tooltip display controller.
	 * @private
	 * @constructor
	 * @param {jQuery} element The element that this controller will handle.
	 * @param {Object} options Options object containing settings.
	 * @param {TooltipController} tipController The TooltipController object for
	 *     this instance.
	 */
	function DisplayController(element, options, tipController) {
		var hoverTimer = null,
			myCloseDelay = null;

		/**
		 * Begins the process of showing a tooltip.
		 * @private
		 * @param {boolean=} immediate Skip intent testing (optional).
		 * @param {boolean=} forceOpen Ignore cursor position and force tooltip to
		 *     open (optional).
		 */
		function openTooltip(immediate, forceOpen) {
			cancelTimer();
			if (!element.data(DATA_HASACTIVEHOVER)) {
				if (!immediate) {
					session.tipOpenImminent = true;
					hoverTimer = setTimeout(
						function intentDelay() {
							hoverTimer = null;
							checkForIntent();
						},
						options.intentPollInterval
					);
				} else {
					if (forceOpen) {
						element.data(DATA_FORCEDOPEN, true);
					}
					tipController.showTip(element);
				}
			} else {
				// cursor left and returned to this element, cancel close
				cancelClose();
			}
		}

		/**
		 * Begins the process of closing a tooltip.
		 * @private
		 * @param {boolean=} disableDelay Disable close delay (optional).
		 */
		function closeTooltip(disableDelay) {
			cancelTimer();
			session.tipOpenImminent = false;
			if (element.data(DATA_HASACTIVEHOVER)) {
				element.data(DATA_FORCEDOPEN, false);
				if (!disableDelay) {
					session.delayInProgress = true;
					session.closeDelayTimeout = setTimeout(
						function closeDelay() {
							session.closeDelayTimeout = null;
							tipController.hideTip(element);
							session.delayInProgress = false;
							myCloseDelay = null;
						},
						options.closeDelay
					);
					// save internal reference close delay id so we can check if the
					// active close delay belongs to this instance
					myCloseDelay = session.closeDelayTimeout;
				} else {
					tipController.hideTip(element);
				}
			}
		}

		/**
		 * Checks mouse position to make sure that the user intended to hover on the
		 * specified element before showing the tooltip.
		 * @private
		 */
		function checkForIntent() {
			// calculate mouse position difference
			var xDifference = Math.abs(session.previousX - session.currentX),
				yDifference = Math.abs(session.previousY - session.currentY),
				totalDifference = xDifference + yDifference;

			// check if difference has passed the sensitivity threshold
			if (totalDifference < options.intentSensitivity) {
				cancelClose();
				tipController.showTip(element);
			} else {
				// try again
				session.previousX = session.currentX;
				session.previousY = session.currentY;
				openTooltip();
			}
		}

		/**
		 * Cancels active hover timer.
		 * @private
		 * @param {boolean=} stopClose Cancel any active close delay timer.
		 */
		function cancelTimer(stopClose) {
			hoverTimer = clearTimeout(hoverTimer);
			// cancel the current close delay if the active close delay is for this
			// element or the stopClose argument is true
			if (session.closeDelayTimeout && myCloseDelay === session.closeDelayTimeout || stopClose) {
				cancelClose();
			}
		}

		/**
		 * Cancels any active close delay timer.
		 * @private
		 */
		function cancelClose() {
			session.closeDelayTimeout = clearTimeout(session.closeDelayTimeout);
			session.delayInProgress = false;
		}

		/**
		 * Repositions the tooltip on this element.
		 * @private
		 */
		function repositionTooltip() {
			tipController.resetPosition(element);
		}

		// expose the methods
		this.show = openTooltip;
		this.hide = closeTooltip;
		this.cancel = cancelTimer;
		this.resetPosition = repositionTooltip;
	}

	/**
	 * Creates a new Placement Calculator.
	 * @private
	 * @constructor
	 */
	function PlacementCalculator() {
		/**
		 * Compute the CSS position to display a tooltip at the specified placement
		 * relative to the specified element.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 * @param {string} placement The placement for the tooltip.
		 * @param {number} tipWidth Width of the tooltip element in pixels.
		 * @param {number} tipHeight Height of the tooltip element in pixels.
		 * @param {number} options.offset Distance to offset tooltips in pixels.
		 * @param {number} options.fromCenter Distance along line from center (0) to boundary (1).
		 * @param {number} options.inset Distance from corner of tooltip to object for ne, nw, se, sw.
		 * @return {CSSCoordinates} A CSSCoordinates object with the position.
		 */
		function computePlacementCoords(element, placement, tipWidth, tipHeight, options ) {
			var placementBase = placement.split('-')[0], // ignore 'alt' for corners
				offset = options.offset,
				fromCenter = options.fromCenter,
				inset = options.inset,
				coords = new CSSCoordinates(),
				position;

			if (isSvgElement(element)) {
				position = getSvgPlacement(element, placementBase, fromCenter);
			} else {
				position = getHtmlPlacement(element, placementBase, fromCenter);
			}

			// calculate the appropriate x and y position in the document
			switch (placement) {
			case 'n':
				coords.set('left', position.left - (tipWidth / 2));
				coords.set('bottom', session.windowHeight - position.top + offset);
				break;
			case 'e':
				coords.set('left', position.left + offset);
				coords.set('top', position.top - (tipHeight / 2));
				break;
			case 's':
				coords.set('left', position.left - (tipWidth / 2));
				coords.set('top', position.top + offset);
				break;
			case 'w':
				coords.set('top', position.top - (tipHeight / 2));
				coords.set('right', session.windowWidth - position.left + offset);
				break;
			case 'nw':
				coords.set('bottom', session.windowHeight - position.top + offset);
				coords.set('right', session.windowWidth - position.left - inset);
				break;
			case 'nw-alt':
				coords.set('left', position.left);
				coords.set('bottom', session.windowHeight - position.top + offset);
				break;
			case 'ne':
				coords.set('left', position.left - inset);
				coords.set('bottom', session.windowHeight - position.top + offset);
				break;
			case 'ne-alt':
				coords.set('bottom', session.windowHeight - position.top + offset);
				coords.set('right', session.windowWidth - position.left);
				break;
			case 'sw':
				coords.set('top', position.top + offset);
				coords.set('right', session.windowWidth - position.left - inset);
				break;
			case 'sw-alt':
				coords.set('left', position.left);
				coords.set('top', position.top + offset);
				break;
			case 'se':
				coords.set('left', position.left - inset);
				coords.set('top', position.top + offset);
				break;
			case 'se-alt':
				coords.set('top', position.top + offset);
				coords.set('right', session.windowWidth - position.left);
				break;
			}

			return coords;
		}

		/**
		 * Finds the weighted average of two values
		 * @private
		 * @param {number} a the first value (returned if weight=0)
		 * @param {number} b the second value (returned if weight=1)
		 * @param {number} weight the weight (0 <= weight <= 1)
		 */
		function weightedAvg(a, b, weight) {
			return Math.round( b * weight + a * (1.0 - weight) );
		}

		/**
		 * Finds the tooltip attachment point in the document for a HTML DOM element
		 * for the specified placement.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 * @param {string} placement The placement for the tooltip.
		 * @param {number} fromCenter The relative distance between center and boundary
		 * @return {Object} An object with the top,left position values.
		 */
		function getHtmlPlacement(element, placement, fromCenter) {
			var objectOffset = element.offset(),
				objectWidth = element.outerWidth(),
				objectHeight = element.outerHeight(),
				left,
				top,
				objectCenter = {
					top: objectOffset.top + objectHeight / 2,
					left: objectOffset.left + objectWidth / 2
				};

			// calculate the appropriate x and y position in the document
			switch (placement) {
			case 'n':
				left = objectOffset.left + objectWidth / 2;
				top = objectOffset.top;
				break;
			case 'e':
				left = objectOffset.left + objectWidth;
				top = objectOffset.top + objectHeight / 2;
				break;
			case 's':
				left = objectOffset.left + objectWidth / 2;
				top = objectOffset.top + objectHeight;
				break;
			case 'w':
				left = objectOffset.left;
				top = objectOffset.top + objectHeight / 2;
				break;
			case 'nw':
				left = objectOffset.left;
				top = objectOffset.top;
				break;
			case 'ne':
				left = objectOffset.left + objectWidth;
				top = objectOffset.top;
				break;
			case 'sw':
				left = objectOffset.left;
				top = objectOffset.top + objectHeight;
				break;
			case 'se':
				left = objectOffset.left + objectWidth;
				top = objectOffset.top + objectHeight;
				break;
			}

			return {
				top: weightedAvg(objectCenter.top, top, fromCenter),
				left: weightedAvg(objectCenter.left, left, fromCenter)
			};
		}

		/**
		 * Finds the tooltip attachment point in the document for a SVG element for
		 * the specified placement.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 * @param {string} placement The placement for the tooltip.
		 * @param {number} fromCenter The relative distance between center and boundary
		 * @return {Object} An object with the top,left position values.
		 */
		function getSvgPlacement(element, placement, fromCenter) {
			var svgElement = element.closest('svg')[0],
				domElement = element[0],
				point = svgElement.createSVGPoint(),
				boundingBox = domElement.getBBox(),
				matrix = domElement.getScreenCTM(),
				halfWidth = boundingBox.width / 2,
				halfHeight = boundingBox.height / 2,
				placements = [],
				placementKeys = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'],
				coords,
							center = svgElement.createSVGPoint(),
				rotation,
				steps,
				x;

			function pushPlacement() {
				placements.push(point.matrixTransform(matrix));
			}

			// Get bounding box corners and midpoints
			point.x = boundingBox.x;
			point.y = boundingBox.y;
			center.x = point.x + halfWidth;
			center.y = point.y + halfHeight;
			center = center.matrixTransform(matrix);
			pushPlacement();
			point.x += halfWidth;
			pushPlacement();
			point.x += halfWidth;
			pushPlacement();
			point.y += halfHeight;
			pushPlacement();
			point.y += halfHeight;
			pushPlacement();
			point.x -= halfWidth;
			pushPlacement();
			point.x -= halfWidth;
			pushPlacement();
			point.y -= halfHeight;
			pushPlacement();

			// determine rotation
			if (placements[0].y !== placements[1].y || placements[0].x !== placements[7].x) {
				rotation = Math.atan2(matrix.b, matrix.a) * RAD2DEG;
				steps = Math.ceil(((rotation % 360) - 22.5) / 45);
				center = center.matrixTransform(matrix);
				if (steps < 1) {
					steps += 8;
				}
				while (steps--) {
					placementKeys.push(placementKeys.shift());
				}
			}

			// find placement
			for (x = 0; x < placements.length; x++) {
				if (placementKeys[x] === placement) {
					coords = placements[x];
					break;
				}
			}

			return {
				top: weightedAvg(center.y, coords.y, fromCenter) + session.scrollTop,
				left: weightedAvg(center.x, coords.x, fromCenter) + session.scrollLeft
			};
		}

		// expose methods
		this.compute = computePlacementCoords;
	}

	/**
	 * Creates a new tooltip controller.
	 * @private
	 * @constructor
	 * @param {Object} options Options object containing settings.
	 */
	function TooltipController(options) {
		var placementCalculator = new PlacementCalculator(),
			tipElement = $('#' + options.popupId);

		// build and append tooltip div if it does not already exist
		if (tipElement.length === 0) {
			tipElement = $('<div/>', { id: options.popupId });
			// grab body element if it was not populated when the script loaded
			// note: this hack exists solely for jsfiddle support
			if ($body.length === 0) {
				$body = $('body');
			}
			$body.append(tipElement);
			// remember the tooltip elements that the plugin has created
			session.tooltips = session.tooltips ? session.tooltips.add(tipElement) : tipElement;
		}

		// hook mousemove for cursor follow tooltips
		if (options.followMouse) {
			// only one positionTipOnCursor hook per tooltip element, please
			if (!tipElement.data(DATA_HASMOUSEMOVE)) {
				$document.on('mousemove' + EVENT_NAMESPACE, positionTipOnCursor);
				$window.on('scroll' + EVENT_NAMESPACE, positionTipOnCursor);
				tipElement.data(DATA_HASMOUSEMOVE, true);
			}
		}

		// if we want to be able to mouse onto the tooltip then we need to attach
		// hover events to the tooltip that will cancel a close request on hover and
		// start a new close request on mouseleave
		// only hook these listeners if its not in manual mode
		if (options.mouseOnToPopup && !options.manual) {
			// only one event hook per tooltip element, please
			if (!tipElement.data(DATA_HASMOUSEENTER)) {
				tipElement.on({
					mouseenter: function tipMouseEnter() {
						// we only let the mouse stay on the tooltip if it is set to
						// let users interact with it
						if (tipElement.data(DATA_MOUSEONTOTIP)) {
							// check activeHover in case the mouse cursor entered
							// the tooltip during the fadeOut and close cycle
							if (session.activeHover) {
								session.activeHover.data(DATA_DISPLAYCONTROLLER).cancel();
							}
						}
					},
					mouseleave: function tipMouseLeave() {
						// check activeHover in case the mouse cursor entered the
						// tooltip during the fadeOut and close cycle
						if (session.activeHover) {
							session.activeHover.data(DATA_DISPLAYCONTROLLER).hide();
						}
					}
				});
				tipElement.data(DATA_HASMOUSEENTER, true);
			}
		}

		/**
		 * Gives the specified element the active-hover state and queues up the
		 * showTip function.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 */
		function beginShowTip(element) {
			element.data(DATA_HASACTIVEHOVER, true);
			// show tooltip, asap
			tipElement.queue(function queueTipInit(next) {
				showTip(element);
				next();
			});
		}

		/**
		 * Shows the tooltip, as soon as possible.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 */
		function showTip(element) {
			var tipContent;

			// it is possible, especially with keyboard navigation, to move on to
			// another element with a tooltip during the queue to get to this point
			// in the code. if that happens then we need to not proceed or we may
			// have the fadeout callback for the last tooltip execute immediately
			// after this code runs, causing bugs.
			if (!element.data(DATA_HASACTIVEHOVER)) {
				return;
			}

			// if the tooltip is open and we got asked to open another one then the
			// old one is still in its fadeOut cycle, so wait and try again
			if (session.isTipOpen) {
				if (!session.isClosing) {
					hideTip(session.activeHover);
				}
				tipElement.delay(100).queue(function queueTipAgain(next) {
					showTip(element);
					next();
				});
				return;
			}

			// trigger powerTipPreRender event
			element.trigger('powerTipPreRender');

			// set tooltip content
			tipContent = getTooltipContent(element);
			if (tipContent) {
				tipElement.empty().append(tipContent);
			} else {
				// we have no content to display, give up
				return;
			}

			// trigger powerTipRender event
			element.trigger('powerTipRender');

			session.activeHover = element;
			session.isTipOpen = true;

			tipElement.data(DATA_MOUSEONTOTIP, options.mouseOnToPopup);

			// set tooltip position
			if (!options.followMouse) {
				positionTipOnElement(element);
				session.isFixedTipOpen = true;
			} else {
				positionTipOnCursor();
			}

			// close tooltip when clicking anywhere on the page, with the exception
			// of the tooltip's trigger element and any elements that are within a
			// tooltip that has 'mouseOnToPopup' option enabled
			$document.on('click' + EVENT_NAMESPACE, function documentClick(event) {
				var target = event.target;
				if (target !== element[0]) {
					if (options.mouseOnToPopup) {
						if (target !== tipElement[0] && !$.contains(tipElement[0], target)) {
							$.powerTip.hide();
						}
					} else {
						$.powerTip.hide();
					}
				}
			});

			// fadein
			tipElement.fadeIn(options.fadeInTime, function fadeInCallback() {
				// start desync polling
				if (!session.desyncTimeout) {
					session.desyncTimeout = setInterval(closeDesyncedTip, 500);
				}

				// trigger powerTipOpen event
				element.trigger('powerTipOpen');
			});
		}

		/**
		 * Hides the tooltip.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 */
		function hideTip(element) {
			// reset session
			session.isClosing = true;
			session.isTipOpen = false;

			// stop desync polling
			session.desyncTimeout = clearInterval(session.desyncTimeout);

			// reset element state
			element.data(DATA_HASACTIVEHOVER, false);
			element.data(DATA_FORCEDOPEN, false);

			// remove document click handler
			$document.off('click' + EVENT_NAMESPACE);

			// fade out
			tipElement.fadeOut(options.fadeOutTime, function fadeOutCallback() {
				var coords = new CSSCoordinates();

				// reset session and tooltip element
				session.activeHover = null;
				session.isClosing = false;
				session.isFixedTipOpen = false;
				tipElement.removeClass();

				// support mouse-follow and fixed position tips at the same time by
				// moving the tooltip to the last cursor location after it is hidden
				coords.set('top', session.currentY + options.offset);
				coords.set('left', session.currentX + options.offset);
				tipElement.css(coords);

				// trigger powerTipClose event
				element.trigger('powerTipClose');
			});
		}

		/**
		 * Moves the tooltip to the users mouse cursor.
		 * @private
		 */
		function positionTipOnCursor() {
			// to support having fixed tooltips on the same page as cursor tooltips,
			// where both instances are referencing the same tooltip element, we
			// need to keep track of the mouse position constantly, but we should
			// only set the tip location if a fixed tip is not currently open, a tip
			// open is imminent or active, and the tooltip element in question does
			// have a mouse-follow using it.
			if (!session.isFixedTipOpen && (session.isTipOpen || (session.tipOpenImminent && tipElement.data(DATA_HASMOUSEMOVE)))) {
				// grab measurements
				var tipWidth = tipElement.outerWidth(),
					tipHeight = tipElement.outerHeight(),
					coords = new CSSCoordinates(),
					collisions,
					collisionCount;

				// grab collisions
				coords.set('top', session.currentY + options.offset);
				coords.set('left', session.currentX + options.offset);
				collisions = getViewportCollisions(
					coords,
					tipWidth,
					tipHeight
				);

				// handle tooltip view port collisions
				if (collisions !== Collision.none) {
					collisionCount = countFlags(collisions);
					if (collisionCount === 1) {
						// if there is only one collision (bottom or right) then
						// simply constrain the tooltip to the view port
						if (collisions === Collision.right) {
							coords.set('left', session.windowWidth - tipWidth);
						} else if (collisions === Collision.bottom) {
							coords.set('top', session.scrollTop + session.windowHeight - tipHeight);
						}
					} else {
						// if the tooltip has more than one collision then it is
						// trapped in the corner and should be flipped to get it out
						// of the users way
						coords.set('left', session.currentX - tipWidth - options.offset);
						coords.set('top', session.currentY - tipHeight - options.offset);
					}
				}

				// position the tooltip
				tipElement.css(coords);
			}
		}

		/**
		 * Sets the tooltip to the correct position relative to the specified target
		 * element. Based on options settings.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 */
		function positionTipOnElement(element) {
			var priorityList,
				finalPlacement;

			if (options.smartPlacement) {
				priorityList = $.fn.powerTip.smartPlacementLists[options.placement];

				// iterate over the priority list and use the first placement option
				// that does not collide with the view port. if they all collide
				// then the last placement in the list will be used.
				$.each(priorityList, function(idx, pos) {
					// place tooltip and find collisions
					var collisions = getViewportCollisions(
						placeTooltip(element, pos),
						tipElement.outerWidth(),
						tipElement.outerHeight()
					);

					// update the final placement variable
					finalPlacement = pos;

					// break if there were no collisions
					if (collisions === Collision.none) {
						return false;
					}
				});
			} else {
				// if we're not going to use the smart placement feature then just
				// compute the coordinates and do it
				placeTooltip(element, options.placement);
				finalPlacement = options.placement;
			}

			// add placement as class for CSS arrows
			tipElement.addClass(finalPlacement);
		}

		/**
		 * Sets the tooltip position to the appropriate values to show the tip at
		 * the specified placement. This function will iterate and test the tooltip
		 * to support elastic tooltips.
		 * @private
		 * @param {jQuery} element The element that the tooltip should target.
		 * @param {string} placement The placement for the tooltip.
		 * @return {CSSCoordinates} A CSSCoordinates object with the top, left, and
		 *     right position values.
		 */
		function placeTooltip(element, placement) {
			var iterationCount = 0,
				tipWidth,
				tipHeight,
				coords = new CSSCoordinates();

			// set the tip to 0,0 to get the full expanded width
			coords.set('top', 0);
			coords.set('left', 0);
			tipElement.css(coords);

			// to support elastic tooltips we need to check for a change in the
			// rendered dimensions after the tooltip has been positioned
			do {
				// grab the current tip dimensions
				tipWidth = tipElement.outerWidth();
				tipHeight = tipElement.outerHeight();

				// get placement coordinates
				coords = placementCalculator.compute(
					element,
					placement,
					tipWidth,
					tipHeight,
					options
				);

				// place the tooltip
				tipElement.css(coords);
			} while (
				// sanity check: limit to 5 iterations, and...
				++iterationCount <= 5 &&
				// try again if the dimensions changed after placement
				(tipWidth !== tipElement.outerWidth() || tipHeight !== tipElement.outerHeight())
			);

			return coords;
		}

		/**
		 * Checks for a tooltip desync and closes the tooltip if one occurs.
		 * @private
		 */
		function closeDesyncedTip() {
			var isDesynced = false;
			// It is possible for the mouse cursor to leave an element without
			// firing the mouseleave or blur event. This most commonly happens when
			// the element is disabled under mouse cursor. If this happens it will
			// result in a desynced tooltip because the tooltip was never asked to
			// close. So we should periodically check for a desync situation and
			// close the tip if such a situation arises.
			if (session.isTipOpen && !session.isClosing && !session.delayInProgress && ($.inArray('mouseleave', options.closeEvents) > -1 || $.inArray('mouseout', options.closeEvents) > -1 || $.inArray('blur', options.closeEvents) > -1 || $.inArray('focusout', options.closeEvents) > -1)) {
				// user moused onto another tip or active hover is disabled
				if (session.activeHover.data(DATA_HASACTIVEHOVER) === false || session.activeHover.is(':disabled')) {
					isDesynced = true;
				} else {
					// hanging tip - have to test if mouse position is not over the
					// active hover and not over a tooltip set to let the user
					// interact with it.
					// for keyboard navigation: this only counts if the element does
					// not have focus.
					// for tooltips opened via the api: we need to check if it has
					// the forcedOpen flag.
					if (!isMouseOver(session.activeHover) && !session.activeHover.is(':focus') && !session.activeHover.data(DATA_FORCEDOPEN)) {
						if (tipElement.data(DATA_MOUSEONTOTIP)) {
							if (!isMouseOver(tipElement)) {
								isDesynced = true;
							}
						} else {
							isDesynced = true;
						}
					}
				}

				if (isDesynced) {
					// close the desynced tip
					hideTip(session.activeHover);
				}
			}
		}

		// expose methods
		this.showTip = beginShowTip;
		this.hideTip = hideTip;
		this.resetPosition = positionTipOnElement;
	}

	/**
	 * Determine whether a jQuery object is an SVG element
	 * @private
	 * @param {jQuery} element The element to check
	 * @return {boolean} Whether this is an SVG element
	 */
	function isSvgElement(element) {
		return !!window.SVGElement && element[0] instanceof SVGElement;
	}

	/**
	 * Determines if the specified jQuery.Event object has mouse data.
	 * @private
	 * @param {jQuery.Event=} event The jQuery.Event object to test.
	 * @return {boolean} True if there is mouse data, otherwise false.
	 */
	function isMouseEvent(event) {
		return !!event && typeof event.pageX === 'number';
	}

	/**
	 * Initializes the viewport dimension cache and hooks up the mouse position
	 * tracking and viewport dimension tracking events.
	 * Prevents attaching the events more than once.
	 * @private
	 */
	function initTracking() {
		if (!session.mouseTrackingActive) {
			session.mouseTrackingActive = true;

			// grab the current viewport dimensions on load
			getViewportDimensions();
			$(getViewportDimensions);

			// hook mouse move tracking
			$document.on('mousemove' + EVENT_NAMESPACE, trackMouse);

			// hook viewport dimensions tracking
			$window.on('resize' + EVENT_NAMESPACE, trackResize);
			$window.on('scroll' + EVENT_NAMESPACE, trackScroll);
		}
	}

	/**
	 * Updates the viewport dimensions cache.
	 * @private
	 */
	function getViewportDimensions() {
		session.scrollLeft = $window.scrollLeft();
		session.scrollTop = $window.scrollTop();
		session.windowWidth = $window.width();
		session.windowHeight = $window.height();
	}

	/**
	 * Updates the window size info in the viewport dimensions cache.
	 * @private
	 */
	function trackResize() {
		session.windowWidth = $window.width();
		session.windowHeight = $window.height();
	}

	/**
	 * Updates the scroll offset info in the viewport dimensions cache.
	 * @private
	 */
	function trackScroll() {
		var x = $window.scrollLeft(),
			y = $window.scrollTop();
		if (x !== session.scrollLeft) {
			session.currentX += x - session.scrollLeft;
			session.scrollLeft = x;
		}
		if (y !== session.scrollTop) {
			session.currentY += y - session.scrollTop;
			session.scrollTop = y;
		}
	}

	/**
	 * Saves the current mouse coordinates to the session object.
	 * @private
	 * @param {jQuery.Event} event The mousemove event for the document.
	 */
	function trackMouse(event) {
		session.currentX = event.pageX;
		session.currentY = event.pageY;
	}

	/**
	 * Tests if the mouse is currently over the specified element.
	 * @private
	 * @param {jQuery} element The element to check for hover.
	 * @return {boolean}
	 */
	function isMouseOver(element) {
		// use getBoundingClientRect() because jQuery's width() and height()
		// methods do not work with SVG elements
		// compute width/height because those properties do not exist on the object
		// returned by getBoundingClientRect() in older versions of IE
		var elementPosition = element.offset(),
			elementBox = element[0].getBoundingClientRect(),
			elementWidth = elementBox.right - elementBox.left,
			elementHeight = elementBox.bottom - elementBox.top;

		return session.currentX >= elementPosition.left &&
			session.currentX <= elementPosition.left + elementWidth &&
			session.currentY >= elementPosition.top &&
			session.currentY <= elementPosition.top + elementHeight;
	}

	/**
	 * Fetches the tooltip content from the specified element's data attributes.
	 * @private
	 * @param {jQuery} element The element to get the tooltip content for.
	 * @return {(string|jQuery|undefined)} The text/HTML string, jQuery object, or
	 *     undefined if there was no tooltip content for the element.
	 */
	function getTooltipContent(element) {
		var tipText = element.data(DATA_POWERTIP),
			tipObject = element.data(DATA_POWERTIPJQ),
			tipTarget = element.data(DATA_POWERTIPTARGET),
			targetElement,
			content;

		if (tipText) {
			if ($.isFunction(tipText)) {
				tipText = tipText.call(element[0]);
			}
			content = tipText;
		} else if (tipObject) {
			if ($.isFunction(tipObject)) {
				tipObject = tipObject.call(element[0]);
			}
			if (tipObject.length > 0) {
				content = tipObject.clone(true, true);
			}
		} else if (tipTarget) {
			targetElement = $('#' + tipTarget);
			if (targetElement.length > 0) {
				content = targetElement.html();
			}
		}

		return content;
	}

	/**
	 * Finds any viewport collisions that an element (the tooltip) would have if it
	 * were absolutely positioned at the specified coordinates.
	 * @private
	 * @param {CSSCoordinates} coords Coordinates for the element.
	 * @param {number} elementWidth Width of the element in pixels.
	 * @param {number} elementHeight Height of the element in pixels.
	 * @return {number} Value with the collision flags.
	 */
	function getViewportCollisions(coords, elementWidth, elementHeight) {
		var viewportTop = session.scrollTop,
			viewportLeft =  session.scrollLeft,
			viewportBottom = viewportTop + session.windowHeight,
			viewportRight = viewportLeft + session.windowWidth,
			collisions = Collision.none;

		if (coords.top < viewportTop || Math.abs(coords.bottom - session.windowHeight) - elementHeight < viewportTop) {
			collisions |= Collision.top;
		}
		if (coords.top + elementHeight > viewportBottom || Math.abs(coords.bottom - session.windowHeight) > viewportBottom) {
			collisions |= Collision.bottom;
		}
		if (coords.left < viewportLeft || coords.right + elementWidth > viewportRight) {
			collisions |= Collision.left;
		}
		if (coords.left + elementWidth > viewportRight || coords.right < viewportLeft) {
			collisions |= Collision.right;
		}

		return collisions;
	}

	/**
	 * Counts the number of bits set on a flags value.
	 * @param {number} value The flags value.
	 * @return {number} The number of bits that have been set.
	 */
	function countFlags(value) {
		var count = 0;
		while (value) {
			value &= value - 1;
			count++;
		}
		return count;
	}

}));
// http://davidwalsh.name/vendor-prefix
//

var prefix = (function () {
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('') 
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  return {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();
/*global jQuery */
/*jshint multistr:true browser:true */
/*!
* FitVids 1.0.3
*
* Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
* Date: Thu Sept 01 18:00:00 2011 -0500
*/


(function( $ ){

  "use strict";

  $.fn.fitVids = function( options ) {
    var settings = {
      customSelector: null
    };

    if(!document.getElementById('fit-vids-style')) {

      var div = document.createElement('div'),
          ref = document.getElementsByTagName('base')[0] || document.getElementsByTagName('script')[0],
          cssStyles = '&shy;<style>.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:12.5%;width:75%;height:75%;}</style>';

      div.className = 'fit-vids-style';
      div.id = 'fit-vids-style';
      div.style.display = 'none';
      div.innerHTML = cssStyles;

      ref.parentNode.insertBefore(div,ref);

    }

    if ( options ) {
      $.extend( settings, options );
    }

    return this.each(function(){
      var selectors = [
        "iframe[src*='player.vimeo.com']",
        "iframe[src*='youtube.com']",
        "iframe[src*='youtube-nocookie.com']",
        "iframe[src*='kickstarter.com'][src*='video.html']",
        "object",
        "embed"
      ];

      if (settings.customSelector) {
        selectors.push(settings.customSelector);
      }

      var $allVideos = $(this).find(selectors.join(','));
      $allVideos = $allVideos.not("object object"); // SwfObj conflict patch

      $allVideos.each(function(){
        var $this = $(this);
        if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
        var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
            width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
            aspectRatio = height / width;
        if(!$this.attr('id')){
          var videoID = 'fitvid' + Math.floor(Math.random()*999999);
          $this.attr('id', videoID);
        }
        $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+"%");
        $this.removeAttr('height').removeAttr('width');
      });
    });
  };
// Works with either jQuery or Zepto
})( window.jQuery || window.Zepto );
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
(function() {
  Alongslide.prototype.Parser = (function() {
    Parser.prototype.backgrounds = [];

    Parser.prototype.flowNames = [];

    function Parser(options) {
      this.source = options.source;
      this.preprocessSource();
    }

    Parser.prototype.preprocessSource = function() {
      return (this.source.find(".alongslide:empty")).text("[ALS]");
    };

    Parser.prototype.parse = function() {
      var footnotes, panels;
      this.sourceLength = 0;
      panels = this.collectPanels();
      footnotes = this.collectFootnotes();
      this.collectSections();
      return {
        flowNames: this.flowNames,
        backgrounds: this.backgrounds,
        panels: panels,
        footnotes: footnotes,
        sourceLength: this.sourceLength
      };
    };

    Parser.prototype.collectPanels = function() {
      var rawPanels;
      rawPanels = this.source.find('.alongslide.show.panel');
      return _.object(_.map(rawPanels, function(el) {
        var $el, panelEl, panelId;
        $el = $(el);
        panelId = $el.data('alongslide-id');
        panelEl = $el.clone().removeClass('show');
        $el.empty().removeClass('panel');
        return [panelId, panelEl];
      }));
    };

    Parser.prototype.collectSections = function() {
      var _this = this;
      this.source.find('.alongslide.enter.section').each(function(index, directiveElement) {
        var directive, exitSelector, id, lastSectionContents, sectionContents;
        directive = $(directiveElement);
        id = directive.data('alongslide-id');
        exitSelector = '.alongslide.exit.section[data-alongslide-id=' + id + ']';
        lastSectionContents = directive.prevAll().detach().get().reverse();
        if (lastSectionContents.length) {
          _this.buildSection(lastSectionContents, directive);
        }
        sectionContents = directive.nextUntil(exitSelector).detach();
        _this.buildSection(sectionContents, directive, id);
        directive.remove();
        return (_this.source.find(exitSelector)).remove();
      });
      if (!this.source.is(':empty')) {
        return this.buildSection(this.source.children());
      }
    };

    Parser.prototype.buildSection = function(content, directive, id) {
      var background, flowName, idElement, section;
      flowName = id || ("sectionFlow" + this.flowNames.length);
      idElement = (directive != null ? directive.removeClass('alongslide').empty().removeClass('enter') : void 0) || $("<div/>");
      idElement.attr('data-alongslide-id', flowName);
      section = idElement.clone().append(content);
      this.sourceLength += section.text().length;
      document.namedFlows.get(flowName).addContent(section.get(0));
      this.flowNames.push(flowName);
      if (id != null) {
        background = idElement.clone().addClass('background frame').html("&nbsp;");
        return this.backgrounds.push(background);
      }
    };

    Parser.prototype.collectFootnotes = function() {
      var footnotesWrapper, rawFootnotes;
      footnotesWrapper = this.source.find('.footnotes:last-child').remove();
      if (!footnotesWrapper.length) {
        return {};
      }
      rawFootnotes = footnotesWrapper.find('ol li');
      return _.object(_.map(rawFootnotes, function(el) {
        var $footnoteEl, footnoteId;
        $footnoteEl = $(el);
        footnoteId = $footnoteEl.attr('id');
        return [footnoteId, $footnoteEl];
      }));
    };

    return Parser;

  })();

}).call(this);
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
(function() {


}).call(this);
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
(function() {
  var ALONGSLIDE_QUERIES, DEBOUNCE_RESIZE_MS, MARGIN_TOP_PX, MIN_WIDTH_PX, READABILITY_QUERIES, doLayout, flattenContentToSource, matchAlongslide, matchReadability;

  READABILITY_QUERIES = ["screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : portrait)", "screen and (max-width: 568px)"];

  ALONGSLIDE_QUERIES = ["screen and (min-width:569px)"];

  MIN_WIDTH_PX = 980;

  MARGIN_TOP_PX = 35;

  DEBOUNCE_RESIZE_MS = 250;

  /* 
  Called when all web fonts are loaded.
    
  See webfonts.coffee.
  
  Next in line of asynchronous chain of load events: load styles.
  Then check screen resolution, and kick off initial ALS render.
  */


  $(document).on('webfonts.loaded', function(e) {
    return Styles.prototype.doLoad(function() {
      console.log("Loaded styles.");
      flattenContentToSource();
      $('style.custom').remove().appendTo('body');
      _.each(READABILITY_QUERIES, function(query) {
        return enquire.register(query, {
          match: matchReadability,
          unmatch: function() {
            return location.reload();
          }
        });
      });
      return _.each(ALONGSLIDE_QUERIES, function(query) {
        return enquire.register("screen and (min-width:569px)", {
          match: matchAlongslide,
          unmatch: function() {
            return location.reload();
          }
        });
      });
    });
  });

  matchReadability = function() {
    var raw;
    $('body').addClass('readability');
    raw = $('#source').html();
    return $('#content-display').html(raw);
  };

  matchAlongslide = function() {
    window.alongslide = new Alongslide({
      source: '#content .raw',
      to: '#frames',
      regionCls: 'column'
    });
    return doLayout();
  };

  /* 
  Flattens and copies '#content .raw' to '#source'.
  All block elements are removed for both print and readability modes.
  */


  flattenContentToSource = function() {
    var source;
    source = $('#source').find('h1,h2,h3,h4,h5,h6,blockquote,p,a,img');
    source = _.map(source, function(el) {
      return el.outerHTML;
    });
    source = _.reduce(source, function(memo, el) {
      return memo.concat(el);
    });
    return $('#source').html(source);
  };

  /*
  Do render, on page load and again on resize.
  
  @param lite - if true, don't do full re-render, just the computationally
    cheap 'refresh'
  */


  doLayout = function(lite) {
    var frameAspect;
    Loader.prototype.show(lite);
    frameAspect = FixedAspect.prototype.fitFrame(MIN_WIDTH_PX, MARGIN_TOP_PX);
    if (!lite) {
      return window.alongslide.render(frameAspect, function() {
        FixedAspect.prototype.fitPanels(frameAspect);
        return Loader.prototype.hide();
      });
    } else {
      window.alongslide.refresh(frameAspect);
      return FixedAspect.prototype.fitPanels(frameAspect);
    }
  };

  /*
  Resize handler.
   
  Do a 'lite' refresh--and set a timer to debounce user resize events
  so we only re-render once, after an interval.
  */


  $(window).resize(function() {
    doLayout(true);
    clearTimeout(window.renderTimeout);
    return window.renderTimeout = setTimeout((function() {
      return doLayout();
    }), DEBOUNCE_RESIZE_MS);
  });

  window.grid_mode = "project";

  $(document).on('alongslide.progress', function(e, progress) {
    return Loader.prototype.updateSecondaryProgress(progress);
  });

  $(function() {
    $('#frames').click(function() {
      return $('#markdown-source').removeClass('on');
    });
    return $('#markdown-source a.close').click(function() {
      $('#markdown-source').removeClass('on');
      return false;
    });
  });

  $(document).on('alongslide.ready', function(e, frames) {
    return $(frames).find('.panel[data-alongslide-id=footer] a').click(function() {
      $('#markdown-source').addClass('on');
      return false;
    });
  });

}).call(this);
