




DEBOUNCE_RESIZE_MS = 250

// On DOM ready, load fonts
// 
$(document).ready(function() {
  WebFont.load({
    // Demo webfonts from Google Fonts
    google: {
      families: ['Asap:400,700,400italic,700italic', 'Source Code Pro']
    },
    active: function() {
      loadStyles()
    }
  })
})

// Load style
// 
function loadStyles() {
  Styles.prototype.doLoad(function() {
    init()
  })
}

// Initialize Alongslide
// 
function init() {
  window.alongslide = new Alongslide({
    source: '#content',
    to: '#frames'
  })
  render()
}

// Render Alongslide
// 
function render() {
  $('#content-display').css({opacity: 0.0})
  window.alongslide.render(function() {
    $('#content-display').animate({opacity: 1.0}, 150)
  })
}

// Refresh Alongslide (update scroll handlers without re-flowing all content)
// 
function refresh() {
  window.alongslide.refresh()
}

// Resize handler
// 
// Refresh instantly as it's fast--and only re-render after a timeout to avoid
// doing redundant renders.
// 
$(window).resize(function() {
  refresh()

  clearTimeout(window.renderTimeout)
  window.renderTimeout = setTimeout(render, DEBOUNCE_RESIZE_MS)
})

// Log render progress to console
// 
$(document).on('alongslide.progress', function(e, progress) {
  if (console) console.log("Alongslide render progress: " + (progress * 100) + "%")
})
;
