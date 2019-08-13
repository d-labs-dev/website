module Jekyll

  class LocaleLinkTagBlock < Liquid::Block

    include Jekyll::Filters::URLFilters

    def initialize(tag_name, params_string, tokens)
      super
      @input = params_string
    end

    def render(context)
      text = super
      rendered_input = Liquid::Template.parse(@input).render(context)
      @ref = rendered_input.split[0]

      site = context.registers[:site]
      page = context.registers[:page]
      locale = page['locale']

      site.pages.each do |each|
        return "<a href=\"#{each.url}\">#{text}</a>" if each["ref"] == @ref and each["locale"] == locale
      end

      raise ArgumentError, <<~MSG
        Could not find ref '#{@ref}' in tag 'LocaleLinkTagBlock'.
        Make sure the page exists for the '#{locale}' locale.
      MSG

    end

  end

end

Liquid::Template.register_tag('locale_link', Jekyll::LocaleLinkTagBlock)
