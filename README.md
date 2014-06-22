# Alongslide

Alongslide is a layout engine extending Markdown syntax.

It was developed by [Triple Canopy](http://canopycanopycanopy.com/) as a
text-editable yet sophisticated platform for producing long-form reading
content on the web.

Try the demo at [alongslide.com](http://alongslide.com) or [read some theory](http://canopycanopycanopy.com/contents/announcing_alongslide) underlying the project.

## Dependencies

The Ruby backend uses Redcarpet to extract layout directives from the
Markdown, Treetop to parse their grammar, and HAML to render them into
templates.

The CoffeeScript/SASS frontend then scan the resulting HTML for layout
cues, using Adobe's CSS Regions polyfill to flow the body text, and
skrollr to build transition animations and respond to user scrolling.

*Copyright 2013 Canopy Canopy Canopy, Inc.*

## Syntax

Alongslide blocks override the normal Markdown behavior for code blocks.
Any text indented by four spaces will be handled by Alongslide.

Within these blocks, special directives indicate which templates to render.
Directives begin with a plus sign.

For example:

```
Flowing paragraph text...

	+ panel BigPanel fullscreen
	
	# Huge text in a huge panel.
	
Flowing paragraph text continues...

```

## Adding templates

Templates are in `views/`. While basic `panel` and `section` templates are closely wedded to the frontend parser, panel templates may contain other templates, which are preloaded from `panel/content/`.

### Nesting templates

Each template begins with Middleman-style YAML frontmatter. Currently only one value is read: `greedy`, which refers to whether the template may contain other templates or not. If `true`, the template represents a
greedy node, and can contain other templates; if `false`, it is
non-greedy, and therefore cannot contain other templates.

For example:

```
Flowing paragraph text...

	+ panel GalleryPanel fullscreen
	
	+ gallery
	
	+ image url "/one.jpg"

	+ image url "/two.jpg"	

Flowing paragraph text continues...

```

In the above example, the two (nongreedy) `image` templates will both be
contained by the `gallery` template (greedy), which in turn will be contained by the `panel` template (greedy).

### Template parameters

The syntax parser accepts arbitrary key/value pairs for templates, which are handed as they are to the HAML engine.

Nongreedy templates additionally consume any arbitrary Markdown which appears
below them.

For example:

```
    + image url "/one.jpg" position top opacity 0.5 note "A \"nice\" note"
    
    Caption for _A Very Nice Image_.

```

In the above example, the `image.haml` template would receive variables for `url`, `position`, `opacity`, and `note`—in addition to a variable called `content`, which would contain the rendered HTML from the Markdown caption below.

Each inline parameter value may optionally be enclosed in double quotation marks, with space and backslash-escaped quotes inside.

## Adding panel parameters

To add functionality to the system, follow the path through the full stack,
from back to front:

1. Add appropriate rules to `panel_params` in `panel.treetop` (consult [Treetop documentation](http://treetop.rubyforge.org/syntactic_recognition.html) for syntax)
* Write tests for parsing the new rules in `parser_spec.rb`
* Make sure the appropriate `SyntaxNode` subclass (defined in `parser.rb`) puts the Treetop data into the correct param for the template (`panel.haml`). By default, it'll just lump it in as a CSS class.
* Add logic to parse the param in `checkForDirectives()` in `alongslide.coffee` adding CSS rules as necessary in `alongslide.sass`

## Layout Engine

On the front end, a layout engine written in CoffeeScript parses the layout cues (typically `<div>`s with special meta CSS classes) and renders the content as overlapping horizontally-scrolling **frames** (where one frame is one screen width).

### Process

1. **Pull panels out of flowing body text.** Alongslide supports flowing body text and **panels**, which behave like sidebars. In this step, pull those panels out, and index them by ID, to be displayed later.
* **Separate sections.** Because Alongslide follows the CSS Regions specification, multiple text sections may not flow from a single "source" in the DOM. In this step, break up the single source element into the appopriate number of DOM elements, and register each as the source for a single NamedFlow, using CSS Regions JS integration.
* **Lay out.** Iterate through the NamedFlows (and their respective sections), creating flowing **columns** (and their respective **frames**) one at a time, checking each for relevant cues about panel placement. If a panel directive is found, ensure that the panel appears and is dismissed at the correct points in the piece, and that the flowing text wraps around it (by applying CSS classes). In this step, each frame, whether flowing, panel, or section background, is assigned temporary DOM `data-` attributes (`alongslide-show-at` and `alongslide-hide-at`), to be parsed in the next step.
* **Apply scroll transitions.** Once the positioning of every frame has been decided, convert all of the temporary `data-` attributes to specific skrollr transitions, which may scroll, fade, etc.
* **Clean up**. Currently, this just entails resizing the frame container to fit total width of the frames (so that the scroll bar is proportional).

### CSS Regions

As the CSS Regions specification is under active development, Alongslide does not rely on correct browser implementation. Instead, it forces all browsers to use the Adobe polyfill. (And will continue to until the spec is firmed up.)
