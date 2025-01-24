# D‑LABS Website

## Setup

1. create `.env` file and add `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`
2. Load these env vars and load contentful data

```bash
env $(cat .env | xargs) bundle exec jekyll contentful
```

3. Use docker to run the app

```bash
docker compose up
```

4. open `http://127.0.0.1:4000/` in browser
