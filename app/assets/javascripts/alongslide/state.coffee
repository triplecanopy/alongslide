#
# state.coffee: update browser history
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
#
class Alongslide::State

  panelNames   : {}
  documentTitle: ''
  hash         : '#'

  constructor: (options = {}) ->
    History = window.History
    if !History.enabled then return false
    @documentTitle = document.getElementsByTagName('title')[0].innerHTML
    @panelNames    = options.panelNames

  rewindStateIndex:(state) ->
    state.index -= 1
    @update(state);

  update:(state)->
    if @panelNames[state.index] and state.index > -1
      History.replaceState null, @documentTitle, @hash + @panelNames[state.index]
      pageData =
        index    : state.index
        hash     : @panelNames[state.index]
      $(document).triggerHandler 'alongslide.pagechange', pageData
    else
      @rewindStateIndex(state)
