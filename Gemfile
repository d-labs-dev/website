source "https://rubygems.org"

# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!

# jekyll-assets is not compatible with Jekyll 4 and above
gem "jekyll", "~> 3.9.2"

# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins

# If you have any plugins, put them here!
group :jekyll_plugins do
  gem "jekyll-contentful-data-import"
  gem "jekyll-seo-tag"
  gem "jekyll-assets"
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
install_if -> { RUBY_PLATFORM =~ %r!mingw|mswin|java! } do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.0", :install_if => Gem.win_platform?
gem "mini_magick"
gem "image_optim"

gem "uglifier"

# needed for jekyll serve
gem "kramdown-parser-gfm"

# jekyll serve requires version < 4, so we need to use the downgraded version
gem "sprockets", "~> 3.7" 

gem "mini_racer"