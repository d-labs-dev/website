# Use official Ruby image
FROM ruby:2.7.6

# Install necessary dependencies for Jekyll, AWS CLI, and ImageMagick
RUN apt-get update && apt-get install -y \
  build-essential \
  awscli \
  imagemagick libmagickcore-dev libmagickwand-dev \
  && rm -rf /var/lib/apt/lists/*

# Install bundler globally
RUN gem install bundler -v 2.4.22
# Reason for bundler version 2.4.22:
# > [jekyll 3/7] RUN gem install bundler:
# 34.81 ERROR:  Error installing bundler:
# 34.81   The last version of bundler (>= 0) to support your Ruby & RubyGems was 2.4.22. Try installing it with `gem install bundler -v 2.4.22`
# 34.81   bundler requires Ruby version >= 3.0.0. The current ruby version is 2.7.6.219.

# Set up a working directory inside the container
WORKDIR /usr/src/app

# Copy the Gemfile and Gemfile.lock into the container
COPY Gemfile Gemfile.lock ./

# Install the gems specified in the Gemfile
RUN bundle install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 4000 for Jekyll
EXPOSE 4000

# Run Jekyll in livereload mode
CMD ["bundle", "exec", "jekyll", "serve", "--livereload", "--host", "0.0.0.0"]
