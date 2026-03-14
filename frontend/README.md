# Frontend Setup (Flask + Jinja + Tailwind + daisyUI)

This folder contains frontend assets and Jinja templates for Flask routes.

## Install dependencies

```bash
cd frontend
npm install
```

## Build CSS once

```bash
npm run build:css
```

## Watch CSS while developing

```bash
npm run watch:css
```

Flask templates are in `templates/` and compiled CSS output is in `static/css/output.css`.

In Flask route handlers, render templates as usual:

```python
return render_template("index.html")
```
