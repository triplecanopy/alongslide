# 
# parser.coffee: parse raw HTML into Alongslide types: sections, panels, etc. 
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Author Adam Florin

class Alongslide::Parser

  # Store names of flows here as we create them.
  # 
  # sections: []
  backgrounds: []
  flowNames: []

  constructor: (options) ->
    {@source} = options
    @preprocessSource()

  # 
  # 
  preprocessSource: ->
    # Put dummy content inside empty directives as CSSRegions trims any empty
    # elements found near the boundaries of a region.
    (@source.find ".alongslide:empty").text("[ALS]")

  # Parser entrypoint.
  # 
  # Build sections and store them directly as CSSRegions named flows.
  # 
  # Retun panels and footnotes, which will be needed by other components.
  # 
  # Note! Parse order matters! Sections should go last, once all non-section
  # material has been scraped out of @source.
  # 
  parse: ->
    @sourceLength = 0

    panels = @collectPanels()
    footnotes = @collectFootnotes()
    @collectSections()

    flowNames: @flowNames
    backgrounds: @backgrounds
    panels: panels
    footnotes: footnotes
    sourceLength: @sourceLength

  # 
  # 
  collectPanels: ->
    rawPanels = @source.find('.alongslide.show.panel')

    _.object _.map rawPanels, (el) ->
      $el = $(el)
      panelId = $el.data('alongslide-id')
      panelEl = $el.clone().removeClass('show')

      # Cleanup
      $el.empty().removeClass('panel')

      return [ panelId, panelEl ]

  # Sift through passed-in sections, delineating them based on `enter` and `exit`
  # directives, then assigning each to a flow.
  # 
  collectSections: ->
    @source.find('.alongslide.enter.section').each (index, directiveElement) =>
      directive = $(directiveElement)
      id = directive.data('alongslide-id')
      exitSelector = '.alongslide.exit.section[data-alongslide-id='+id+']'

      # build section for content BEFORE section enter
      lastSectionContents = directive.prevAll().detach().get().reverse()
      @buildSection(lastSectionContents, directive) if lastSectionContents.length

      # build section for content AFTER section enter
      sectionContents = directive.nextUntil(exitSelector).detach()
      @buildSection(sectionContents, directive, id)

      # cleanup section build process
      directive.remove()
      (@source.find exitSelector).remove()

    @buildSection @source.children() unless @source.is(':empty')

  # Build section, given content.
  # 
  # Create new NamedFlow for it, and log the name.
  # 
  # Create section background.
  # 
  # @param content - jQuery object of section contents
  # @param directive (optional) - directive which specified the section
  # @param id (optional) - Alongslide section ID
  # 
  buildSection: (content, directive, id) ->
    flowName = id || "sectionFlow#{@flowNames.length}"

    idElement = directive?.removeClass('alongslide').empty().removeClass('enter') || $("<div/>")
    idElement.attr('data-alongslide-id', flowName)

    # create section
    section = idElement.clone().append(content)

    # tally up length
    @sourceLength += section.text().length

    # create NamedFlow
    document.namedFlows.get(flowName).addContent(section.get(0))
    @flowNames.push flowName

    # create background if ID is specified
    if id?
      background = idElement.clone().addClass('background frame').html("&nbsp;")
      @backgrounds.push(background)

  # Search for footntes as formatted by Redcarpet's footnotes callback
  # 
  # Each has an ID of the form `fn1`, which corresponds to the links in the
  # footnote references.
  # 
  # Returns a DOM node whose child elements are footnote definitions and removes the generated footnotes from DOM
  collectFootnotes: ->
    @source.find('.als-footnotes:last')
           .remove()
