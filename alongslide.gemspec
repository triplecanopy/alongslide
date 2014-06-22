Gem::Specification.new do |gem|
  gem.name    = 'alongslide'
  gem.version = '0.9.0'

  gem.summary = "Create dynamic web layouts with an extended Markdown syntax"
  gem.description = "Create dynamic web layouts with an extended Markdown syntax"

  gem.authors  = ['Adam Florin', 'Anthony Tran']
  gem.email    = 'adam@canopycanopycanopy.com'
  gem.homepage = 'http://github.com/triplecanopy'

  gem.add_dependency('redcarpet')
  gem.add_dependency('treetop')
  gem.add_dependency('polyglot')
  gem.add_development_dependency('rspec')

  # ensure the gem is built out of versioned files
  gem.files = Dir['Rakefile', '{bin,lib,man,test,spec}/**/*', 'README*', 'LICENSE*'] & `git ls-files -z`.split("\0")
end
