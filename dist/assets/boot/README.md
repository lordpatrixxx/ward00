# WARD00 boot cinematic

`ward00-boot.mp4` is an original silent, eight-second cinematic made for this project. It depicts a fictional city as a glass map: a lidar pulse raises the city, then the previously missing neighborhood emerges in amber and reconnects to the network. The illustration is atmospheric, not a geographic or hydrological simulation.

## Provenance

All city geometry, river curves, bridge lines, scan pulses, particles, lighting, camera motion, and composition were authored procedurally in `tools/render-boot.py`. The renderer projects three-dimensional building geometry into frames and encodes those frames with FFmpeg. No stock footage, external illustrations, or third-party AI video generator was used. There are no voices, music, identifying information, text, logos, or watermarks embedded in this asset.

The video and poster may be used, modified, and redistributed with this project. Tool dependencies retain their own licenses: Pillow (HPND), NumPy (BSD), and FFmpeg (license varies with the installed build). Those tools are used during asset creation and are not shipped as part of the website.

## Files

- `ward00-boot.mp4`: H.264, 1280 × 720, 30 fps, 8 seconds, yuv420p, fast-start metadata, no audio track.
- `poster.webp`: matching last-stage city view for slow connections and reduced-motion fallback.

The scene begins nearly black, builds over the first four seconds, reveals the amber ward at approximately 4.5–5.7 seconds, and settles over the last second. Keep title/status text as accessible HTML over the lower portion of the video. Provide a skip button and respect reduced-motion preferences.

## Reproduce

Install Python 3, Pillow, NumPy, and FFmpeg. From the repository root:

```sh
python -m pip install Pillow numpy
python tools/render-boot.py
```

If FFmpeg is not on PATH, pass `--ffmpeg /absolute/path/to/ffmpeg`. Use `--stills-only` to render the poster and three review frames without encoding. Temporary review frames are written to `work/boot-render/` and are not required for deployment.
