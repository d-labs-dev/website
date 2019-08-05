module Jekyll

  class LanguageSwitcherTag < Liquid::Tag

    LOCALE_BASE_PATHES = { 'de' => '/', 'en' => '/en' }
    LOCALE_NAMES = { 'de' => 'Deutsch', 'en' => 'English' }

    def initialize(tag_name, text, tokens)
      super
      @text = text
    end

    def render(context)

      @site = context.registers[:site]
      this_page = context.registers[:page]
      current_language = this_page['locale']
      switch_to_language = current_language.eql?('de') ? 'en' : 'de'
      
      return "<a href='#{LOCALE_BASE_PATHES[switch_to_language]}'>#{LOCALE_NAMES[switch_to_language]}</a>" if this_page['ref'].nil?

      translated_page = @site.pages.find do |that_page|
        that_page["ref"] == this_page["ref"] and that_page["locale"] != this_page["locale"]
      end

      return "<a href='#{LOCALE_BASE_PATHES[switch_to_language]}'>#{LOCALE_NAMES[switch_to_language]}</a>" if translated_page.nil?
      return "<a href='#{translated_page.url}'>#{LOCALE_NAMES[switch_to_language]}</a>"

    end

  end

end

Liquid::Template.register_tag('language_switcher', Jekyll::LanguageSwitcherTag)
