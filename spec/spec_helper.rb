require 'alongslide'

# ActiveSupport monkeypatch modified to work with few requires.
# 
# http://apidock.com/rails/String/strip_heredoc
# 
class String
  def strip_heredoc
    indent = scan(/^[ \t]*(?=\S)/).min.send(:size) || 0
    gsub(/^[ \t]{#{indent}}/, '')
  end
end
