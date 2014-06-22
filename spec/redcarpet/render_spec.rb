require 'spec_helper'

describe Redcarpet::Render::Alongslide do
  
  before :all do
    @markdown = Redcarpet::Markdown.new Redcarpet::Render::Alongslide
  end

  it "passes text through" do
    @markdown.render("# Sweet jubilation").should be_a(String)
  end

end
