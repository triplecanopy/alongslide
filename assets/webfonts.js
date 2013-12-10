(function() {
  window.WebFontConfig = {
    // custom: {
    //   families: ['FreeUniversal', 'TCCrimson'],
    //   urls: ['/assets/webfonts.css']
    // },
    inactive: function() {
      console.warn("Error loading fonts.");
      return $(document).triggerHandler('webfonts.loading-error');
    },
    active: function() {
      console.log("Loaded fonts.");
      return $(document).triggerHandler('webfonts.loaded');
    }
  };

  $(document).ready(function() {
    return WebFont.load(window.WebFontConfig);
  });

}).call(this);
