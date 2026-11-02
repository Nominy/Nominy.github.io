---
title: "Format Sweet Spots: a 3M-parameter model learns to write 29-byte JPEG XL art from one person's clicks"
pubDate: 2026-11-03
description: "A 3M-parameter model learns to write 29-byte JPEG XL art from 24,000 random programs and one person's 1,442 clicks; its matches to human pieces turn out to be format sweet spots."
author: "Naft San"
image:
  url: "/posts/jxl-art-rlhf/neon_chevron.webp"
  alt: "Neon Chevron: glowing diagonal light trails folding at a sharp tip on black"
tags: ["jpeg xl", "rlhf", "generative art", "machine learning"]
embed: "jxl-blind-test"
---

Over two days I trained a small language model (about 3M parameters) to write JPEG XL art, and then tuned it on my own taste by clicking through pairs of its images, 1,442 of them. The thing at the top of this page is that model running in your browser: in each pair, one image comes from the model before I tuned it and one from after. I built all of this with Claude as a coding partner.

The tuned model is clearly better by my taste. In a blind test afterwards I picked it 39 times out of 50. Some of its images also came out almost identical to pieces from the human JXL art gallery, and I'll get to why that happens further down.

![Twelve hand-picked images from the trained model, each with its checkpoint and byte size.](/posts/jxl-art-rlhf/panel.webp)
*Some images from the tuned model, with the training step and size of each.*

## JXL art

In case you haven't seen it: JPEG XL's lossless mode predicts every pixel from its neighbours using a small decision tree stored in the file, and then stores the prediction errors. If you write the tree yourself and store no errors, the decoder just draws whatever the tree predicts. People found out in 2021 that this gives you surprisingly nice images in a few dozen bytes, and there's a gallery of 241 of them at [jpegxl.info/art](https://jpegxl.info/art/).

Here's one the model wrote, which I named Neon Chevron:

![Neon Chevron, 29 bytes.](/posts/jxl-art-rlhf/neon_chevron.webp)

And here's its whole program, which compiles to 29 bytes:

```
Bitdepth 12
Width 320
Height 320
RCT 13
DeltaPalette
if x > 226
  - Select -1
  - Gradient -5
```

You can paste it into the [online editor](https://www.januschka.com/jxl-art/?zcode=eNodxzEKgDAMBdA9p_gXKNgWHR1U0FFUcC422kARkQweX3F7rxGNfGmCdbRK_OBdQQPLkfTn1C6wnjrOGsaQWZVJdjyo4VxFgMHMmTeFsf_6O0Th83tJLwomGhg) and press Run.

## The setup

I wanted to see whether a really small model could learn to write these without ever seeing the human ones, with my clicks as its only information about what looks good. This is basically RLHF, the method used to tune chat models, at a size where you can look at every single output.

First the model had to learn the language. I wrote a generator that makes random programs and mutates ones that worked, ran it for about 45 minutes, and kept 24,000 programs that compiled to a non-blank image under 256 bytes. I kept the gallery out of this on purpose, for reasons I explain further down. The model uses the Supra2.5-Pico architecture, trained from scratch. After a few minutes of training it wrote working programs about two-thirds of the time, and its images looked like what you'd expect from random programs: noise, checkerboards, stripes.

Then the clicking. I made a small page that shows two images from the current model, and I press left or right, or mark "both bad". A small reward model fits my clicks, and every 25 clicks the language model gets a few RL updates toward what the reward model likes, then I get a new batch. I started on my desktop PC, and when I had chores I moved the run to my MacBook and kept going there. In total that was 1,442 clicks and 820 training steps.

![The labeling page.](/posts/jxl-art-rlhf/labeling_ui.webp)
*The labeling page. The square cards come up again later.*

## Did it work?

Mostly, yes. Fewer programs broke (36% at the start, 10% at the end), and the images got much more interesting while the programs got slightly shorter (median 32 bytes down to 29).

![Random samples from the starting model, step 0.](/posts/jxl-art-rlhf/evolution_step0.webp)
*Random samples before tuning.*

![Random samples from the trained model, step 800, same seed.](/posts/jxl-art-rlhf/evolution_step800.webp)
*Random samples near the end, same seed.*

What I was worried about is that the model would learn to game the reward model instead of getting better. The reward model is just a linear model on CLIP image features, so in principle it's easy to fool. A few things suggest that mostly didn't happen. A separate CLIP-based judge that never saw my clicks also rates the later images higher (0.27 at the start, 0.42 at the end; the human gallery gets 0.47). A reward model fit only on my first 704 clicks, before the later images existed, agrees with the full one. And I clicked "both bad" a lot less as training went on.

After training I also ran a blind test on myself: 50 pairs, one image from before tuning and one from after, shuffled and unlabeled until the end. I picked the tuned model 39 times. It's the same test as the one at the top of this page, so you can check whether you agree with me.

## Reading the programs

Since the outputs are programs, I tried to work out what each part of my favourite one does. That's Neon Chevron, the one above (it was Claude's favourite too). For each token I guessed what it does, changed it, and checked whether the image changed the way I expected:

