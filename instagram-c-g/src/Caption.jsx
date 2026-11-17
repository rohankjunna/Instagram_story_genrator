import { useEffect, useState } from "react";

function Caption() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
    setCaption("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!image) {
      setError("Choose an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate_caption", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Caption generation failed.");
      }
      setCaption(data.caption);
    } catch (requestError) {
      setError(requestError.message || "Could not connect to the caption service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="tool-panel" aria-labelledby="caption-heading">
      <h1 id="caption-heading">Create a caption</h1>
      <p className="tool-description">
        Upload a photo to select an image-conditioned caption from the captions
        collection.
      </p>
      <div className="card caption-card">
        {previewUrl ? (
          <img src={previewUrl} className="card-img-top caption-preview" alt="Selected upload" />
        ) : (
          <div className="caption-placeholder">Your image preview will appear here</div>
        )}
        <div className="card-body">
          <label className="form-label" htmlFor="caption-image">
            Choose an image
          </label>
          <input
            id="caption-image"
            className="form-control mb-3"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate caption"}
          </button>
          {caption && <p className="caption-result mt-3 mb-0">{caption}</p>}
          {error && <p className="alert alert-danger mt-3 mb-0">{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default Caption;
