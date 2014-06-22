# 
# templates.rb: load and parse HAML templates (with Middleman-style YAML
# frontmatter).
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# Author Adam Florin
# 

module Alongslide
  module Templates

    # Template paths.
    # 
    # A minimum of templates are bundled with the gem.
    # 
    # The rest are provided by the user, and stored elsewhere.
    # 
    @@TEMPLATE_DIR = File.expand_path("../../app/views", File.dirname(__FILE__))
    @@user_template_dir = nil

    # Names of user templates, sorted by type.
    # 
    @@template_names = {}


    @@locals = {}

    class << self

      # 
      # 
      def configure
        yield self
      end

      # Scan user templates and populate list of names to be used by
      # Treetop grammar to validate Alongslide directives.
      # 
      def scan_user_templates
        if @@user_template_dir
          @@template_names = {greedy: [], nongreedy: [], independent: []}
          Dir.glob(File.join @@user_template_dir, "*.haml") do |filename|
            name = File.basename filename, ".haml"
            params, template = load name, true
            greediness = params["greedy"] ? :greedy : :nongreedy
            @@template_names[greediness] << name
            @@template_names[:independent] << name if params["independent"]
          end
        end
      end

      # Load template, which consists of HAML + Middleman-style frontmatter.
      # 
      # @param is_user_template - true if requested template is user-generated,
      #   not one of the basic bundled ones.
      # 
      # @return template_params (hash), raw HAML template
      # 
      def load(name, is_user_template = false)
        template = IO.read(template_path(name, is_user_template))
        yaml, haml = split_frontmatter(template)
        params = YAML.load yaml
        return params, haml
      end

      # Do HAML render.
      # 
      # Use ActionView instead of Haml::Engine because we need our Rails helpers.
      # 
      def render_template(name, is_user_template, render_params)
        template_params, haml = load(name, is_user_template)
        renderer.render(
          inline: haml,
          type: :haml,
          locals: render_params.merge(@@locals))
      end

      # Filesystem utility
      # 
      def template_path(name, is_user_template)
        template_dir = is_user_template ? @@user_template_dir : @@TEMPLATE_DIR
        File.join template_dir, "#{name}.haml"
      end

      # HAML templates use Middleman-style YAML frontmatter. Separate it out.
      # 
      def split_frontmatter(text)
        text.split("---\n").reject(&:empty?)
      end

      # Set config value, then reset cache.
      # 
      def user_template_dir=(user_template_dir)
        @@user_template_dir = user_template_dir
        scan_user_templates
      end

      # Set config value, then reset cache.
      # 
      def locals=(locals)
        @@locals = locals
      end

      # Return an ActionView instance with helpers monkeypatched in.
      # 
      # https://gist.github.com/aliang/1022384
      # 
      def renderer
        action_view = ActionView::Base.new(Rails.configuration.paths["app/views"])
        action_view.class_eval do 
          include Rails.application.routes.url_helpers
          include ApplicationHelper

          def protect_against_forgery?
            false
          end
        end
        return action_view
      end
    end

  end
end
