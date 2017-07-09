#
# alongslide-redcarpet.rb: top-level bindings and entrypoint for Redcarpet
# and Treetop.
#
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Author Adam Florin
#
require 'yaml'
require 'haml'
require "alongslide/templates"
require "alongslide/redcarpet/render"
require "alongslide/treetop/parser"
require "alongslide/syntax_error"

module Alongslide
  @@parser = nil

  tc_templates = File.expand_path("../tc_templates", File.dirname(__FILE__))
  Alongslide::Templates.user_template_dir = tc_templates

  class << self

    # Accept configuration from initializer.
    #
    def configure(&block)
      Templates.configure &block
    end

    # Render HTML from Markdown.
    #
    # @option locals - if present, stash locals in class config static variable.
    #   NOTE! This is not threadsafe. but fine for general usage.
    # @option plain - use secondary plain renderer
    #
    def render(markdown, options={})
      unless options[:locals].nil?
        Templates.configure do |config|
          config.locals = options[:locals]
        end
      end

      (options[:plain] ? plain_renderer : renderer).render markdown
    end

    # Get Redcarpet renderer, init'ing if necessary.
    #
    def renderer
      Redcarpet::Markdown.new(Redcarpet::Render::Alongslide, :footnotes => true)
    end

    # Plain vanilla renderer for the Markdown blocks extracted by the first
    # renderer. (Can't call render() on a renderer in the middle of rendering,
    # or you'll get Abort Traps.)
    #
    def plain_renderer
      Redcarpet::Markdown.new Redcarpet::Render::HTML
    end

    # Get Treetop parser, init'ing if necessary.
    #
    def parser
      @@parser ||= Grammar::RootParser.new
    end

    # Given an indented block of Alongslide-flavored Markdown, parse and return
    # rendered HTML including appropriate templates.
    #
    # @param markdown raw Markdown containing directives and raw text.
    #
    # @return HTML for display
    #
    def render_block(markdown)
      rootNode = parser.parse(markdown)
      if rootNode
        return rootNode.render
      else
        error_line = markdown.split("\n")[parser.failure_line-1]
        raise SyntaxError.new "Alongslide syntax error around: \"#{error_line}\""
      end
    # rescue
    #   raise SyntaxError.new "Unknown Alongslide syntax error"
    end

  end
end
