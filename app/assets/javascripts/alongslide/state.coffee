#
# state.coffee: update browser history
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
#
class Alongslide::State

  historyState = {}

  constructor: (options= {}) ->
    {@historyState} = options

    History.Adapter.bind window,'statechange', =>
      stateData = History.getState()
      @update(stateData)
      return

  update: (stateData) ->
    i = stateData.index
    return if !i
    History.pushState({state:i}, "Page " + i, "#" + alongslide.layout.flowNames[i]);
