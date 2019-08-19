# D-LABS Website

## Setup

1. Setup Ruby
2. Install jekyll and bundler globally
  ```bash
  gem install jekyll bundler
  ```
3. Clone this repo and `cd` into it
4. `bundle install`
5. create `.env` file and add `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`
6. Load these env vars and load contentful data
  ```bash
  env $(cat .env | xargs) bundle exec jekyll contentful
  ```
7. Start jekyll
  ```bash
  bundle exec jekyll serve
  ```
8. open `http://127.0.0.1:4000/` in browser
