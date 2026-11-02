---
title: "Format Sweet Spots: a 3M-parameter model learns to write 29-byte JPEG XL art from one person's clicks"
pubDate: 2026-11-03
description: "A 3M-parameter model learns to write 29-byte JPEG XL art from 24,000 random programs and one person's 1,442 clicks; its matches to human pieces turn out to be format sweet spots."
author: "Naft San"
image:
  url: "/posts/jxl-art-rlhf/neon_chevron.webp"
  alt: "Neon Chevron: glowing diagonal light trails folding at a sharp tip on black"
tags: ["jpeg xl", "rlhf", "generative art", "machine learning"]
---

> **TL;DR**
>
> We trained a **2,982,480-parameter** language model to write JXL art: images encoded as tiny programs in JPEG XL's prediction language, compiled to files of a few dozen bytes. Its training data was **24,000 random valid programs generated in 43 minutes**; it never saw a program written by a human artist. We then tuned it with RLHF from **1,442 A/B picks by one person** over **820 policy steps**.
>
> Valid images rose from **64% to 90%**. A CLIP judge that never saw the picks rates the outputs **0.27 → 0.42** (human gallery: 0.47). Programs got shorter (**median 32 → 29 bytes**) while the images got richer, to **more image per byte than the human gallery** (1,737 vs 1,562 PNG bytes per JXL byte). In a blind test after training, the labeler preferred the trained model's image in **39 of 50 pairs**. In the two best pieces we dissected, every visual element maps to a token, which we confirmed by ablation.
>
> Several outputs match human gallery pieces. The closest renders Jon Sneyers' 21-byte "The Queen's Fractal", whose code was never published, with **53% of pixels identical**, from a 35-byte program against Jon's 21 bytes. Then we measured the base rate: **about 1 in 170 random programs from our training data already land there**, and training did not raise that rate. We read these matches as **format sweet spots**, places in the format that short programs reach easily, which artists found by hand and random search finds too.

![Twelve hand-picked images from the trained model, each with its checkpoint and byte size.](/posts/jxl-art-rlhf/panel.webp)

## If you had to draw something in 29 bytes, where would you start?

Twenty-nine bytes holds fewer than ten RGB pixels, so you would have to write a rule and let a decoder run it. JPEG XL has such a rule language built in. Its lossless mode predicts each pixel from its neighbours using a small decision tree stored in the file. Write that tree by hand, give the decoder no pixel data to correct, and its predictions become the image.

That is JXL art. It began in March 2021, when people started writing these trees and compiling them with libjxl's `jxl_from_tree`. The gallery at jpegxl.info holds 241 pieces totalling 13,143 bytes, most made by trial and error in an online editor.

We asked whether a very small language model could learn to write them under two constraints: it never sees what humans wrote, and its only signal about beauty is one person clicking left or right.

We call what we found a **format sweet spot**: a region of an expressive format where very short programs produce rich, structured images. JPEG XL's tree language has several. Human artists found some by hand, random programs fall into some of the same ones, and one person's taste decides which of them the model keeps returning to.

This project was done by one person with an AI coding assistant (Claude) and took two days.

## Findings

