# 🐣 Easter Prank Chain

A fun Easter prank you send to your friends as a link. It looks like a cute egg-catching game, so they have no idea what's coming. They tap a falling egg, watch it zoom in and slowly crack open, then get hit with a confetti explosion and a surprise they definitely weren't expecting.

After the prank hits, the site asks them to do the same thing to one of their friends — type in a name, get a personalized link, share it to WhatsApp in one tap. It keeps going from there.

---

## 🌐 Live Demo

> **[🔗 Try it here](https://easter-surprise.vercel.app/)**
> example personalized link:[](https://easter-surprise.vercel.app/?from=Arjun&to=Rahul)

##  How It Works
You create a link with your name + friend's name
        ↓
Friend opens it and sees a personal greeting
        ↓
They play the egg falling game
        ↓
A fake loading bar makes them think they won something
        ↓
FAHH sound + dancing gif — April Fools!
        ↓
They prank their own friends with a new personalized link

## Screens

| Screen | Description |
|--------|-------------|
| **Landing** | Personalized greeting with a glassmorphism card and animated Easter emoji |
| **Egg Game** | Colorful eggs fall from the sky over a pink wildflower meadow |
| **Loading** | Fake prize loading bar with cycling suspense messages |
| **Prank Reveal** | FAHH sound + dancing gif + confetti rain from the top |
| **Chain Forward** | Generate and share your own prank link to keep it going |

## ✨ Features

- 🥚 Decorated eggs fall with wobble animations in 4 patterns — stripes, dots, zigzags, diamonds
- 💥 Tapped egg zooms to center, cracks open in real time synced with sound, then explodes into confetti ribbons
- 🌸 Hand-drawn lush grass and pink wildflower meadow background
- 🐰 Easter bunny slides up to encourage you 
- 🔢 Missed egg counter — eggs splat on the ground with yolk and shell pieces
- 🎁 Fake loading bar fills over 8 seconds with messages like *"Verifying your entry..."*
- 📣 FAHH surprise sound fires at the exact millisecond the bar hits 100%
- 🐱 Dancing gif takes over the screen with confetti raining from above
- 🔗 Every link carries sender and receiver names so it feels personal
- 💬 One-tap WhatsApp share with a pre-written message

## Project Structure
easter-prank/
├── index.html          — all 5 screens
├── style.css           — all styling and animations
├── game.js             — egg game, grass, flowers, bunny system
├── loading.js          — loading bar, sound trigger, reveal
├── transitions.js      — screen switching and URL param reading
└── assets/
    ├── husky.gif           — dancing prank gif
    ├── Baby_Rabbit.gif     — easter bunny encouragement gif
    ├── fahh.mp3            — surprise sound
    ├── crack.mp3           — egg crack sound
    ├── splat.mp3           — egg missed sound
    └── pop.mp3             — confetti pop sound

## 🔗 Sharing the Prank

Share links in this format:

https://easter-surprise.vercel.app/?from=YourName&to=FriendName

**WhatsApp message template:**
I hid something for you this Easter 🐣👇
https://easter-surprise.vercel.app/?from=Arjun&to=Rahul

The site generates this automatically on the last screen — just enter the names and tap Share

## 🛠️ Tech Stack

| Part | Technology |
|------|-----------|
| Language | HTML5 + CSS3 + Vanilla JavaScript |
| Game engine | Canvas API |
| Fonts | Fredoka One, Comfortaa, Nunito — Google Fonts |
| Sounds | Preloaded MP3s|
| Animations | CSS keyframes, DOM manipulation, Lottie GIFs |
| Hosting | Vercel — free |
| Backend | None — fully static frontend |

## 👥 Built By

| Person | Owns |
|--------|------|
| **Sreelekshmi Harikumar* | `game.js`, `loading.js`, `transitions.js` — game logic, screen switching, sound |
| **Sree Lekshmi H** | `index.html`, `style.css` — UI design, animations, asset collection |


## 📦 Assets
| File | Source |
|------|--------|
| `husky.gif` | [lottiefiles.com](https://lottiefiles.com) — any funny dancing gif |
| `Baby_Rabbit.gif` | [lottiefiles.com](https://lottiefiles.com) — easter bunny gif |
| `fahh.mp3` | [mixkit.co](https://mixkit.co) — search *"surprise"* |
| `crack.mp3` | [zapsplat.com](https://zapsplat.com) — search *"egg crack"* |
| `splat.mp3` | [mixkit.co](https://mixkit.co) — search *"splat"* |
| `pop.mp3` | [mixkit.co](https://mixkit.co) — search *"pop"* |
