# 
# parser.rb: Bootstrap templating engine using Treetop syntax.
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Author Adam Florin
# 
require 'polyglot'
require 'treetop'

# Init
# 
Treetop.load File.expand_path("../../../grammar/panel", File.dirname(__FILE__))
Treetop.load File.expand_path("../../../grammar/alongslide", File.dirname(__FILE__))

module Treetop
  module Runtime

    # Root node of parse tree.
    # 
    class RootNode < SyntaxNode

      # Render tree to HTML.
      # 
      def render
        blocks.elements.map do |block_wrapper|
          if block_wrapper.content.respond_to? :block
            block_wrapper.content.block.render
          elsif block_wrapper.content.respond_to? :template
            block_wrapper.content.template.render
          end
        end.join
      end
    end

    # Template node base class. Covers panels, panel templates, sections.
    # 
    class TemplateNode < SyntaxNode

      # Load template and render it, with content, if applicable.
      # 
      def render
        ::Alongslide::Templates::render_template template_name, is_user_template, render_params
      end

      # Sections and panels optionally implement generic "class_params",
      # as well as required identifier.
      # 
      def render_params
        params = {content: template_content || []}

        classes = if respond_to? :class_params
          class_params.elements.map do |item|
            item.param.text_value
          end
        end
        params[:classes] = (classes || []).join(" ")

        if respond_to? :identifier
          params[:identifier] = identifier.text_value
        end

        return params
      end

      # Template named in directive is what to look for in filesystem.
      # 
      def template_name
        command.text_value
      end

      # If Node has "contents", prepare content for template's variable of the
      # same name.
      # 
      # This may mean rendering another subtemplate, or simply some Markdown.
      # 
      def template_content
        if respond_to? :contents and contents
          contents.elements.map do |item|
            if item.content.respond_to? :template
              item.content.template.renderable.template.render
            else
              ::Alongslide::render item.text_value, plain: true
            end
          end
        end
      end

      # Default.
      # 
      def is_user_template
        false
      end
    end

    # Panel.
    # 
    class PanelNode < TemplateNode
      def template_name
        "panel/#{super}"
      end
    end

    # Templates which go inside panels.
    # 
    class UserTemplateNode < TemplateNode

      # Params for panel content template.
      # 
      # Key/value pairs.
      # 
      # If value is a quoted string, strip quotes.
      # 
      def render_params
        params = {}
        if respond_to? :template_params
          template_params.elements.map do |item|
            key = item.param.key.text_value
            value = item.param.value.text_value
            params[key.to_sym] = unquote value
          end
        end
        super.merge params
      end

      # 
      # 
      def is_user_template
        true
      end

      private

        # If string is quoted, unquote.
        # 
        def unquote(string)
          if string =~ /^"/
            string.gsub!(/^"|"$/, '').gsub(/\\"/, '"')
          else
            string
          end
        end
    end

    # A section is a block of flowing text.
    # 
    class SectionNode < TemplateNode
      def template_name
        "section/#{super}"
      end
    end
  end
end
