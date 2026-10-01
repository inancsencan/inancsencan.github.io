# Signal Machine

Signal Machine is an interactive audiovisual generative system built with p5.js and p5.sound. It combines a stochastic L-system with real-time audio analysis to generate a continuously changing visual signal.

Instead of using a conventional branching L-system, the system maintains a fixed-length symbolic string composed of four symbols: `A`, `B`, `C`, and `D`. Each symbol is rewritten probabilistically and mapped to a vertical tendency in a horizontal line.

Audio features extracted from an MP3 file can be assigned to different generative parameters through the interface. These mappings allow the same audio source to produce different visual behaviors.

## Features

The system analyzes six audio features:

- Amplitude
- Low-frequency energy
- Middle-frequency energy
- High-frequency energy
- Spectral centroid
- Spectral flux

Each audio feature can be assigned to one of five generative or visual targets:

- Rule Probability
- Generation Timing
- Vertical Displacement
- Line Thickness
- Color

Rule Probability controls the transition between a deterministic and stochastic L-system. When the control value is zero, all symbols rewrite to `A`, producing a flat signal. As the control value increases, the stochastic rules become increasingly active.

Line Thickness and Color use a short history of audio values distributed across the horizontal axis. This allows thickness and color to vary smoothly along different parts of the line rather than changing uniformly across the entire image.

A temporal visualization layer periodically captures the rendered signal. These snapshots move upward and downward while gradually fading, creating a visual trace of recent states.

## Visual Controls

In addition to audio mappings, the interface provides controls for:

- Line thickness multiplier
- Temporal fade duration
- Gradient start color
- Gradient end color

The default color gradient is cyan to magenta.

## Controls

- `P` — Start / pause / resume the complete audiovisual system
- Hold `H` — Show debug HUD and audio analysis values
- `R` — Reset the generative visual state

The HTML interface can be used to change audio mappings and visual parameters while the system is running.

## Running the Project

1. Download or clone the project folder.
2. Place an MP3 file in:

   `audio/track.mp3`

3. Open the project folder in Visual Studio Code.
4. Run `index.html` using a local web server such as the VS Code Live Server extension.
5. Open the page in a modern browser.
6. Press `Space` to start the audiovisual system.
7. Use the interface controls to experiment with different mappings.

The project should be run through a local server rather than opening `index.html` directly with a `file://` URL.
Alternatively, you can use the GitHub link to view it live on my personal website.
Link: https://inancsencan.github.io/projects/iat-882/lab-01/

## Files

```text
lab-01/
├── index.html
├── sketch.js
└── audio/
    └── track.mp3