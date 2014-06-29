require 'spec_helper'

describe Alongslide::Grammar::RootParser do
  
  before :all do
    Alongslide.configure do |config|
      config.user_template_dir = File.expand_path("../fixtures", File.dirname(__FILE__))
    end

    @parser = Alongslide::Grammar::RootParser.new
    @panel_name = "SomePanel"
    @section_name = "SomeSection"
  end

  before :each do
    Rails.stub :configuration do
      double(paths: {"app/views" => nil})
    end
  end

  describe "panels" do
    it "should show and unpin" do
      parsed = @parser.parse <<-MARKDOWN.strip_heredoc
        + panel #{@panel_name} pin bottom

        + unpin #{@panel_name}
      MARKDOWN
      parsed.should_not be_nil
      parsed.render.should include(@panel_name)
    end

    it "should support templateless panels" do
      panel_text = "Some text directly in the panel."
      parsed = @parser.parse <<-MARKDOWN.strip_heredoc
        + panel #{@panel_name}

        #{panel_text}
      MARKDOWN
      parsed.should_not be_nil
      parsed.render.should include(panel_text)
    end

    describe "parameters" do
      it "should pin" do
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel #{@panel_name} pin left
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should_not be_nil
      end

      it "should fullscreen" do
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel #{@panel_name} fullscreen
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should_not be_nil
      end

      it "should pin and fade" do
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel #{@panel_name} pin top fade-in
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should_not be_nil
      end
    end

    describe "panel templates" do
      it "should nest templates within greedy templates" do
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel #{@panel_name}

          + gallery

          + image
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should include("gallery")
      end

      it "should treat nongreedy templates as siblings" do
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel #{@panel_name}

          + image

          + image
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should include("image")
      end

      it "should support nongreedy template (multiline) text contents" do
        text_contents = "Some Text Contents"
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel a

          + image

          #{text_contents}
          #{text_contents}
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should include(text_contents)
      end

      it "should support template parameters" do
        url = "http://some-image.com/over_there.jpg?q=999"
        alt_text = "Some \\\"alternate\\\" text."
        parsed = @parser.parse <<-MARKDOWN.strip_heredoc
          + panel a

          + image url "#{url}" alt "#{alt_text}"
        MARKDOWN
        parsed.should_not be_nil
        parsed.render.should include(url)
        parsed.render.should include(alt_text.gsub(/\\"/, '"'))
      end
    end
  end

  describe "sections" do
    it "should enter and exit" do
      parsed = @parser.parse <<-MARKDOWN.strip_heredoc
        + section #{@section_name}

        + exit #{@section_name}
      MARKDOWN
      parsed.should_not be_nil
      parsed.render.should include(@section_name)
    end

    it "should support transitions" do
      valid_transition_class = "fade-in"
      parsed = @parser.parse <<-MARKDOWN.strip_heredoc
        + section #{@section_name} #{valid_transition_class}
      MARKDOWN
      parsed.should_not be_nil
      parsed.render.should include(valid_transition_class)
    end
  end

  describe "bad syntax" do
    it "should catch bad syntax" do
      parsed = @parser.parse <<-MARKDOWN.strip_heredoc
        + bogus
      MARKDOWN
      parsed.should be_nil
    end
  end
end
