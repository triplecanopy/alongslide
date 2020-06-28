#
# fixedAspect.coffee: Maintain fixed aspect ratio for given element.
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
#

class window.FixedAspect

  # Fit the content elements so that they maintain a consistent aspect ratio
  # no matter the aspect ratio of the browser window.
  #
  # @param minWidthPx - minimum width in pixels to allow. Don't shrink smaller!
  # @param marginTopPx - margin top in pixels to leave open.
  #
  # @return frame - bounding rect of content area, expressed as percentages
  #   relative to the browser window (0.0-1.0).
  #
  fitFrame: (minWidthPx, marginTopPx = 0) ->
    FRAME_ASPECT = 1.6
    FRAME_SELECTOR = '#frames > .flow > .frame'

    frameAspect =
      width: 1.0
      height: 1.0
      left: 0
      top: 0

    # aspect ratio calculations
    window_aspect = $(window).width() / $(window).height()
    if window_aspect > FRAME_ASPECT
      frameAspect.width = FRAME_ASPECT / window_aspect
      frameAspect.left = (1.0 - frameAspect.width) / 2
    else
      frameAspect.height = window_aspect / FRAME_ASPECT
      frameAspect.top = (1.0 - frameAspect.height) / 2

    # enforce margins, squeezing content down if necessary
    marginTop = marginTopPx / $(window).height()
    if frameAspect.top < marginTop
      frameAspect.top = marginTop
      scaleDown = (1.0 - frameAspect.top) / frameAspect.height
      frameAspect.height *= scaleDown
      frameAspect.width *= scaleDown
      frameAspect.left = (1.0 - frameAspect.width) / 2

    # enforce minWidthPx
    frameWidthPx = frameAspect.width * $(window).width()
    scaleUp = minWidthPx / frameWidthPx
    if scaleUp > 1.0
      frameAspect.height *= scaleUp
      frameAspect.width *= scaleUp

    # write to DOM, except for offset value for ALS
    Styles::write 'debug-grid-aspect', Styles::formatPercentages('#als-debug-grid', frameAspect)
    Styles::write 'frame-aspect', Styles::formatPercentages(FRAME_SELECTOR, _(frameAspect).omit('left'))

    # write font-size / line-height
    scalar = Math.max(1.0, (1.0 / scaleUp))
    textStyles =
      'font-size': parseInt($('#content-display').css('font-size')) * scalar
      'line-height': parseInt($('#content-display').css('line-height')) * scalar
    Styles::write 'frame-text', Styles::formatPixels('#frames', textStyles)

    return frameAspect

  # Go through all panels and manually turn absolute pixel-based values into
  # percentage-based values.
  #
  # Do this after render, as once the operation is done, it can't be undone.
  #
  # Because of the complex interrelation between the CSS values (specified in a
  # long, structural SASS doc) and the frame aspect value (computed on the fly),
  # there's just no other way to do this but to get dirty and effectively write
  # part of a CSS engine.
  #
  # Every `.panel` contains a `.contents`. The latter class has top/left/width/height
  # specified--relative to the `.panel`. We re-derive the percentages from these
  # relative values, because JS can't easily access CSS percentage values. And this
  # method of dynamic re-percentifying seemed more sensible than putting large amounts
  # of style data into JSON.
  #
  fitPanels: (frameAspect) ->
    $('#frames > .panels > .panel').each (index, panel) =>
      $panel = $(panel)
      $contents = $panel.find('> .contents')

      alignment = Alongslide::Layout::panelAlignment($panel)

      innerFrame = $contents.data('innerFrame')

      # If innerFrame isn't already stored, compute it now and store it.
      unless innerFrame?
        innerFrame = @innerFrame($panel)
        $contents.data('innerFrame', innerFrame)

      # .panel
      #
      panelFrame =
        width: 1.0
        height: 1.0

      switch alignment
        when "left"
          panelFrame.width = frameAspect.left + (innerFrame.left + innerFrame.width) * frameAspect.width
        when "right"
          panelFrame.width = frameAspect.left + (1.0 - innerFrame.left) * frameAspect.width
        when "top"
          panelFrame.height = frameAspect.top + (innerFrame.top + innerFrame.height) * frameAspect.height
        when "bottom"
          # can't assume that frameAspect is vertically centered,
          # due to `marginTop` (above). re-compute bottom.
          frameAspectBottom = 1.0 - frameAspect.top - frameAspect.height
          panelFrame.height = frameAspectBottom + (1.0 - innerFrame.top) * frameAspect.height

      # .panel .contents
      #
      contentsFrame =
        left: (frameAspect.left + innerFrame.left * frameAspect.width) / panelFrame.width
        top: (frameAspect.top + innerFrame.top * frameAspect.height) / panelFrame.height
        width: (innerFrame.width * frameAspect.width) / panelFrame.width
        height: (innerFrame.height * frameAspect.height) / panelFrame.height

      switch alignment
        when "right"
          # must use margin-left as skrollr uses left (so right-aligning won't work)
          panelFrame['margin-left'] = (frameAspect.left + innerFrame.left * frameAspect.width)
          contentsFrame.left = 0
        when "bottom"
          panelFrame.bottom = 0
          contentsFrame.top = 0

      # burn styles into CSS
      #
      $panel.css Styles::formatPercentageValues panelFrame
      $contents.css Styles::formatPercentageValues contentsFrame

  # Given a panel, determine its innerFrame.
  #
  innerFrame: ($panel) ->
    $contents = $panel.find('> .contents')

    left: parseInt($contents.css('left')) / $panel.width()
    top: parseInt($contents.css('top')) / $panel.height()
    width: $contents.width() / $panel.width()
    height: $contents.height() / $panel.height()
