module Jekyll

  class LocaleLinkTagBlock < Liquid::Block

    include Jekyll::Filters::URLFilters

    def initialize(tag_name, params_string, tokens)
      super
      bind_params(eval("{#{params_string}}"))
    end

    def bind_params(params)
      @ref = params[:ref]
    end

    def render(context)
      text = super
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