- The `if x > 226` splits the canvas, and the tip of the chevron sits on that split. Moving the split to 160 moves the tip.
- `Gradient -5` draws the glowing diagonals. Changing the 5 changes how bright the stripes are (−1 gives faint threads, −20 blows them out) but keeps the shape.
- `Select -1` continues the stripes coming from the left, bends them down, and fades them. On its own it draws almost nothing, because there's nothing bright for it to continue.
- `DeltaPalette` is where all the colour comes from. Without it the image is black. `Bitdepth 12` is why it's so dark and saturated; at 8 bits the same program looks washed out.
- `RCT 13` does nothing. It's a colour transform, and with a palette there's nothing for it to transform. Four different values give the same image.

![Twelve variants of Neon Chevron.](/posts/jxl-art-rlhf/neon_chevron_ablation.webp)
*Neon Chevron with one token changed at a time.*

Another one I liked, Fault Line Meadow (28 bytes), works the same way. On one side of a split, a very aggressive predictor setting turns into noise. On the other side, a simple "copy the pixel to the left" rule smears that noise sideways and fades it into green. The mossy texture comes from the program drawing a 128×128 image and asking the decoder to upscale it 8×.

![Eight variants of Fault Line Meadow.](/posts/jxl-art-rlhf/fault_line_meadow_ablation.webp)
*Fault Line Meadow with one token changed at a time.*

I kept seeing this pattern in the model's best images: a split, with one side doing something busy and the other side smearing or fading it.

## The Queen's Fractal

This is the part that got me excited for a while. One of the model's images is nearly identical to "The Queen's Fractal", a 21-byte piece by Jon Sneyers (one of the people behind JPEG XL) whose code was never published. The model's version is a different, 35-byte program. It renders at the same size, and 53% of the pixels match exactly.

![The model's 35-byte image (left) and The Queen's Fractal, 21 bytes (right).](/posts/jxl-art-rlhf/queens_fractal_pair.webp)
*The model's version (left) and Jon Sneyers' original (right).*

Then I checked how often random programs from the training data land on the same image. It's about 1 in 170, and the model made it at roughly the same rate before tuning as after. So it's hard to call this a rediscovery. The image is just easy to hit in this format: Jon found it by hand, random generation finds it by accident, and the model makes it about as often as it always did.

I've been calling these format sweet spots: places in the format where a tiny program produces something rich and structured. The other look-alikes I found look like the same kind of thing, the same visual idea made by a different program, though I haven't measured how often random programs hit those.

![Model images beside the gallery pieces they resemble.](/posts/jxl-art-rlhf/convergent_pairs.webp)
*More of the model's images next to gallery pieces they resemble.*

## What it learned and didn't

The tuning didn't teach it anything new. Human artists use splines and multiple layers; those weren't in the training data, and the model never produced them. It also moved away from the techniques artists use most, like deep trees and separate logic per colour channel. Its outputs stayed as close to its training data as they were at the start. My clicks pushed it toward the parts of what it could already do that I liked.

It also picked up two habits from me that I didn't intend. Programs with an `RCT` line won more often, even though `RCT` does nothing in most of them (see the Neon Chevron test above), and the model ended up putting it in most of its programs. And since the labeling page showed every image in a square card, wide and tall images looked smaller and I picked them less often, so the model learned to prefer square ones. Both are small examples of the usual RLHF problem: the model learns whatever the feedback rewards, including things you didn't mean to reward.

![Top images by the learned taste model, step 820.](/posts/jxl-art-rlhf/best_by_taste.webp)
*The tuned model's best images according to the reward model.*

![Top images by the independent CLIP judge, step 820.](/posts/jxl-art-rlhf/best_by_clip.webp)
*Its best images according to the separate CLIP judge.*

![Liked images that are least like their training data and the gallery, step 820.](/posts/jxl-art-rlhf/most_unique_liked.webp)
*Images I liked that are least similar to the training data and the gallery.*

## What went wrong

The first version of this copied the gallery. I had included edited gallery pieces in the training data, the model learned to make near-copies of them, and I kept picking those because gallery pieces are good. At one point 64% of what I was shown was close to a gallery piece. I only noticed once I measured it, so I threw that model away and rebuilt the data without the gallery.

![Version-1 outputs (left of each pair) beside the gallery pieces they copied.](/posts/jxl-art-rlhf/v1_copies.webp)
*First-version outputs (left of each pair) next to the gallery pieces they copied.*

The first version also collapsed into making more or less one image in one palette. I rolled it back, added a penalty for look-alike images within a batch, and changed the batches to show me the most varied samples. A milder version came back near the end of the second run, as a teal, red and black woven pattern.

![Version-1 samples during the collapse.](/posts/jxl-art-rlhf/collapse.webp)
*First-version samples during the collapse.*

Smaller things: starting from the model's English pretrained weights was worse than starting from scratch. The reward model stopped getting more accurate after about 500 clicks, which is probably the main limit of this setup. And at one point training got 20× slower because two jobs and a browser didn't fit in GPU memory together and Windows quietly started using system RAM.

## Caveats

