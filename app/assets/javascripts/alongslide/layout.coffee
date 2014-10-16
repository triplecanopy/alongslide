# 
# alongslide.coffee: Re-format HTML into horizontally-scrolling elements
# which scroll at different rates.
# 
# Use CSS Regions polyfill for text flowing, and skrollr for scroll positioning.
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Authors Adam Florin & Anthony Tran
# 
class Alongslide::Layout

  # For parsing pinned panel directives.
  # 
  HORIZONTAL_EDGES: ["left", "right"]
  VERTICAL_EDGES: ["top", "bottom"]
  EDGES: @::HORIZONTAL_EDGES.concat @::VERTICAL_EDGES
  SIZES: ["one-third", "half", "two-thirds"]
  ALIGNMENTS: @::EDGES.concat 'fullscreen'

  # Keys to ALS position data attributes
  IN_POINT_KEY: 'als-in-position'
  OUT_POINT_KEY: 'als-out-position'

  # Corresponds to $fixed-frame-width in alongslide.sass
  FRAME_WIDTH: 980

  # Pixel width of each frame == screen width.
  # 
  frameWidth: $(window).width()

  # Switch to true for verbose debugging. Plus constants for indent level.
  # 
  debug: false
  SUPER_FRAME_LEVEL: 1
  FRAME_LEVEL: 2
  SUB_FRAME_LEVEL: 3
  
  # 
  # 
  constructor: (options = {}) ->
    {@frames, @flowNames, @backgrounds, @panels, @regionCls, @sourceLength} = options

  # Main entrypoint for asynchronous chain of render calls.
  # 
  # @param postRenderCallback - to be called when layout is 100% complete
  # 
  render: (@postRenderCallback) ->
    @reset()
    @writeBackgrounds()
    @layout()
  
  # Flow text into columns, using regionFlow as a CSS regions polyfill.
  # 
  # Loop through each flow (= section), then each frame, then each column.
  # 
  # This is all done asynchronously so that DOM can update itself periodically
  # (namely for layout progress updates).
  # 
  layout: =>
    @startTime = new Date
    @log "Beginning layout"

    @currentFlowIndex = 0

    # kick off asynchronous render
    @renderSection()

  # Render one section (a.k.a. one "flow" in CSSRegions parlance),
  # one frame at a time, asynchronously.
  # 
  renderSection: ->
    flowName = @flowNames[@currentFlowIndex]

    @log "Laying out section \"#{flowName}\"", @SUPER_FRAME_LEVEL
    background = @findBackground(flowName)
    @setPositionOf background, to: @nextFramePosition() if background.length
    background.addClass('unstaged')

    # Reset section index before building another section
    @currentSectionFlowIndex = 0

    @renderFrame(flowName)

  # Render one frame and its containing columns.
  # 
  # When frame is done, trigger (asynchronously) either next frame or next section.
  # 
  # Note that normally we check _second-to-last_ column for directives,
  # as last column contains overflow. Once flow is complete, though,
  # check the last column--and remove it if it contains nothing but directives.
  # 
  renderFrame: (flowName, frame, lastColumn) ->
    frame = @findOrBuildNextFlowFrame frame

    # for each column in frame
    while frame.find('.'+@regionCls).length < @numFrameColumns(frame)
      column = @buildRegion frame, flowName

      # Give each section flow an index
      @currentSectionFlowIndex++
      column.find('.section').attr('data-section-flow-idx', @currentSectionFlowIndex)

      # Move three-columns class from .section to .frame
      hasThreeColumns = (column.children('.three-columns').length)
      if hasThreeColumns
        column.find('.section').removeClass('three-columns')
        column.parent().addClass('three-columns')

      # Process N-1 column (as current column still total text overflow of
      # the entire section).
      if lastColumn?
        @checkForOrphans lastColumn
        @updateProgress lastColumn
        @checkForDirectives lastColumn

      # Section is complete. Current column is the last column of the
      # section (no longer the overflow column).
      if @flowComplete(flowName)
        @updateProgress column
        @checkForDirectives column, true
        @checkForEmpties column

        # render next section, or complete render.
        @currentFlowIndex++
        unless @currentFlowIndex is @flowNames.length
          background = @findBackground(flowName)
          @setPositionOf background, until: @lastFramePosition() if background.length
          setTimeout((=> @renderSection()), 1)
        else
          @log "Layout complete"
          @reorder()
          @index()
          @frames.children('.flow').find('.frame').addClass('unstaged')
          @postRenderCallback(@lastFramePosition())
        return

      lastColumn = column

    # unstage earlier frames
    frame.prevAll().addClass('unstaged')

    # render next frame
    setTimeout((=> @renderFrame(flowName, frame, lastColumn)), 1)

  # Check the last "fit" column for any special directives (CSS classes).
  # 
  # The last "fit" column is the last one that doesn't also contain all the
  # overflow to be laid out in other columns--typically the second-to-last column.
  # 
  # Then, having found a directive, parse the classes and act accordingly.
  # 
  # NOTE that this method also takes responsibility for creating the appropriate
  # next frame for text to flow in. It doesn't need to return it, however,
  # as the caller will just use `findOrBuildNextFlowFrame` to check for it.
  # 
  # @param column - jQuery element to scan for directives
  # @param layoutComplete - true if this flow has been completely laid out
  #   (and therefore no new flowing regions should be created)
  # 
  checkForDirectives: (column, layoutComplete) ->
    # for each directive
    (column.find ".alongslide").each (index, directiveElement) =>
      directive = $(directiveElement).detach()
      id = directive.data('alongslide-id')

      # the column's frame may have changed (if specified by previous directive)
      flowFrame = column.parent('.frame')

      switch
        # new panel
        when directive.hasClass "show"

          # build next flow frame (if there is one)
          unless layoutComplete
            nextFlowFrame = @findOrBuildNextFlowFrame flowFrame
          nextFlowFramePosition = if nextFlowFrame
            @getPositionOf(nextFlowFrame)
          else
            @nextFramePosition()

          # build panel
          panelPosition = if directive.hasClass("now")
            @getPositionOf(flowFrame)
          else
            nextFlowFramePosition
          panelFrame = @buildPanel id, panelPosition

          @updateProgress(panelFrame)

          switch

            # pinned panel layout
            when directive.hasClass "pin"
              # display forever (until unpinned)
              @setPositionOf panelFrame, until: -1

              # which frames need to have classes set--next and/or current?
              framesWithPinnedPanels = _.compact [
                flowFrame if directive.hasClass("now"),
                nextFlowFrame]
              
              # set frame classes--pushing columns into subsequent frames if necessary
              _.each framesWithPinnedPanels, (frame) =>
                @log "Applying with-pinned-panel styles to flow frame at " +
                  "#{@getPositionOf frame}", @SUB_FRAME_LEVEL
                frame.addClass @withPinnedClass(directive)
                frame.addClass @withSizedClass(directive)
                while frame.find('.'+@regionCls).length > @numFrameColumns frame
                  pushToFrame = @findOrBuildNextFlowFrame frame
                  @log "Pushing last column of flow frame at #{@getPositionOf frame} " +
                    "to flow frame at #{@getPositionOf pushToFrame}", @SUB_FRAME_LEVEL
                  frame.find('.'+@regionCls).last().detach().prependTo(pushToFrame)

              # If we changed this frame's layout, re-flow this whole section's
              # regions.
              if directive.hasClass("now")
                sectionId = flowFrame.data('als-section-id')
                @frames.children('.flow').find(".frame[data-als-section-id=#{sectionId}]").removeClass('unstaged')
                document.namedFlows.get(sectionId).reFlow()

            # fullscreen panel layout
            when directive.hasClass "fullscreen"
              if directive.hasClass "now"
                @setPositionOf flowFrame, to: nextFlowFramePosition

              if nextFlowFrame?
                @setPositionOf nextFlowFrame, to: nextFlowFramePosition + 1
        
        # unpin pinned panel
        when directive.hasClass "unpin"
          panelFrame = @findPanel(id)
          
          unless panelFrame.length == 0
            @setPositionOf panelFrame, until:
              if layoutComplete
                @nextFramePosition() - 1
              else
                Math.max @getPositionOf(flowFrame), @getPositionOf(panelFrame)

            # unset frame classes for first flow frame after panel (may be next-next frame)
            unless layoutComplete
              postPanelFlowFrame = @findOrBuildNextFlowFrame flowFrame
              if @getPositionOf(postPanelFlowFrame) is @getPositionOf(panelFrame)
                postPanelFlowFrame = @findOrBuildNextFlowFrame postPanelFlowFrame
              postPanelFlowFrame.removeClass @withPinnedClass(panelFrame)
              postPanelFlowFrame.removeClass @withSizedClass(panelFrame)

  # If column contains nothing other than directives, remove it.
  # 
  # Called only when a section has been fully laid out.
  # 
  # Do the test on a clone, so we don't strip directives from actual column,
  # which will still be checked by checkForDirectives.
  # 
  # If column's frame is empty, remove that, too.
  # 
  checkForEmpties: (column) ->
    columnClone = column.clone()
    columnClone.find(".alongslide").detach()
    if @isEmpty columnClone
      columnFrame = column.parent('.frame')
      @log "Removing empty column from flow frame at " +
        "#{@getPositionOf columnFrame}", @SUB_FRAME_LEVEL
      column.detach()

      # Reset entire section layout, as regionFlow has kept a record of this column
      document.namedFlows.get(columnFrame.data('als-section-id')).resetRegions()

      # destroy column frame if it's empty, too
      @destroyFlowFrame columnFrame if @isEmpty columnFrame

    # while we're at it, check if any empty frames were created (probably at the end)
    @frames.children('.flow').find('.frame:empty').each (index, frame) =>
      @destroyFlowFrame $(frame)
  
  # Check for orphaned content. This can take many forms, so this method will
  # grow and evolve as cases emerge.
  # 
  checkForOrphans: (column) ->
    # If column ends with a header, push it to the overflow column.
    column.find(':last:header').detach().prependTo($('.'+@regionCls+':last'))

  # Given a flow frame, find the next in line after it--or create one if none exists.
  # 
  findOrBuildNextFlowFrame: (lastFrame) ->
    nextFlowFrame = if lastFrame?.length then lastFrame.next('.frame')
    unless nextFlowFrame?.length
      nextFlowFrame = @buildFlowFrame lastFrame
    return nextFlowFrame

  # Build one frame to hold columns of flowing text.
  # 
  # Only build new frame if there are none. Otherwise, clone the last one.
  # 
  buildFlowFrame: (lastFrame) ->
    position = if lastFrame?.length
      @getPositionOf(lastFrame) + 1
    else
      @nextFramePosition()
    @log "Building flow frame at #{position}", @FRAME_LEVEL
    frame = if lastFrame?.length
      lastFrame?.clone().empty()
    else
      $('<div class="frame"/>')
    frame.appendTo @frames.children('.flow')
    @setPositionOf frame, to: position

  # Destroy frame, shifting any subsequent panels up by one.
  # 
  destroyFlowFrame: (frame) ->
    @log "Destroying flow frame at #{@getPositionOf frame}", @FRAME_LEVEL
    frame.detach()
    @frames.children('.panels').find('.panel.frame').each (index, panel) =>
      panelPosition = $(panel).data(@IN_POINT_KEY)
      if panelPosition > frame.data(@IN_POINT_KEY)
        @log "Moving panel \"#{$(panel).data('alongslide-id')}\" at " +
          "#{panelPosition} to #{panelPosition-1}", @FRAME_LEVEL
        $(panel).data(@IN_POINT_KEY, panelPosition-1)

  # Create region to receive flowing text (column). Return jQuery object.
  #
  buildRegion: (frame, flowName) ->
    @log "Building column in flow frame at #{@getPositionOf frame}", @SUB_FRAME_LEVEL
    region = $('<div/>').addClass(@regionCls)
    frame.attr('data-als-section-id', flowName)
    region.appendTo frame
    document.namedFlows.get(flowName).addRegion(region.get(0))
    return region

  # Pull panel element out of @panels storage, apply its transition, and
  # append to DOM!
  # 
  # @param id - Alongslide panel ID
  # 
  buildPanel: (id, position) ->
    panel = @panels[id].clone().addClass('unstaged').show()
    alignment = _.filter @ALIGNMENTS, (alignment) -> panel.hasClass(alignment)
    @log "Building #{alignment} panel frame \"#{id}\" at position #{position}", @FRAME_LEVEL
    panel.addClass('frame')
    panel.appendTo @frames.children('.panels')
    @setPositionOf panel, to: position
    return panel

  # Destroy all previously laid out content.
  # 
  reset: ->
    @laidOutLength = 0

    @frames.find('.backgrounds').empty()
    @frames.find('.flow').empty()
    @frames.find('.panels').empty()
    
    # remove regionFlows' internal record of regions we just destroyed
    _.each document.namedFlows.namedFlows, (flow) -> flow.resetRegions()

  # Write the given array of backgrounds to the DOM.
  # 
  writeBackgrounds: ->
    for background in @backgrounds
      @frames.find('.backgrounds').append(background.clone())

  # Set frame start/end position.
  # 
  # @param options
  #   to: in point (= start position)
  #   until: out point (= end position)
  # 
  setPositionOf: (frame, options={}) ->
    frameType = frame.parent().get(0).className
    if options.to?
      if (currentFramePosition = @getPositionOf frame)?
        @log "Moving #{frameType} frame at #{currentFramePosition} to " +
          "#{options.to}", @SUB_FRAME_LEVEL
      frame.data @IN_POINT_KEY, options.to
    if options.until?
      @log "Dismissing #{frameType} frame \"#{frame.data('alongslide-id')}\" " +
        "at #{options.until}", @SUB_FRAME_LEVEL
      frame.data @OUT_POINT_KEY, options.until
    return frame

  # Return start position.
  # 
  getPositionOf: (frame) ->
    frame.data(@IN_POINT_KEY)

  # What position the _next_ (as yet unrendered) frame should be at.
  # 
  nextFramePosition: ->
    framePosition = @lastFramePosition()
    if framePosition? then framePosition + 1 else 0

  # Return the largest frame number of all frames.
  # 
  lastFramePosition: ->
    flowsAndPanels = @frames.children('.flow, .panels').find('.frame')
    allFramePositions = _(flowsAndPanels).map (frame) => @getPositionOf $(frame)
    return if allFramePositions.length then Math.max(allFramePositions...)

  # Certain frame CSS classes limit the number of columns allowed
  # per flow frame.
  # 
  numFrameColumns: (frame) ->
    numColumns = if frame.hasClass('three-columns') then 3 else 2
    numColumns -= 1 if @isWithHorizontalPanel(frame)
    numColumns -= 1 if frame.hasClass('three-columns') and frame.hasClass("with-panel-sized-two-thirds")
    return numColumns

  # Once render is done, build relevant indices for later lookup.
  # 
  index: ->
    @panelIndex = {}
    @frames.children('.panels').find('.panel.frame').each (index, panel) =>
      outPosition = $(panel).data(@OUT_POINT_KEY) || $(panel).data(@IN_POINT_KEY)
      outPosition = @lastFramePosition() if outPosition is -1
      for position in [$(panel).data(@IN_POINT_KEY)..outPosition]
        @panelIndex[position] ?= []
        @panelIndex[position].push panel

  # Re-order elements in DOM if specified.
  # 
  # This is a more reliable method of forcing a higher z-index for certain panels.
  # 
  reorder: ->
    frontPanels = @frames.children('.panels').find('.panel.front').detach()
    @frames.children('.panels').append(frontPanels)

  # DOM utility.
  # 
  # Find background for a given section (flow).
  # 
  findBackground: (flowName) ->
    @frames.children('.backgrounds').find(".background.frame[data-alongslide-id=#{flowName}]")

  # DOM utility.
  # 
  findPanel: (id) ->
    @frames.children('.panels').find(".panel.frame[data-alongslide-id=#{id}]")

  # Check panel index for panel at given position, and check if it's horizontal.
  # 
  horizontalPanelAt: (position, edge) ->
    edges = if edge? then [edge] else @HORIZONTAL_EDGES
    _(@panelIndex[position] || []).any (panel) ->
      _(edges).any (edge) -> $(panel).hasClass(edge)

  # Check if flow frame shares space with horizontally-pinned panel.
  # 
  isWithHorizontalPanel: (frame) ->
    for cssClass in _.map(@HORIZONTAL_EDGES, (edge) -> "with-panel-pinned-#{edge}")
      return true if frame.hasClass(cssClass)

  # Given a directive for a pinned panel, retun the class to be applied to
  # flow frames.
  # 
  withPinnedClass: (directive) ->
    edge = _.first _.filter @EDGES, (edge) -> directive.hasClass(edge)
    "with-panel-pinned-#{edge}"

  # Given a directive for a sized panel, retun the class to be applied to
  # flow frames.
  # TODO: maybe combine withPinnedClass and withSizedClass
  withSizedClass: (directive) ->
    size = _.first _.filter @SIZES, (size) -> directive.hasClass(size)
    size ?= "half"
    "with-panel-sized-#{size}"

  # If panel is partial width (i.e. is with left/right pinned panel),
  # then return its scrolling scale (0.0-1.0).
  # 
  # Called by Scrolling to determine scoll distance.
  # 
  # @return partialWidth - a percentage width (0.0-1.0), or undefined.
  #   Note: This number doesn't have to be exact--just has to "feel" right for
  #   pinned panels of different widths.
  # 
  framePartialWidth: (frame) ->
    if @isWithHorizontalPanel(frame)
      $column = frame.find('.'+@regionCls)
      return ($column.width() + $column.position().left) * @numFrameColumns(frame) / frame.width()

  # Return panel alignment.
  # 
  panelAlignment: (directive) ->
    _.first _.filter @ALIGNMENTS, (alignment) -> directive.hasClass(alignment)

  # Returns true when all flowing text has been laid out (i.e. last column
  # region no longer contains overflow.)
  # 
  flowComplete: (flowName) ->
    not document.namedFlows.get(flowName).updateOverset()

  # Utility: Is column empty after we remove directives from it?
  # 
  isEmpty: (el) ->
    $.trim(el.children().html()) == ''

  # Compute length of total laid out content so far and broadcast it to our
  # listeners.
  # 
  # To listen:
  # 
  #   $(document).on 'alongslide.progress', (e, progress) ->
  #     #
  # 
  updateProgress: (newElement) ->
    @laidOutLength += newElement.text().length
    $(document).triggerHandler 'alongslide.progress', (@laidOutLength / @sourceLength)

  # Write debug log to console if available/desired.
  # 
  log: (message, indentLevel = 0) ->
    indent = (_(indentLevel).times -> ". ").join('')
    if console? and @debug
      console.log "#{indent}#{message} (elapsed: #{(new Date - @startTime).valueOf()}ms)"
