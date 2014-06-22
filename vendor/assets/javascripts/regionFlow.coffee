# 
# regionFlow.coffee: ultralightweight, if somewhat naïve, implementation of
# CSS regions, according to the spec at:
# 
#   http://dev.w3.org/csswg/css-regions/
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# 


# Initialize NamedFlowMap.
# 
class RegionFlow

  # To be spec compliant, the NamedFlow .overset property should be proactively
  # calculated after any layout change.
  # 
  # However, in reality, checking a DOM element's scrollHeight is very expensive,
  # so it's best not to call it any more than is stricly necessary.
  # 
  # For that reason, lazy mode is enabled by default, and callers should call
  # .updateOverset() on namedFlows instead of checking the .overset property.
  # 
  lazyMode: true

  init: ->
    document.namedFlows = new @NamedFlowMap

# Document has one NamedFlowMap, so that flows may be looked up by index.
# 
# [MapClass(DOMString, NamedFlow)]
# 
class RegionFlow::NamedFlowMap

  namedFlows: {}

  # 
  # 
  build: (flowName) ->
    @namedFlows[flowName] = new RegionFlow::NamedFlow(flowName)

  # As specified:
  # 
  #   NamedFlow? get(DOMString flowName);
  # 
  get: (flowName) ->
    @namedFlows[flowName] || @build(flowName)

  # As specified:
  # 
  #   boolean has(DOMString flowName);
  # 
  has: (flowName) ->
    @namedFlows[flowName]?

  # As specified:
  # 
  #   NamedFlowMap set(DOMString flowName, NamedFlow flowValue);
  # 
  set: (flowName, flowValue) ->
    @namedFlows[flowName] = flowValue

  # As specified:
  # 
  #   boolean delete(DOMString flowName);
  # 
  delete: (flowName) ->
    delete @namedFlows[flowName]

