# Image Studio

Image Studio provides two local tools:

- **Create caption** uses VGG16 image features to select a repeatable caption from `backend/aesthetic_instagram_captions.csv`.
- **Make a sticker** uses U²-Net background removal to make a transparent PNG, then lets you place and resize it on another image and download the composite.

## Run locally

Install the backend dependencies from the repository root:

```powershell
python -m pip install -r backend\requirements.txt
```

In one terminal, start the Flask API:

```powershell
python backend\app.py
```

In another terminal, install and start the frontend:

```powershell
cd instagram-c-g
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The Vite development server proxies `/api` requests to Flask on port `5000`.

The first model use may download the VGG16 or U²-Net weights if they are not already cached. Caption choices come from the supplied CSV; the selection is based on the image features and is not open-ended text generation.

## Checks

```powershell
cd instagram-c-g
npm run lint
npm run build
```
