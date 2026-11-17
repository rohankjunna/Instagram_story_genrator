import hashlib
import io
from pathlib import Path
from threading import Lock

import numpy as np
import pandas as pd
import tensorflow as tf
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError
from rembg import new_session, remove
from tensorflow.keras.applications import VGG16
from tensorflow.keras.preprocessing import image

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
CORS(app)

captions_df = pd.read_csv(Path(__file__).with_name("aesthetic_instagram_captions.csv"))
if "Captions" not in captions_df.columns:
    raise ValueError("The caption CSV must contain a 'Captions' column.")
captions = captions_df["Captions"].dropna().astype(str).tolist()
if not captions:
    raise ValueError("The caption CSV does not contain any captions.")

caption_model = VGG16(weights="imagenet", include_top=False, pooling="avg")
background_session = None
background_session_lock = Lock()


def get_background_session():
    global background_session
    if background_session is None:
        with background_session_lock:
            if background_session is None:
                background_session = new_session("u2net")
    return background_session


def uploaded_image():
    image_file = request.files.get("image")
    if image_file is None:
        raise ValueError("Upload an image using the 'image' field.")

    image_bytes = image_file.read()
    if not image_bytes:
        raise ValueError("The uploaded image is empty.")

    try:
        with Image.open(io.BytesIO(image_bytes)) as uploaded:
            uploaded.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("The uploaded file is not a valid image.") from exc

    return image_bytes


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "Image must be 16 MB or smaller."}), 413


@app.route("/")
def home():
    return jsonify({"status": "ok"})


@app.route("/generate_caption", methods=["POST"])
def generate_caption():
    try:
        image_bytes = uploaded_image()
        img = image.load_img(io.BytesIO(image_bytes), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = tf.keras.applications.vgg16.preprocess_input(img_array)
        features = caption_model.predict(img_array, verbose=0)

        image_digest = hashlib.sha256(
            np.asarray(features, dtype=np.float32).tobytes()
        ).digest()
        caption_index = int.from_bytes(image_digest[:8], "big") % len(captions)
        return jsonify({"caption": captions[caption_index]})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("Caption generation failed")
        return jsonify({"error": "Caption generation failed. Please try another image."}), 500


@app.route("/remove_background", methods=["POST"])
def remove_background():
    try:
        image_bytes = uploaded_image()
        sticker_png = remove(image_bytes, session=get_background_session())
        return send_file(
            io.BytesIO(sticker_png),
            mimetype="image/png",
            download_name="sticker.png",
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("Background removal failed")
        return jsonify({"error": "Background removal failed. Please try another image."}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
