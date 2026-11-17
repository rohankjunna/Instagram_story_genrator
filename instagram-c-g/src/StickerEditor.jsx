import { useEffect, useRef, useState } from "react";

function StickerEditor() {
  const canvasRef = useRef(null);
  const dragOffset = useRef(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [stickerBlob, setStickerBlob] = useState(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [stickerUrl, setStickerUrl] = useState("");
  const [canvasSize, setCanvasSize] = useState(null);
  const [stickerCenter, setStickerCenter] = useState(null);
  const [stickerAspectRatio, setStickerAspectRatio] = useState(1);
  const [scale, setScale] = useState(0.35);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sourceFile) {
      setSourcePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  useEffect(() => {
    if (!backgroundFile) {
      setBackgroundUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(backgroundFile);
    setBackgroundUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [backgroundFile]);

  useEffect(() => {
    if (!stickerBlob) {
      setStickerUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(stickerBlob);
    setStickerUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stickerBlob]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundUrl) {
      setCanvasSize(null);
      setStickerCenter(null);
      return undefined;
    }

    const background = new Image();
    background.onload = () => {
      canvas.width = background.naturalWidth;
      canvas.height = background.naturalHeight;
      setCanvasSize({ width: background.naturalWidth, height: background.naturalHeight });
      setStickerCenter((center) => center ?? {
        x: background.naturalWidth / 2,
        y: background.naturalHeight / 2,
      });

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(background, 0, 0);

      if (!stickerUrl) {
        return;
      }

      const sticker = new Image();
      sticker.onload = () => {
        setStickerAspectRatio(sticker.naturalHeight / sticker.naturalWidth);
        const width = background.naturalWidth * scale;
        const height = width * (sticker.naturalHeight / sticker.naturalWidth);
        const center = stickerCenter ?? {
          x: background.naturalWidth / 2,
          y: background.naturalHeight / 2,
        };
        context.drawImage(sticker, center.x - width / 2, center.y - height / 2, width, height);
      };
      sticker.src = stickerUrl;
    };
    background.src = backgroundUrl;

    return () => {
      background.onload = null;
    };
  }, [backgroundUrl, stickerUrl, stickerCenter, scale]);

  const removeBackground = async () => {
    if (!sourceFile) {
      setError("Choose a subject image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", sourceFile);
    setIsRemovingBackground(true);
    setError("");

    try {
      const response = await fetch("/api/remove_background", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Background removal failed.");
      }
      setStickerBlob(await response.blob());
    } catch (requestError) {
      setError(requestError.message || "Could not connect to the image service.");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const pointerPosition = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const handlePointerDown = (event) => {
    if (!stickerUrl || !canvasSize) {
      return;
    }
    const point = pointerPosition(event);
    const center = stickerCenter ?? { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    const stickerWidth = canvasSize.width * scale;
    const stickerHeight = stickerWidth * stickerAspectRatio;
    if (
      point.x < center.x - stickerWidth / 2 ||
      point.x > center.x + stickerWidth / 2 ||
      point.y < center.y - stickerHeight / 2 ||
      point.y > center.y + stickerHeight / 2
    ) {
      return;
    }
    dragOffset.current = { x: point.x - center.x, y: point.y - center.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragOffset.current) {
      return;
    }
    const point = pointerPosition(event);
    setStickerCenter({
      x: point.x - dragOffset.current.x,
      y: point.y - dragOffset.current.y,
    });
  };

  const downloadComposite = () => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundUrl || !stickerUrl) {
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export the image. Please try again.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "instagram-sticker.png";
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <section className="tool-panel" aria-labelledby="sticker-heading">
      <h1 id="sticker-heading">Make a sticker</h1>
      <p className="tool-description">
        Remove a subject&apos;s background, choose a new scene, then drag and resize
        the sticker on the canvas.
      </p>

      <div className="sticker-controls">
        <div className="card">
          <div className="card-body">
            <label className="form-label" htmlFor="subject-image">
              1. Choose a subject image
            </label>
            <input
              id="subject-image"
              className="form-control mb-3"
              type="file"
              accept="image/*"
              onChange={(event) => {
                setSourceFile(event.target.files?.[0] ?? null);
                setStickerBlob(null);
                setError("");
              }}
            />
            {sourcePreview && (
              <img className="subject-preview mb-3" src={sourcePreview} alt="Subject preview" />
            )}
            <button
              className="btn btn-primary w-100"
              type="button"
              onClick={removeBackground}
              disabled={isRemovingBackground || !sourceFile}
            >
              {isRemovingBackground ? "Removing background..." : "Remove background"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <label className="form-label" htmlFor="background-image">
              2. Choose a new background
            </label>
            <input
              id="background-image"
              className="form-control mb-3"
              type="file"
              accept="image/*"
              onChange={(event) => {
                setBackgroundFile(event.target.files?.[0] ?? null);
                setStickerCenter(null);
              }}
            />
            <label className="form-label" htmlFor="sticker-scale">
              Sticker size
            </label>
            <input
              id="sticker-scale"
              className="form-range"
              type="range"
              min="0.1"
              max="0.8"
              step="0.01"
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              disabled={!stickerUrl}
            />
            <button
              className="btn btn-success w-100 mt-2"
              type="button"
              onClick={downloadComposite}
              disabled={!stickerUrl || !backgroundUrl}
            >
              Download composite
            </button>
          </div>
        </div>
      </div>

      {error && <p className="alert alert-danger mt-3">{error}</p>}

      <div className="sticker-canvas-wrap mt-4">
        <p className="mb-2">3. Drag the sticker to position it</p>
        {backgroundUrl ? (
          <canvas
            ref={canvasRef}
            className={`sticker-canvas${stickerUrl ? " is-draggable" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => { dragOffset.current = null; }}
            onPointerCancel={() => { dragOffset.current = null; }}
            aria-label="Image composition canvas"
          />
        ) : (
          <div className="canvas-placeholder">Choose a background to start your composition</div>
        )}
      </div>
    </section>
  );
}

export default StickerEditor;
