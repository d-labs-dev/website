module Jekyll

  class LocaleLinkTagBlock < Liquid::Block

    include Jekyll::Filters::URLFilters

    def initialize(tag_name, params_string, tokens)
      super
      @input = params_string
      @attributes = {}

      params_string.scan(Liquid::TagAttributes) do |key, value|
        @attributes[key] = value.gsub(/^'|"/, '').gsub(/'|"$/, '')
      end
    end

    def render(context)
      text = super
      rendered_input = Liquid::Template.parse(@input).render(context)
      @ref = rendered_input.split[0]


      site = context.registers[:site]
      page = context.registers[:page]
      locale = page['locale']
      link_classes = (@attributes['class'] || "").to_s
      site.pages.each do |node|
        return "<a href=\"#{node.url}\" class=\"#{page["url"] == node.url ? "is-active " : ""}#{link_classes}\">#{text}</a>" if node["ref"] == @ref and node["locale"] == locale
      end

      raise ArgumentError, <<~MSG
        Could not find ref '#{@ref}' in tag 'LocaleLinkTagBlock'.
        Make sure the page exists for the '#{locale}' locale.
      MSG

    end

  end

end

Liquid::Template.register_tag('locale_link', Jekyll::LocaleLinkTagBlock)
