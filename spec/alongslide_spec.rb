require 'spec_helper'

describe Alongslide do

  describe "rendering" do
    it "should render a whole document" do
      html = Alongslide::render <<-MARKDOWN.strip_heredoc
            + panel AnyPanel fullscreen

        Body text.
      MARKDOWN
      html.should_not be_nil
    end

    it "should gracefully catch ALS syntax errors" do
      expect {
        Alongslide::render <<-MARKDOWN.strip_heredoc
              + bogus

          Body text.
        MARKDOWN
      }.to raise_error Alongslide::SyntaxError
    end
  end

end
