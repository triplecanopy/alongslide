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
    @panelIndices  = options.panelIndices
    @flowIndices   = options.flowIndices
    @hashIndices   = []
    @hash          = '#'


  setIndices:(arr) ->
    @hashIndices = arr

  rewindIndex:(state) ->
    state.index -= 1
    @updateLocation(state);

  updateLocation:(state = {})->

    console.log @flowIndices[state.index]

    # if @panelIndices[state.index]
    #   setTimeout ( ()=>
    #     History.replaceState null, @documentTitle, @hash + @hashIndices[state.index]
    #   ), 0
    #   pageData =
    #     index      : state.index
    #     # panelHash  : @panelIndices[state.index]
    #     # sectionHash: @flowIndices[state.index]
    #   $(document).triggerHandler 'alongslide.panelChange', pageData
    # else if !@hashIndices[state.index] and state.index > -1
    #   @rewindIndex(state)
    # else if state.index <= -1
    #   return