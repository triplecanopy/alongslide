# 
# alongslide_generator.rb: Generate (copy) initializer for Rails app.
# 
# Copyright 2013 Canopy Canopy Canopy, Inc.
# 

class AlongslideGenerator < Rails::Generators::Base
  source_root File.expand_path('../templates', __FILE__)

  def copy_initializer_file
    copy_file "alongslide.rb", "config/initializers/alongslide.rb"
  end
end