1. A 3M model trained on random programs and 1,442 picks produces images that a blind CLIP judge rates close to the human gallery, with shorter programs than it started with. In a blind A/B test, the labeler preferred it over the starting model in 39 of 50 pairs. ([Experiment 1](#experiment-1-does-one-persons-taste-move-a-3m-model), [blind test](#what-we-cant-claim))
2. Its best images are legible: each token has a visible job, confirmed by changing tokens one at a time. ([Experiment 2](#experiment-2-are-the-best-images-legible-programs))
3. Its outputs match several human pieces, and the closest match sits in a region random programs already reach. ([Experiment 3](#experiment-3-did-it-rediscover-human-pieces))
4. RLHF chose among what the starting model could already make. ([Experiment 4](#experiment-4-did-it-invent-anything))
5. One person's taste carried a superstition and an interface artefact, and the model learned both. ([Experiment 5](#experiment-5-what-did-one-persons-taste-reward))

## Setup

**Model.** Supra2.5-Pico (SupraLabs, Apache-2.0): a 2,982,480-parameter decoder-only transformer, 10 layers, hidden size 144, 4,104-token tokenizer, trained from random initialisation. Starting from its English pretrained weights gave 41% usable images against 57% from scratch at the same learning rate.

**Output.** Text tree programs, compiled with libjxl v0.12.0 `jxl_from_tree` and decoded with `djxl`. A program counts as valid if it compiles, decodes, is at most 256 bytes and is not blank.

**Data.** 24,000 programs generated in 43 minutes: 18% sampled fresh from the tree grammar, 82% mutations of earlier accepted programs (nudged thresholds, swapped predictors, replaced subtrees), filtered for validity, size, blankness and duplicates by text and by image. Programs with recipe similarity ≥ 0.8 to any gallery piece were to be rejected; none came up. The gallery's only influence was on how often each header and predictor appears. Median tree: 7 nodes; median compiled size: 35 bytes.

**Supervised stage.** A few minutes of training on one RTX 5060 Ti. The resulting starting model makes 62% usable images and no near-copies of gallery recipes (closest: 0.73).

**RLHF loop.** A local web page shows pairs from the current model; the labeler presses ← or →, or marks "equal" or "both bad". A Bradley–Terry taste model, linear on CLIP ViT-B/32 image features plus a few image statistics, refits after every pick (0.2–2 s). Every 25 picks the policy takes 20 KL-regularised policy-gradient steps (batch 64, learning rate 3e-5, KL β 0.05, leave-one-out baseline), then samples a fresh batch: the 32 most mutually different of about 120 valid samples. The reward is the standardised taste score, minus a penalty for CLIP look-alikes within a batch, minus a penalty for being close to a gallery piece (recipe ≥ 0.8 or image ≥ 0.97), minus fixed penalties for broken or blank output.

![The labeling page.](/posts/jxl-art-rlhf/labeling_ui.webp)
*The labeling page. The wide image on the right sits in a square card with black bars, which turned out to matter (Experiment 5).*

**Two machines.** Steps 0–120 ran on a Windows desktop (PyTorch with CUDA graphs, RTX 5060 Ti) and steps 120–820 on a MacBook Air through an Apple MLX port of the same model. The run (weights, snapshots every 5 steps, every pick, every image shown, logs) syncs through a Hugging Face repo as framework-neutral safetensors. The MLX port matches PyTorch to about 2e-5 on logits and 4e-6 on a training update.

## Experiment 1: does one person's taste move a 3M model?

**Validity, a held-out taste model and an independent judge all rise, while programs get shorter and images get richer.**

**Setup**
- 256 samples per checkpoint with the same seed, at steps 0, 400 and 820.
- "Gallery" is the 241 human pieces; "training data" is the 24,000 random programs.
- The CLIP judge is zero-shot CLIP choosing between prompts like "a beautiful abstract digital artwork" and "random noise", "a boring flat image", "a glitchy corrupted image", "a blank screen". It never saw a pick.

| | training data | gallery (human) | step 0 | step 400 | step 820 |
|---|---|---|---|---|---|
| valid images | – | – | 64% | 84% | **90%** |
| taste model, median z | −0.35 | 0.85 | −0.27 | 0.05 | **0.69** |
| taste model, top 10% z | 0.83 | 2.05 | 0.91 | 1.18 | **2.27** |
| CLIP judge, P("beautiful artwork") | 0.27 | 0.47 | 0.27 | 0.34 | **0.42** |
| render complexity (PNG KB at 256 px) | 34 | 61 | 24 | 21 | **50** |
| PNG bytes per JXL byte | 913 | 1,562 | 849 | 743 | **1,737** |
| JXL bytes, median | 35 | 32 | 32 | 31 | **29** |
| near-copies of gallery recipes (≥ 0.8) | 0% | 23% (series within the gallery) | 0% | 0% | **0%** |
| exact program from training data | – | – | 0% | 0% | **0%** |
| mean pairwise CLIP similarity | 0.81 | 0.79 | 0.82 | 0.80 | 0.82 |

**How does it do it.** A learned reward invites reward hacking: the policy finds images the linear taste model likes and nobody else would. Two checks argue against it. A taste model fit only on the 704 picks made before step 300 never saw any image from the later policy, yet it agrees with the full model: median z −0.14 at step 0, +0.80 at step 700, +0.69 at step 800. And the CLIP judge, which has no connection to the picks, rises from 0.27 to 0.42, within 0.05 of the human gallery. Most of the gain came between steps 400 and 700, and "both bad" picks fell from 45% of step-0 comparisons to about 16% from step 300 on.

Program length had no direct reward. Broken output was penalised, though, and short programs break less often, which accounts for some of the shrinkage. The rest fits the reward: the taste model favours structure and colour, and in this format the decoder's predictors supply both with very few tokens. Median size fell from 32 to 29 bytes while render complexity doubled from 24 KB to 50 KB, and the trained model now produces more image per byte than the human gallery.

![Random samples from the starting model, step 0.](/posts/jxl-art-rlhf/evolution_step0.webp)
*Random samples, step 0.*

![Random samples from the trained model, step 800, same seed.](/posts/jxl-art-rlhf/evolution_step800.webp)
*Random samples, step 800, same seed.*

## Experiment 2: are the best images legible programs?

**In the two pieces we dissected, every visual element maps to a token, and each mapping survives a targeted change.**

We took "Neon Chevron" (29 bytes, step 800), the favourite of both the labeler and the assistant, and "Fault Line Meadow" (28 bytes, step 800). For each token we wrote down what we thought it does, predicted what a specific change should do, rendered the change and compared.

![Neon Chevron, 29 bytes.](/posts/jxl-art-rlhf/neon_chevron.webp)

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

**Setup**
- 12 rendered variants: no `DeltaPalette`; `RCT` 0, 6, 27; `Bitdepth 8`; only `Gradient`; only `Select`; `Gradient -1` and `-20`; split at `x > 160`; `Select 0`.
- The original in the online editor (press Run): https://www.januschka.com/jxl-art/?zcode=eNodxzEKgDAMBdA9p_gXKNgWHR1U0FFUcC422kARkQweX3F7rxGNfGmCdbRK_OBdQQPLkfTn1C6wnjrOGsaQWZVJdjyo4VxFgMHMmTeFsf_6O0Th83tJLwomGhg

**How does it do it.**

*The tip is the boundary between the two rules.* Moving the split from `x > 226` to `x > 160` should move the tip. It does.

*`Gradient -5` makes the glowing diagonals.* It predicts each pixel from its upper and left neighbours minus 5, which draws up-right stripes, and the drift through the palette produces the periodic glowing beads. Changing the constant should change the stripes and keep the geometry: `-1` gives faint threads, `-20` blown-out bands.

*`Select -1` bends and dims the right arm.* `Select` copies whichever neighbour fits the local slope, so it continues the stripes arriving from the left, bent downward. Alone it produces only faint stripes, because it has nothing bright to continue. With `Select 0` the right arm turns into solid blocks, so the `-1` is what makes it fade.

*`DeltaPalette` supplies all the colour.* Removing it should leave black. It does. *`Bitdepth 12` makes the night*: the same program at 8 bits washes out.

*`RCT 13` does nothing.* With `DeltaPalette` each pixel is one palette index, so a colour transform has nothing to mix. `RCT` 0, 6, 13 and 27 should render identically, and they do. Experiment 5 comes back to this token.

![Twelve variants of Neon Chevron.](/posts/jxl-art-rlhf/neon_chevron_ablation.webp)

**Fault Line Meadow, 28 bytes**

```
Bitdepth 8
Width 128
Height 128
Upsample 8
RCT 0
DeltaPalette
if x > 52
  - W -1
  - Weighted -7
```

**Setup**
- 8 rendered variants: no `Upsample` (drawn natively at 1024 px); no `DeltaPalette`; no `RCT`; only `Weighted`; only `W`; `Weighted -3`; split at `x > 90`.

**How does it do it.** Left of the seam, `Weighted -7` pushes JPEG XL's self-correcting predictor hard enough to turn chaotic, and the diagonal grain comes from that predictor carrying its errors up and to the right. Right of the seam, `W -1` copies the left neighbour minus one, which carries the chaos sideways and fades it into a green field. Each rule alone gives something plainer: only `Weighted` fills the canvas with chaos, and only `W` draws faint stripes. Moving the split to 90 shrinks the meadow; `Weighted -3` turns the chaotic side mostly black with a bright glow.

*The mossy grain comes from the upscaler.* The program draws 128×128 pixels, and `Upsample 8` has the decoder's smoothing upscaler turn each one into a soft blob. Drawn natively at 1024 px, the same rules give a smooth gradient with fine threads. `RCT 0` is the default and changes nothing.

![Eight variants of Fault Line Meadow.](/posts/jxl-art-rlhf/fault_line_meadow_ablation.webp)

Both pieces use the same compositional device, which recurs across the model's best output: an `if x > N` seam where an energetic rule on one side feeds a calm rule on the other.

## Experiment 3: did it rediscover human pieces?

**It produces close matches to several gallery pieces from different programs. The closest one, though, is also produced by random programs at about the same rate.**

**Setup**
- Every trained-model sample compared with every gallery piece by CLIP image similarity, and with every published gallery program by recipe similarity (token-sequence similarity). The Queen's Fractal has no published program, so for it only images can be compared.
- For the closest match: both images decoded at full resolution and compared pixel by pixel.
- Base rate: the share of images with CLIP similarity ≥ 0.95 to The Queen's Fractal among 3,000 random training programs, and among 1,024 samples each from the starting and the trained model.

**What we found.** The closest match is to "The Queen's Fractal" (Jon Sneyers, 2021, 21 bytes). Sneyers is one of the creators of JPEG XL, and the piece's code was never published. The model's best match is a 35-byte file against Jon's 21 bytes, so the programs differ, and it renders at the same 1024×1024 size with 53% of pixels identical, a mean difference of 10/255, and a CLIP similarity of 0.998. The program is `Squeeze`, JPEG XL's multi-resolution transform, plus constant `Set` leaves:

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

Filling the multi-resolution coefficients with constants makes the decoder repeat the same detail at every scale, which yields a self-similar block fractal.

![The model's 35-byte image (left) and The Queen's Fractal, 21 bytes (right).](/posts/jxl-art-rlhf/queens_fractal_pair.webp)

| | Queen-like (CLIP ≥ 0.95) | ≥ 0.97 | closest |
|---|---|---|---|
| random training programs (3,000) | 0.6% | 0.2% | 0.994 |
| starting model, step 0 (661 valid of 1,024) | 1.7% | 0.6% | 0.996 |
| trained model, step 820 (917 valid of 1,024) | 1.4% | 0.4% | **0.998** |

The base rate settles the question. Random valid programs reach this image about once in 170 tries, and training left the rate flat. The model's programs with only constant leaves rose from 2% to 42% over training, but those mostly make other tiled patterns. This image is one that the format makes easy to reach: a sweet spot that Sneyers found by hand in 2021 and that random generation hits by chance.

Other matches follow the same pattern, a shared visual idea built from a different program: "Waterfall Brushes" (Halcyon, 2025), with the same `DeltaPalette` + `Weighted ±3` brush strokes; "melting crystal" (CrushedAsian255), with the same `DeltaPalette` + `AvgN+NW -1` core; "Shattered palette" (CrushedAsian255), a split screen with `Gradient`; and "Chromatic Stripes" (dogelition), `DeltaPalette` with diagonal `Gradient` bands. No trained-model sample reached 0.8 recipe similarity to any gallery program; the maximum was 0.64. We have not measured base rates for these.

![Model images beside the gallery pieces they resemble.](/posts/jxl-art-rlhf/convergent_pairs.webp)

## Experiment 4: did it invent anything?

**RLHF chose among what the starting model could already make. It never used a tool absent from its data, and its technique mix moved away from the gallery's.**

**Setup**
- Technique usage per valid sample at steps 0, 400 and 820, compared with the gallery.
- Median CLIP similarity of each output to its nearest training image.

| technique | gallery | step 0 | step 400 | step 820 |
|---|---|---|---|---|
| per-channel branches | 45% | 43% | 25% | 17% |
| deep trees (depth ≥ 4) | 21% | 12% | 2% | 1% |
| splines | 7% | 0% | 0% | 0% |
| multi-layer images | 1% | 0% | 0% | 0% |
| `Weighted` predictor | 16% | 12% | 8% | **19%** |
| neighbour-gradient branches | 52% | 35% | 28% | **47%** |

**How does it do it.** The distance between the model's technique mix and the gallery's grew from 0.12 to 0.16. Human artists use per-channel logic and deep trees; the model dropped both. Splines and layered frames, used in 7% and 1% of gallery pieces, never appear in the model's output because they never appeared in its data, and a KL-regularised policy of this size does not start emitting syntax it has never produced. Two tools dipped and then rose back to human levels late in training: the `Weighted` predictor, which drives Fault Line Meadow, and neighbour-gradient branches.

The median similarity of outputs to their nearest training image stayed at 0.95 throughout. The trained model's outputs sit as close to the training distribution as the starting model's did; training changed which parts of that distribution it samples.

## Experiment 5: what did one person's taste reward?

**Colour and structure, plus a token that does nothing and a quirk of the labeling page.**

**Setup**
- Win rates for items compared at least twice, split by a property of their program.

| property | wins with | wins without |
|---|---|---|
| `RCT` header | **42%** | 31% |
| non-square canvas | 30% | **41%** |
| deep tree (n = 32) | 21% | 38% |

**How does it do it.** Images whose program sets `RCT` won 42% of comparisons against 31% for the rest. In palette programs, which make up most of the liked ones, `RCT` has no effect (Experiment 2 rendered four values identically), yet the model writes it in 72–85% of programs. The token rode along with liked images and was reinforced with them. We call it a superstition token.

Non-square canvases won 30% against 41%. We attribute this to the labeling page: every image appeared in a square card, so wide and tall pieces showed up smaller and framed by black bars, and the learned taste encodes that. The program parts the model abandoned (`PrevErr`, `Orientation`, `y` splits, `NE`) all scored lower with the taste model.

![Top images by the learned taste model, step 820.](/posts/jxl-art-rlhf/best_by_taste.webp)

![Top images by the independent CLIP judge, step 820.](/posts/jxl-art-rlhf/best_by_clip.webp)

![Liked images that are least like their training data and the gallery, step 820.](/posts/jxl-art-rlhf/most_unique_liked.webp)

## Failures and lessons

This write-up is optimised with hindsight and presents the second version of the project as if it had been planned. These are the wrong turns.

**1. The first model copied.** In version 1, 35% of the training programs were edits of gallery pieces, and the gallery itself was repeated 10 times. That starting model produced 42% near-copies of gallery recipes (≥ 0.8 similar). During RLHF, programs at least 0.9 similar to a gallery recipe made up 64% of what the labeler saw at the peak, and the picks rewarded them: they won 37% of comparisons against 15% for programs under 0.7. Gallery pieces are curated, so resemblance to them read as quality. We caught it by measuring recipe and image similarity against how similar gallery pieces are to each other, then discarded the model and rebuilt the data without the gallery.

![Version-1 outputs (left of each pair) beside the gallery pieces they copied.](/posts/jxl-art-rlhf/v1_copies.webp)

**2. Style collapse.** Around step 160 of version 1 the model settled on one idea and one palette: within-batch CLIP similarity rose from 0.81 to 0.93 and colour spread halved. We rolled back, added the look-alike penalty, and built label batches from the most mutually different samples. A milder collapse appeared in version 2 near step 800, a teal, red and black woven pattern (near-twins rose from 38% to 57%), which mean pairwise similarity did not register.

![Version-1 samples during the collapse.](/posts/jxl-art-rlhf/collapse.webp)

**3. English pretraining hurt.** Starting from Supra2.5-Pico's English weights gave 41% usable images against 57% from scratch.

**4. The labeling page shaped the taste**, through the square cards described in Experiment 5.

**5. The taste model is the ceiling.** Its accuracy on held-out picks levelled off at about 0.69–0.72 after roughly 500 picks. It is linear on CLIP features; more picks keep it current without making it sharper, and everything the policy learned passed through it.

**6. Engineering.** Training slowed about 20× when two jobs and a browser overflowed the 16 GB GPU and Windows quietly moved memory into system RAM. A free Hugging Face account ran into storage and request limits.

## What we can't claim

"A tiny model learned how JXL artists think" is the tempting headline, and the evidence rules it out. The model's outputs stay as close to its training data as they were at the start. It never produced a spline or a layered frame. Its technique mix moved away from the gallery's. Its closest match to a human piece occurs in random programs at the same rate. The behaviour is selection within what random programs already cover, steered by one person's taste.

The evidence does support this: the format has a few sweet spots, and human artists, random generation, and a model steered by taste all reach them. A shared output reached by different programs tells us about the format.

A blind A/B test checks the improvement without any learned scorer. After training ended, the labeler judged 50 pairs, each with one image from the starting model and one from step 820, sides randomised and sources hidden until the last vote. The step-820 image won **39 of 50** (78%; 95% interval 64–88%; exact binomial p = 9×10⁻⁵; no ties). Two limits apply. The judge is the person whose picks trained the model, so this measures movement toward one person's taste. And after 1,442 picks that person may recognise the trained model's style, so the test hides labels but possibly not style.

## Reproducibility

Every checkpoint, the snapshots at 5-step intervals, every pick, every image shown and the logs are public at https://huggingface.co/Nafty/jxl-art-rlhf. The code, including the evaluation script `python -m jxlart.evaluate`, is at https://github.com/Nominy/jxl-art-rlhf. The human gallery is at https://jpegxl.info/art/ and the online editor at https://www.januschka.com/jxl-art/.

You can run the blind comparison yourself at [nafty.is-a.dev/jxl-blind-test](/jxl-blind-test/). Both checkpoints run in your browser (3M parameters, about 6 MB each as float16), and libjxl runs as WebAssembly. You pick from 10 pairs and then see which model you sided with.

## What's next

- Blind tests by people other than the labeler. The browser version lets anyone run one, but results stay on their device.
- Splines and layered frames in the training data, so the model can use the tools artists use.
- Images shown at their natural aspect ratio while labeling.
- Base rates for the other gallery look-alikes.
