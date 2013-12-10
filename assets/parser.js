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