# A NamedFlow
# 
#   interface NamedFlow : EventTarget {
#   };
# 
class RegionFlow::NamedFlow
  # readonly attribute DOMString name;
  # readonly attribute boolean overset;
  # readonly attribute integer firstEmptyRegionIndex;

  # 
  # 
  constructor: (@name) ->
    @contentNodes = []
    @overset = false
    @resetRegions()

  # Reset, assuming all previously-tracked regions have been destroyed.
  # 
  # Leave content nodes right where they are.
  # 
  resetRegions: ->
    @regions = []
    @firstEmptyRegionIndex = -1
    @updateOverset() unless RegionFlow::lazyMode

  # As specified:
  # 
  #   sequence<Region> getRegions();
  # 
  getRegions: ->
    @regions

  # Push region to end of array and doFlow.
  # 
  addRegion: (regionNode) ->
    @regions.push new RegionFlow::Region(regionNode)
    @firstEmptyRegionIndex = @regions.length - 1
    @doFlow()

  # As specified:
  # 
  #   sequence<Node> getContent();
  # 
  getContent: ->
    @contentNodes

  # Push content to end of array and doFlow.
  # 
  addContent: (contentNode) ->
    @contentNodes.push($(contentNode))
    @doFlow()

  # If regions are all still there, but the dimensions of already laid-out
  # regions has changed, re-flow all regions from scratch (like resetRegions,
  # but softer).
  # 
  reFlow: ->
    node.empty() for node in _.pluck @regions, 'node'

    @firstEmptyRegionIndex = 0
    loop
      @doFlow()
      break if @firstEmptyRegionIndex is @regions.length - 1
      @firstEmptyRegionIndex++

  # Layout logic.
  # 
  doFlow: ->
    if @firstEmptyRegionIndex is 0

      # TODO: prune marginal nodes? comments, scripts?
      
      @populateRegions()

    else if @firstEmptyRegionIndex > 0
      
      # move all nodes from oversetRegion to lastRegion
      # (which will later become the oversetRegion)
      nodes = $(@oversetRegion().node).contents().remove()
      @lastRegion().appendNode(nodes)

      # enter recursive loop
      @breakUp nodes: nodes
      
    @updateOverset() unless RegionFlow::lazyMode

  # Place all content into regions. Performed only on first time.
  # 
  populateRegions: ->
    @lastRegion().appendNode(node.clone()) for node in @contentNodes

  # Recursive layout call.
  # 
  # @params options - hash
  #   node - HTML element to be broken up. ignored if nodes option is specified.
  #   nodes - array of HTML elements. overrides node option if specified.
  #   into - targetNode to break up 'node' into. defaults to oversetRegion's root.
  # 
  breakUp: (options = {}) ->
    nodes = options.nodes || $(options.node).contents()

    targetNode = options.into || @oversetRegion().node

    if options.node?
      targetNode = $(options.node).clone().empty().appendTo(targetNode).get(0)

    nodes.each (index, childNode) =>

      if $(childNode).hasClass('break-before-always') and not $(targetNode).empty()
        return false

      formerParent = $(childNode).parent()
      $(childNode).remove().appendTo(targetNode)

      if @oversetRegion().updateOverset() is 'overset'

        # move it back where it was
        $(childNode).remove().prependTo(formerParent)
        
        if childNode.nodeType is Node.TEXT_NODE
          @breakUpText node: childNode, into: targetNode
        else
          @breakUp node: childNode, into: targetNode

        # exit loop
        return false

      else if $(childNode).hasClass('break-after-always')
        return false

  # Given a text node and a target node (in the overset region), find the number
  # of words which fit.
  # 
  # @params options - hash
  #   node - textNode to copy words from
  #   into - targetNode to copy words to
  # 
  breakUpText: (options = {}) ->
    textNode = options.node
    targetNode = document.createTextNode("")
    $(targetNode).appendTo(options.into)

    words = textNode.nodeValue.split(/[ ]+/)
    highIndex = words.length - 1
    lowIndex = 0
    tryIndex = highIndex

    loop
      targetNode.textContent = words[0..tryIndex].join(" ")

      if @oversetRegion().updateOverset() is 'overset'
        highIndex = tryIndex
      else
        lowIndex = tryIndex

      tryIndex = Math.floor(lowIndex + (highIndex - lowIndex) / 2)
      
      break if highIndex - lowIndex <= 1
    
    if tryIndex is 0
      $(targetNode).remove()
    else
      targetNode.textContent = words[0..tryIndex].join(" ")
      textNode.nodeValue = words[tryIndex+1..words.length-1].join(" ")
      $(textNode).parent().addClass("region-flow-post-text-break")

    @oversetRegion().updateOverset() unless RegionFlow::lazyMode

  # Calculate whether named flow is overset.
  # 
  # Normally treated as a private method, but called publicly in lazy mode.
  # See RegionFlow::lazyMode.
  # 
  updateOverset: ->
    @overset = @regions[@firstEmptyRegionIndex]?.updateOverset() is 'overset'

  # Readability helpers.
  # 
  oversetRegion: ->
    @regions[@firstEmptyRegionIndex - 1]
  lastRegion: ->
    @regions[@firstEmptyRegionIndex]
  

# [NoInterfaceObject]
# interface Region {
# };
# 
class RegionFlow::Region

  constructor: (node) ->
    @node = $(node)
    @updateOverset() unless RegionFlow::lazyMode

  # Append one or more nodes.
  # 
  appendNode: (contentNode) ->
    $(@node).append(contentNode)
    @updateOverset() unless RegionFlow::lazyMode

  # As specified:
  # 
  #   readonly attribute DOMString regionOverset;
  # 
  # Possible states
  # 
  #   'overset': The region is the last one in the region chain and not able to fit the remaining content from the named flow.
  #   'fit': The region's flow fragment content fits into the region's content box.
  #   'empty': All content from the named flow was fitted in prior regions.
  # 
  updateOverset: ->
    node = @node.get(0)
    isOverset = node.scrollHeight > node.clientHeight

    # Check if region contains a node which needs breaking
    containsUnrespectedBreak = false
    @node.find('.break-before-always').each ->
      unless $(@).prev().length == 0
        containsUnrespectedBreak = true
        return
    @node.find('.break-after-always').each ->
      unless $(@).next().length == 0
        containsUnrespectedBreak = true
        return

    @regionOverset =
      if @node.is(':empty')
        'empty'
      else if isOverset or containsUnrespectedBreak
        'overset'
      else
        'fit'

# 
window.RegionFlow = RegionFlow
