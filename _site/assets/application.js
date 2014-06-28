



MIN_WINDOW_WIDTH = 980

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
    render()
  })
}

// Render Alongslide
// 
function render() {
  window.alongslide = new Alongslide({
    source: '#content',
    to: '#frames'
  })
  frameAspect = FixedAspect.prototype.fitFrame(MIN_WINDOW_WIDTH)
  window.alongslide.render(frameAspect, function() {
      FixedAspect.prototype.fitPanels(frameAspect)
      $('#content-display').animate({opacity: 1.0}, 150)
  })
}
;