It would be nice to say the model learned to think like JXL artists, but I don't think the evidence supports that. It never used their tools, it moved away from their techniques, and it makes the Queen's Fractal look-alike no more often than random programs do. What I think it shows is my taste steering the model around inside what random programs can already reach, and the format having a few spots that everyone ends up in.

The blind test has obvious problems. I'm the one who trained the model, so it only says the model moved toward my taste, and after 1,400 clicks I might recognise its style. I'd be curious whether other people pick the same way.

## Links

- The blind test with 10 rounds: [nafty.is-a.dev/jxl-blind-test](/jxl-blind-test/)
- Code: [github.com/Nominy/jxl-art-rlhf](https://github.com/Nominy/jxl-art-rlhf)
- Every checkpoint, click and image from the run: [huggingface.co/Nafty/jxl-art-rlhf](https://huggingface.co/Nafty/jxl-art-rlhf)
- The human gallery: [jpegxl.info/art](https://jpegxl.info/art/), and the [online editor](https://www.januschka.com/jxl-art/)

Things I'd like to try next: blind tests with people other than me, adding splines and layers to the training data, a labeling page that shows images at their real aspect ratio, and base rates for the other look-alikes.

## Details

For anyone who wants the numbers.

**Model and data.** Supra2.5-Pico architecture (SupraLabs, Apache-2.0), 2,982,480 parameters, 10 layers, trained from scratch; starting from its English weights gave 41% usable images against 57% from scratch. Programs compiled with libjxl v0.12.0 `jxl_from_tree`; a program counts if it compiles, decodes, is at most 256 bytes and isn't blank. The 24,000 training programs are 18% fresh from the grammar and 82% mutations of earlier ones, deduplicated by text and image, median 35 bytes. A filter for anything within 0.8 similarity of a gallery program never triggered.

**RLHF loop.** The reward model is Bradley–Terry, linear on CLIP ViT-B/32 features plus a few image statistics, refit after every click. Every 25 clicks: 20 policy-gradient steps (batch 64, lr 3e-5, KL penalty 0.05 to the starting model, leave-one-out baseline), then a new batch of the 32 most varied out of about 120 samples. The reward also penalises look-alikes within a batch, near-copies of the gallery, and broken output. The reward model's held-out accuracy levelled off at 0.69–0.72. Steps 0–120 ran in PyTorch on an RTX 5060 Ti, the rest on a MacBook Air through an MLX port of the same model.

**Before and after** (256 samples per checkpoint, same seed; the CLIP judge picks between "a beautiful abstract digital artwork" and prompts like "random noise" or "a blank screen"):

| | random training programs | human gallery | step 0 | step 400 | step 820 |
|---|---|---|---|---|---|
| usable images | – | – | 64% | 84% | 90% |
| reward model, median z | −0.35 | 0.85 | −0.27 | 0.05 | 0.69 |
| CLIP judge | 0.27 | 0.47 | 0.27 | 0.34 | 0.42 |
| PNG bytes per program byte | 913 | 1,562 | 849 | 743 | 1,737 |
| median program size (bytes) | 35 | 32 | 32 | 31 | 29 |
| near-copies of gallery programs | 0% | – | 0% | 0% | 0% |

The reward model fit on the first 704 clicks gives −0.14 at step 0 and +0.69 at step 800. "Both bad" went from 45% of my clicks at the start to about 16% after step 300.

**Blind test.** 50 pairs sampled once and frozen, sides shuffled. Tuned 39, untuned 11, no ties: 78%, 95% interval 64–88%, binomial p = 9×10⁻⁵. The pairs and votes are on Hugging Face under `reports/blind-ab`.

**Queen's Fractal.** Same 1024×1024 size, 53% of pixels identical, mean difference 10/255. The model's program:

```
Bitdepth 10
RCT 0
Squeeze
if W+N-NW > 8
  if N > -5
    - Set 449
    - Set -105
  if x > 11
    - Set -516
    - Set 324
```

Share of images that look like it (CLIP similarity ≥ 0.95): random training programs 0.6%, model before tuning 1.7%, after 1.4%. Other look-alikes: "Waterfall Brushes" (Halcyon), "melting crystal" and "Shattered palette" (CrushedAsian255), "Chromatic Stripes" (dogelition). No model program came within 0.8 similarity of a gallery program; the closest was 0.64.

**Techniques**, share of programs:

| | human gallery | step 0 | step 400 | step 820 |
|---|---|---|---|---|
| separate logic per colour channel | 45% | 43% | 25% | 17% |
| deep trees | 21% | 12% | 2% | 1% |
| splines | 7% | 0% | 0% | 0% |
| layers | 1% | 0% | 0% | 0% |
| `Weighted` predictor | 16% | 12% | 8% | 19% |

**What my clicks rewarded.** Programs with `RCT` won 42% of comparisons, without 31%; by the end the model writes it in 72–85% of programs. Non-square images won 30%, square ones 41%.

**First version.** 35% of its training programs were edits of gallery pieces, 42% of its outputs were near-copies, and near-copies won 37% of my comparisons against 15% for the rest. During the collapse, similarity between images in a batch went from 0.81 to 0.93.
