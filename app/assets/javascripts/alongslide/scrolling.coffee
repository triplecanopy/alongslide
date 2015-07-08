#
# alongslide/scrolling.coffee: Skrollr wrapper.
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Authors Adam Florin & Anthony Tran
#
class Alongslide::Scrolling

  # For applyTransition.
  #
  TRANSITIONS:
    in: [-1..0]
    out: [0..1]

  FLIP_THRESHOLD: 0.04
  WAIT_BEFORE_RESET_MS: 250
  SLIDE_DURATION_MS: 250
  FORCE_SLIDE_DURATION_MS: 100
  NUM_WHEEL_HISTORY_EVENTS: 10
  MAGNITUDE_THRESHOLD: 2.2

  currentPosition: 0
  indexedTransitions: {}

  # For desktop scroll throttling.
  #
  wheelHistory: []
  lastAverageMagnitude: 0
  ignoreScroll: false
  lastRequestedPosition: 0

  mouseDown: false

  # browser history
  stateData: {}

  constructor: (options= {}) ->
    {@frames} = options

    @skrollr = skrollr.init
      emitEvents: true
      horizontal: true
      edgeStrategy: 'set'
      render: @snap
      easing:
        easeInOutQuad: (p) ->
          if p < 0.5
            Math.pow(p*2, 1.5) / 2
          else
            1 - Math.pow((p * -2 + 2), 1.5) / 2;
        easeOutQuad: (p) ->
          1 - Math.pow(1 - p, 2)

    @arrowKeys()

    @events()

    unless @skrollr.isMobile()
      @throttleScrollEvents()
      @monitorScroll()
      @monitorMouse()

  # Init skrollr once content data attributes are populated.
  #
  # @param - frameAspect - percentage horizontal offset (0.-1.)
  #   to factor in when applying scroll transitions
  #
  render: (@frameAspect, lastFramePosition) ->
    @applyTransitions(lastFramePosition)
    @skrollr.refresh()

  # TODO: write API that injects functions
  # i.e. functionName(event, frame number, function) `('before', 3, animateTable)`
  events: =>
    @frames.on 'skrollrBefore', (e) -> e.target
    @frames.on 'skrollrBetween', (e) -> e.target
    @frames.on 'skrollrAfter', (e) -> e.target

  # Apply skrollr-style attrs based on Alongslide attrs.
  #
  #
  applyTransitions: (lastFramePosition) ->
    @indexedTransitions = {}

    @frames.find('.frame').each (index, frameEl) =>
      frame = $(frameEl)

      keyframes =
        in: parseInt(frame.data alongslide.layout.IN_POINT_KEY)
        out: parseInt(frame.data alongslide.layout.OUT_POINT_KEY)

      if (keyframes.in is lastFramePosition) or (keyframes.out is -1)
        keyframes.out = null
      else
        keyframes.out ||= keyframes.in

      @indexedTransitions[keyframes.in] ?= {in: [], out: []}
      @indexedTransitions[keyframes.in].in.push frame
      if keyframes.out?
        @indexedTransitions[keyframes.out] ?= {in: [], out: []}
        @indexedTransitions[keyframes.out].out.push frame

      @applyTransition frame, _(keyframes).extend lastFramePosition: lastFramePosition

    if @skrollr.isMobile()
      # For mobile, stage positions 0 and 1
      _.each [0, 1], (position) =>
        _.each @indexedTransitions[position].in, (frame) ->
          frame.removeClass('unstaged')
    else
      # For desktop, stage all
      @frames.find('.frame').each (index, frameEl) =>
        $(frameEl).removeClass('unstaged')


  # Write skrollr-style scroll transitions into jQuery DOM element.
  #
  # Note that, since a frame may enter and exit with different transitions,
  # the CSS snippets for each transition should zero out effects of other
  # transitions. (That's why the "slide" transition sets opacity.)
  #
  # Also, frames may scroll over a shorter distance ('scale') if they
  # are with horizontally pinned panels. The code below must be context-aware
  # enough to know when to do a normal-length scroll and when to shorten it.
  #
  # @param frame: jQuery object wrapping new DOM frame
  # @param options: hash containing:
  #   - in: percentage of total page width when frame should enter
  #   - out (optional): percentage of total page width when frame should exit
  #   - lastFramePosition: last position of any frame in DOM.
  #
  # @return frame
  #
  applyTransition: (frame, options = {}) ->
    # fuzzy logic coefficient. see below.
    A_LITTLE_MORE = 2

    options = @transitionOptions frame, options

    # Flow frames have a left offset; panels and backgrounds do not.
    offset = if frame.parent().hasClass('flow') then @frameAspect.left else 0

    # if frame is partial width, scale the scroll down
    frameScale = alongslide.layout.framePartialWidth(frame)

    # transition is either 'in' or 'out'
    for transition, directions of @TRANSITIONS
      if options[transition]?

        # direction is either -1, 0, or 1.
        for direction in directions

          # Set framescale for horizontal panels if there's another horizontal
          # panel at the opposite edge before AND after the transition.
          #
          if Math.abs(direction) > 0
            if frame.parent().hasClass('panels')
              panelAlignment = alongslide.layout.panelAlignment(frame)
              if _(alongslide.layout.HORIZONTAL_EDGES).contains panelAlignment
                oppositeEdge =
                  if frame.hasClass('left') then 'right'
                  else if frame.hasClass('right') then 'left'
                if (alongslide.layout.horizontalPanelAt(options[transition], oppositeEdge) and
                  alongslide.layout.horizontalPanelAt(options[transition] + direction, oppositeEdge))
                    frameScale = 0.495

          # In certain cases, we need more than one keypoint per direction.
          #
          keypoints =
            if frameScale?
              # if frameScale is set, use it--but add an additional keypoint
              # at 1.0 to make sure these closely-packed frames are out of
              # the visible frame when they need to be be.
              _.map [frameScale, 1.0], (scale, index) ->
                magnitude = direction * (parseInt(index)+1)
                position = options[transition] + magnitude

                # if there isn't a horizontally pinned panel here, then scroll normally.
                scale = 1.0 unless alongslide.layout.horizontalPanelAt(position)

                # Double keypoints in order to keep the frame out of the visible
                # window until absolutely necessary so that it doesn't sit atop
                # the visible frame (and consume link clicks).
                #
                [ {magnitude: magnitude, scale: scale * A_LITTLE_MORE},
                  {magnitude: magnitude * 0.99, scale: scale}]

            else if options.transition[transition] is "fade" and direction isnt 0
              # fade transitions need a secret keypoint so that they fade
              # in place but also don't hang out with opacity: 0 on top of
              # other content when they're not supposed to be there.
              [ {magnitude: direction * 0.99, scale: 0.0},
                {magnitude: direction, scale: 1.0}]

            else
              # default: one keypoint
              [{magnitude: direction, scale: 1.0}]

          # apply Skrollr transitions for each keypoint.
          #
          for keypoint in _.flatten(keypoints)
            {magnitude, scale} = keypoint
            position = options[transition] + magnitude

            # Don't write extra transitions beyond the end of the piece
            unless position > options.lastFramePosition
              styles = {}

              # x translate
              translateBy = (offset - direction) * scale
              translateByPx = Math.round(translateBy * Math.max($(window).width(), alongslide.layout.FRAME_WIDTH))
              styles["#{prefix.css}transform"] =
                "translate(#{translateByPx}px, 0) translateZ(0)"

              # opacity
              styles.opacity = if options.transition[transition] is "fade"
                  1.0 - Math.abs(direction)
                else
                  1.0

              # apply the data for Skrollr.
              frame.attr "data-#{Math.round(position * 100)}p",
                (_.map styles, (value, key) -> "#{key}: #{value}").join("; ")

  # Check frame's CSS classes for transition cues in the format
  # `*-in` or `*-out`.
  #
  # Currently defaults to "slide", and does no validation.
  #
  transitionOptions: (frame, options = {}) ->
    frameClass = frame.get(0).className

    options.transition =
      _.object _.map @TRANSITIONS, (directions, transition) ->
        effectMatch = frameClass.match(new RegExp("(\\S+)-#{transition}"))
        effect = if effectMatch then effectMatch[1] else "slide"
        [transition, effect]

    return options

  # If we're in the refractory period, extinguish all scroll events immediately.
  #
  # Desktop only.
  #
  throttleScrollEvents: ->
    $(window).on 'wheel mousewheel DOMMouseScroll MozMousePixelScroll', (e) =>

      deltaX = e.originalEvent.deltaX || e.originalEvent.wheelDeltaX || 0
      deltaY = e.originalEvent.deltaY || e.originalEvent.wheelDeltaY || 0

      averageMagnitude = @updateWheelHistory(deltaX)

      if @ignoreScroll
        if averageMagnitude > @lastAverageMagnitude * @MAGNITUDE_THRESHOLD
          @ignoreScroll = false
        else if Math.abs(deltaX) > Math.abs(deltaY)
          e.preventDefault()

      @lastAverageMagnitude = averageMagnitude

  # To gauge scroll inertia on desktop, need to constantly populate our
  # wheelHistory array with zeroes to mark time.
  #
  # Desktop only.
  #
  monitorScroll: ->
    # zero handler
    zeroHistory = => @lastAverageMagnitude = @updateWheelHistory(0)

    # init wheel history
    _(@NUM_WHEEL_HISTORY_EVENTS).times -> zeroHistory()

    # repeat forever.
    setInterval zeroHistory, 5

  # Add the latest delta to the running history, enforce max length.
  #
  # Returns average after updating.
  #
  updateWheelHistory: (delta) ->
    # add delta to history
    @wheelHistory.unshift(delta)

    # trim history
    @wheelHistory.pop() while @wheelHistory.length > @NUM_WHEEL_HISTORY_EVENTS

    # return average
    sum = _.reduce(@wheelHistory, ((memo, num) -> memo + num), 0)
    average = sum / @wheelHistory.length
    return Math.abs(average)

  # Monitor mousedown state on desktop to separate scrollbar from mousewheel
  #
  monitorMouse: ->
    $(document).mousedown =>
      @mouseDown = true
    $(document).mouseup =>
      @mouseDown = false
      requestedPosition = $(window).scrollLeft() / $(window).width()
      window.alongslide?.scrolling.scrollToPosition(requestedPosition)

  # Scroll to requested frame.
  #
  # Don't scroll below zero, and don't do redundant scrolls.
  #
  # @param position - ALS position (= frame number). May be floating point!
  #
  # @option skrollr - caller may pass in skrollr if our variable hasn't been
  #   set yet
  # @option force - if true, force a corrective scroll, even if we think we're
  #   at the position we think we're supposed to be at.
  # @option scrollMethod - is this a "scroll", a "touch", or "keys"?
  #
  scrollToPosition: (requestedPosition, options = {}) =>
    # use our stored copy of skrollr instance if available
    skrollr = @skrollr || options.skrollr

    clearTimeout @resetTimeout

    # round floating point position up or down based on thresholds
    deltaRequestedPosition = requestedPosition - @lastRequestedPosition
    deltaPosition = requestedPosition - @currentPosition
    position =
      if deltaRequestedPosition > 0
        if deltaPosition > @FLIP_THRESHOLD
          Math.ceil requestedPosition
      else if deltaRequestedPosition < 0
        if deltaPosition < -@FLIP_THRESHOLD
          Math.floor requestedPosition
    position ?= @currentPosition

    # contain within bounds
    position = Math.max(0, position)
    position = Math.min(position, alongslide?.layout.lastFramePosition()) if alongslide?

    if position isnt @currentPosition
      # scroll to new (integer) position
      scrollTo = position

      duration = @SLIDE_DURATION_MS
      if alongslide.layout.horizontalPanelAt(position) and alongslide.layout.horizontalPanelAt(@currentPosition)
        duration /= 2

    else if requestedPosition isnt @currentPosition
      # didn't quite land on a new frame. revert back to current position after timeout.
      @resetTimeout = setTimeout((=>
        @scrollToPosition(@currentPosition, force: true)
      ), @WAIT_BEFORE_RESET_MS)

    else if options.force
      if (position * $(window).width()) isnt skrollr.getScrollPosition()
        scrollTo = @currentPosition
        duration = @FORCE_SLIDE_DURATION_MS

    @doScroll(scrollTo, skrollr, duration, options) if scrollTo?

    @lastRequestedPosition = requestedPosition

  #
  #
  doScroll: (scrollTo, skrollr, duration, options) ->
    scrollDelta = scrollTo - @currentPosition
    @currentPosition = scrollTo

    # Block all future scrolls until new scroll has begun.
    # See throttleScrollEvents().
    unless skrollr.isMobile() or options.scrollMethod is "keys"
      @ignoreScroll = true

    # Do scroll
    skrollr.animateTo scrollTo * $(window).width(),
      duration: duration
      easing: 'easeOutQuad'
      done: (skrollr) =>
        @stateData =
          index: @currentPosition
        alongslide.state.update(@stateData)

    # For mobile, stage/unstage frames after transition
    if @skrollr.isMobile()
      setTimeout((=>
        if Math.abs(scrollDelta) > 0
          stagePosition = scrollTo + scrollDelta
          stageTransition = if scrollDelta > 0 then 'in' else 'out'
          _.each @indexedTransitions[stagePosition]?[stageTransition], (frame) ->
            frame.removeClass('unstaged').hide()
            setTimeout((-> frame.show()), 0)

          unstagePosition = @currentPosition - 2 * scrollDelta
          unstageTransition = if scrollDelta > 0 then 'out' else 'in'
          _.each @indexedTransitions[unstagePosition]?[unstageTransition], (frame) ->
            frame.addClass('unstaged')
      ), duration)

  # Snap-to-content scrolling, implemented as a skrollr callback, called after
  # each frame in the animation loop.
  #
  # Bias the scroll so that it moves in the same direction as the user's input
  # (i.e., use floor()/ceil() rather than round(), so that scroll never
  # snaps BACK, which can feel disheartening as a user experience).
  #
  snap: (info) ->

    # don't do anything if skrollr is animating
    return if @isAnimatingTo()

    # don't scroll past the document end
    return if info.curTop > info.maxTop

    # don't animate if user is clicking scrollbar
    return if window.alongslide?.scrolling.mouseDown

    # see how far the user has scrolled, scroll to the next frame.
    requestedPosition = info.curTop / $(window).width()
    window.alongslide?.scrolling.scrollToPosition(requestedPosition, skrollr: @)

  # Listen to left/right arrow (unless modifier keys are pressed),
  # and scroll accordingly.
  #
  arrowKeys: ->
    $(document).keydown (event) =>
      if event.altKey or event.shiftKey or event.ctrlKey or event.metaKey
        return true
      else
        switch event.keyCode
          when 37 then @scrollToPosition(@currentPosition - 1, scrollMethod: "keys")
          when 39 then @scrollToPosition(@currentPosition + 1, scrollMethod: "keys")
          else propagate_event = true
        return propagate_event?
