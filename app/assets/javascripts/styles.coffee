#
# styles.coffee: Load CSS styles manually to be sure when they're loaded.
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
#

class window.Styles
  urls: []

  # Break open HTML snippet and store href attributes of contained <link>s.
  #
  loadLater: (snippet) ->
    $(snippet).filter('link').each (index, link) =>
      @urls.push $(link).attr('href')

  # Load all CSS files, then execute callback.
  #
  # For now, load synchronously, to make sure CSS is loaded in the correct
  # order. Async loading is a possible optimization, but would have to do
  # more legwork to keep track of all requests.
  #
  doLoad: (callback) ->
    styles = $('<style type="text/css"/>').appendTo('body')
    promises = @urls.map (url) ->
      $.get(url)
        .success (data) -> styles.append data
        .error (response) -> console.error response

    Promise.all(promises).then(callback)

  # Util: CSS formatter
  #
  formatPercentages: (selector, values) ->
    declarations = (_.map values, (value, key) => "#{key}: #{@formatPercentageValue(value)}").join(';')
    return "#{selector} { #{declarations} }"

  #
  #
  formatPercentageValues: (values) ->
    _.object _(values).map (percent, key) => [key, @formatPercentageValue percent]

  # Util.
  #
  formatPercentageValue: (value) ->
    "#{value * 100}%"

  # Util: CSS formatter
  #
  formatPixels: (selector, values) ->
    declarations = (_.map values, (value, key) -> "#{key}: #{value}px").join(';')
    return "#{selector} { #{declarations} }"

  # Util: set CSS by writing <style> to the DOM.
  #
  write: (id, styles) ->
    $("style##{id}").remove()
    $('<style type="text/css" id="'+id+'"/>').append(styles).appendTo('body')
