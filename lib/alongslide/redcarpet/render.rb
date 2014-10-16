# 
# render.rb: Extend Redcarpet renderer with Alongslide syntax.
# 
# Good resource for extending Redcarpet:
# http://dev.af83.com/2012/02/27/howto-extend-the-redcarpet2-markdown-lib.html
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Author Adam Florin
# 
require 'redcarpet'

module Redcarpet
  module Render
    class Alongslide < HTML

      # Run through all indented blocks (normally treated as code blocks)
      # for Alongslide block definitions.
      # 
      # @param text is raw Markdown
      # @param language is ignored
      # 
      def block_code(text, language)
        ::Alongslide::render_block text
      end

      def footnote_def(text, number)
        # example args
        #
        # "<p>Here is the text of the footnote</p>\n", 1
        "<div id='fn#{number}' class='als-footnote'>#{text.insert(3,number.to_s+'  ')}</p></div>"
      end

      def footnotes(text)
        "<div class='als-footnotes'>"+text+"</div>"
      end

      def footnote_ref(number)
        "<sup id='fnref#{number}' class='als-fn-sup'><span class='als-fn-ref' data-anchor='#fn#{number}'>#{number}</span></sup>"
      end

    end
  end
end
