#
# state.coffee: update browser history
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
#
class Alongslide::State

  constructor: (options = {}) ->

    History = window.History

    if !History.enabled then return false

    @documentTitle = document.getElementsByTagName('title')[0].innerHTML
    @panelNames    = options.panelNames
    @flowNames     = options.flowNames
    @panelIndices  = options.panelIndices   # correct now
    @flowIndices   = options.flowIndices    #
    @hashIndices   = []
    @hash          = '#'


  setIndices:(arr) ->
    @hashIndices = arr

  rewindIndex:(state) ->
    state.index -= 1
    @updateLocation(state);

  updateLocation:(state = {})->

    # console.log @hashIndices[state.index]

    if !@hashIndices[state.index] and state.index > -1
      # Accounting for layouts that only have one section, as the `position`s
      # won't be in the indices array.
      #
      @rewindIndex(state)

    else if state.index < 0
      # Exit if the indices array is empty
      #
      return

    else if @hashIndices[state.index]
      return
      # Update the hash
      #
      # setTimeout =>
      #   History.replaceState null, @documentTitle, @hash + @hashIndices[state.index]
      # , 0
      # pageData =
      #   index      : state.index
      #   panelHash  : @panelIndices[state.index]
      #   sectionHash: @flowIndices[state.index]

      # $(document).triggerHandler 'alongslide.panelChange', pageData
