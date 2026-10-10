# Tara assets — 10 October 2026

The live avatar is an original procedural 3D mesh authored for this project in `src/tara-model.js`, exported as `dist/assets/tara/tara-naik.glb`. It is not an image-to-3D reconstruction. Browser animation uses the same mesh source with named facial parts. The GLB includes one breathing animation; the live renderer additionally animates speech amplitude, eyes, head, eyebrows, and ponytail. See the pinned Three.js MIT license in `dist/vendor/`.

`dist/assets/tara/tara-3d-portrait.png` is separate AI-generated 3D-style raster portrait art. It is used for portrait mode, intro artwork and the no-WebGL fallback; it is not the mesh itself. Generated using the built-in ImageGen tool in this session, with the existing `tara-neutral.webp` as an identity and wardrobe reference. Transparent alpha is preserved in the original PNG. No image-generation API key or external video service was used.

## Exact final portrait prompt

Use case: stylized-concept. Asset type: original 3D-rendered character portrait for a cinematic narrative flood-response game, WARD00. The supplied image is an identity/costume reference, not an edit target. Create a polished premium animated-film 3D render of Tara Naik, a 19-year-old Indian engineering student with warm medium-brown skin, expressive dark brown eyes, black hair tied in a practical ponytail, mustard-yellow monsoon rain jacket, charcoal backpack straps, compact field radio clipped to one strap. Preserve recognizable facial identity and outfit from reference, but change illustration medium to physically rendered dimensional 3D with beautiful soft skin shading, defined natural nose, rounded lips, sculpted hair strands, fine rain droplets on jacket. Warm, intelligent, determined expression, lips gently closed; looking slightly toward viewer. Waist-up portrait, both shoulders and top of head fully visible with generous margins, upright neutral pose, natural adult proportions. Transparent background, clean isolated cutout, no floor or room. Soft warm key light and delicate turquoise rim light, nuanced shadows. No text, logos, watermark, extra limbs, gadgets in hands, chibi proportions or exaggerated sexual features. This is concept/fallback portrait artwork for the live mesh character.

## Existing assets

The seven earlier illustrated portrait variants and bundled voice clips were already present in the local project at the start of this change. They were preserved. No claim is made here about their original provider, voice performer, or studio provenance. The dialogue remains captioned, and browser speech synthesis is a fallback if bundled audio cannot play.

## Boot video

`dist/assets/boot/ward00-boot.mp4` is an original eight-second silent rendered 3D-map motion graphic, 1280×720 at 30 fps. Reproducible source and provenance are documented beside the video and in `tools/render-boot.py`.
