# 
# alongslide.cofee: Central init, pull in submodules.
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Authors Adam Florin & Anthony Tran
# 
class Alongslide

  panels     : {}
  sections   : {}

  parser     : null
  layout     : null
  scrolling  : null

  constructor: (options= {}) ->
    @source     = $(options.source)  ? $('#content .raw')
    @frames     = $(options.to)      ? $('#frames')
    @regionCls  = options.regionCls  ? 'column'

    RegionFlow::init()

    # parse
    @parser = new @Parser source: @source
    {@flowNames, @backgrounds, @panels, @footnotes, @sourceLength} = @parser.parse()

    # init layout
    @layout = new @Layout
      sourceLength:    @sourceLength
      frames:          @frames
      flowNames:       @flowNames
      backgrounds:     @backgrounds
      panels:          @panels
      regionCls:       @regionCls

    # init scrolling
    @scrolling = new @Scrolling
      frames:          @frames


  # Render flowing layout and scroll behavior.
  # 
  # Force use of CSS Regions polyfill. (Don't trust native browser support
  # while W3C draft is under active development.)
  # 
  # @param frameAspect - bounding box computed by FixedAspect
  # @param postRenderCallback - to be called when layout returns
  # 
  render: (postRenderCallback) ->
    frameAspect = FixedAspect.prototype.fitFrame(@layout.FRAME_WIDTH)
    @layout.render (lastFramePosition) =>

      @lastFramePosition = lastFramePosition

      @refresh(frameAspect)
      @applyFootnotes()
      @applyAnchorScrolling()

      # Emit notification that layout is complete.
      $(document).triggerHandler 'alongslide.ready', @frames

      @hashToPosition()
      FixedAspect.prototype.fitPanels(frameAspect)
      postRenderCallback()

  # Refresh Skrollr only on resize events, as it's fast.
  # 
  refresh: ->
    frameAspect = FixedAspect.prototype.fitFrame(@layout.FRAME_WIDTH)
    @scrolling.render(frameAspect, @lastFramePosition)
    FixedAspect.prototype.fitPanels(frameAspect)

  hashToPosition: ->
    hash = window.location.hash
    if hash.length > 0
      @goToPanel(hash.substr(1))
    else
      @goToPanel('titlesplash')


  # Create footnotes
  # 
  # Sanitize Markdown generated HTML
  applyFootnotes: ->
    # For each footnote in the article
    @frames.find('a[rel=footnote]').each (i, el) =>
      # Reference the footnote
      $el = $(el)
      # Find the actual footnote
      $footnote = @footnotes.find($el.attr('href'))
      # Append actualy footnote to footnote reference
      $el.parent('sup').append($footnote)

      # Add event listener to pin/unpin when clicked
      $el.on "click", (e) -> $(this).toggleClass('active')

  applyAnchorScrolling: ->
    self = @
    @frames.find('a[href*=#]:not([href=#])').on('click', (e) ->
      self.goToPanel(@hash.substr(1))
    )

  goToPanel: (alsId) =>
    $target = $('#frames').find('[data-alongslide-id=' + alsId + ']')
    targetPos = $target.data('als-in-position')
    @scrolling.scrollToPosition(targetPos)


# Make global
# 
window.Alongslide = Alongslide
