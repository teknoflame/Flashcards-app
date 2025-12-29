# Sound Effects for StudyFlow

This directory contains sound effects for the flashcard application.

## Required Sound Files

The app expects the following sound files in this directory:

| Filename | Purpose | Description |
|----------|---------|-------------|
| `flip.mp3` | Card flip | Page turning sound |
| `enter-study.mp3` | Enter study mode | Pleasant chime/notification sound |
| `exit-study.mp3` | Exit study mode | Pleasant chime/notification sound |
| `correct.mp3` | Quiz mode - correct answer | "Tada!" or success sound |
| `wrong.mp3` | Quiz mode - wrong answer | Gentle buzz or "wa-wa" sound |

## Recommended Sound Sources (Royalty-Free)

### Option 1: Freesound.org
- **Website**: https://freesound.org
- **License**: Creative Commons (check individual sounds)
- **Search suggestions**:
  - "page turn" → flip.mp3
  - "chime notification" → enter-study.mp3, exit-study.mp3
  - "success tada" → correct.mp3
  - "wrong buzz" → wrong.mp3

### Option 2: Zapsplat.com
- **Website**: https://www.zapsplat.com
- **License**: Free with attribution (or royalty-free with subscription)
- **Categories**: UI sounds, cartoon sounds, notifications

### Option 3: Mixkit.co
- **Website**: https://mixkit.co/free-sound-effects/
- **License**: Free for commercial and personal use
- **Good for**: Clean, professional UI sounds

### Option 4: Pixabay Sound Effects
- **Website**: https://pixabay.com/sound-effects/
- **License**: Free for commercial use, no attribution required
- **Good for**: Simple, high-quality sounds

## File Format Requirements

- **Recommended**: MP3 format (best browser compatibility)
- **Acceptable**: WAV, OGG
- **File size**: Keep under 100KB per file for fast loading
- **Sample rate**: 44.1kHz or 48kHz
- **Bit rate**: 128kbps or higher for MP3

## Installation

1. Download your chosen sound files from the sources above
2. Rename them to match the filenames in the table above
3. Place them in this `/sounds/` directory
4. The app will automatically detect and play them

## Muting Sounds

Users can mute sounds by clicking the mute toggle button in the app interface (top-right corner of the navigation).

## Troubleshooting

**Sounds not playing?**
- Check browser console for errors
- Ensure files are named exactly as shown above (case-sensitive)
- Verify files are valid audio files (try playing them directly)
- Check that you're running the app via `npm start` (http://localhost:8000)

**Sounds are delayed or choppy?**
- Reduce file size (compress audio files)
- Use MP3 format instead of WAV
- Check browser performance (close other tabs)
