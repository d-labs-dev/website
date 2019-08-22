module Jekyll

  module Sanitizer
    # strip characters and whitespace to create valid filenames, also lowercase
    def sanitize_filename(name)
      if(name.is_a? Integer)
        return name.to_s
      end
      return name.tr(
  "ÀÁÂÃÄÅàáâãäåĀāĂăĄąÇçĆćĈĉĊċČčÐðĎďĐđÈÉÊËèéêëĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħÌÍÎÏìíîïĨĩĪīĬĭĮįİıĴĵĶķĸĹĺĻļĽľĿŀŁłÑñŃńŅņŇňŉŊŋÑñÒÓÔÕÖØòóôõöøŌōŎŏŐőŔŕŖŗŘřŚśŜŝŞşŠšſŢţŤťŦŧÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųŴŵÝýÿŶŷŸŹźŻżŽž",
  "AAAAAAaaaaaaAaAaAaCcCcCcCcCcDdDdDdEEEEeeeeEeEeEeEeEeGgGgGgGgHhHhIIIIiiiiIiIiIiIiIiJjKkkLlLlLlLlLlNnNnNnNnnNnNnOOOOOOooooooOoOoOoRrRrRrSsSsSsSssTtTtTtUUUUuuuuUuUuUuUuUuUuWwYyyYyYZzZzZz"
).downcase.strip.gsub(' ', '-').gsub(/[^\w.-]/, '')
    end
  end

  class TagPage < Page

    include Sanitizer

    def initialize(site, base, tag, dir, pages, locale, kind)

      @site = site
      @base = base

      if tag == nil
        puts "error (tag_page_generator). empty value for field '#{tag}'"
      else
        filename = sanitize_filename(tag).to_s

        @dir = dir
        @name = filename + ".html"

        self.process(@name)
        self.read_yaml(File.join(base, '_layouts'), "tag.html")
        self.data['title'] = tag
        self.data['ref'] = tag
        self.data['locale'] = locale
        self.data['tag'] = tag
        self.data['tag_pages_data'] = pages
        self.data['tag_kind'] = kind
      end
    end
  end

  class TagPagesGenerator < Generator

    safe true

    def generate_tag_pages(site, data, base_url, locale, kind)
      pages_with_tags = data.select { |page| page['tags'] }
      tags = pages_with_tags.flat_map { |page| page['tags'] }
      tags.uniq.each do |tag|
        pages_with_tag = pages_with_tags.select { |page| page['tags'].include?(tag) }
        site.pages << TagPage.new(site, site.source, tag, base_url, pages_with_tag, locale, kind)
      end
    end

    def generate(site)
      generate_tag_pages(site, site.data['contentful']['de']['blogPost'], '/blog/tags', 'de', 'blogPost')
      generate_tag_pages(site, site.data['contentful']['en']['blogPost'], '/en/blog/tags', 'en', 'blogPost')
      generate_tag_pages(site, site.data['contentful']['de']['method'], '/methods/tags', 'de', 'method')
      generate_tag_pages(site, site.data['contentful']['en']['method'], '/en/methods/tags', 'en', 'method')
    end

  end

  class TagPageLinkTag < Liquid::Block

    include Sanitizer

    KIND_BASE_PATHES = { 'blogPost' => 'blog', 'method' => 'methods' }

    def initialize(tag_name, params_string, tokens)
      super
      @input = params_string
    end

    def render(context)
      text = super
      rendered_input = Liquid::Template.parse(@input).render(context).split(' ', 2)
      kind = rendered_input[0]
      tag = sanitize_filename(rendered_input[1])

      this_page = context.registers[:page]
      current_locale = this_page['locale']

      return "<a href='/#{current_locale}/#{KIND_BASE_PATHES[kind]}/tags/#{tag}.html'>#{text}</a>" if current_locale != 'de'
      return "<a href='/#{KIND_BASE_PATHES[kind]}/tags/#{tag}.html'>#{text}</a>"

    end

  end

end

Liquid::Template.register_tag('link_tag_page', Jekyll::TagPageLinkTag)
