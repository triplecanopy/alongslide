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

    end
  end
end
