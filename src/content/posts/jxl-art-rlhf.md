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

> **TL;DR**
>
> We taught a 3-million-parameter model to write JPEG XL art: tiny programs that the image decoder runs to paint a picture. It learned the language from random programs and learned what looks good from one person clicking left or right, 1,442 times. Its programs got shorter, its images got richer, and in a blind test its labeler preferred the trained model's images 39 times out of 50.
>
> Some of its images closely match pieces by human artists. When we checked how often random programs land on the same images, the answer was: about as often. We read these matches as **format sweet spots**, places in the format that short programs reach easily, which human artists, random search and taste-guided training all find.

![Twelve hand-picked images from the trained model, each with its checkpoint and byte size.](/posts/jxl-art-rlhf/panel.webp)

## Pictures made of rules

Suppose you had 29 bytes to make a picture. That is fewer than ten pixels of raw colour, so storing the picture is out of the question. You would have to write down a rule and let something else draw it.

JPEG XL, the image format, happens to contain such a rule language. When it compresses an image losslessly, it predicts each pixel from the pixels around it, using a small decision tree stored in the file: "if this pixel is in the right half, copy the one to the left; otherwise average the ones above." Normally the file also stores corrections for wherever the prediction is wrong. Leave the corrections out, and the decoder paints whatever the tree predicts. The tree becomes the picture.

People have been writing these trees by hand since 2021 and calling the results JXL art. The gallery at jpegxl.info holds 241 pieces, 13,143 bytes in total, most of them found by trial and error in an online editor. The image at the top of this post, "Neon Chevron", is one our model wrote. It is 29 bytes.

## The question

We wanted to know how far a very small model could get at this with two handicaps. It would never see a program written by a person, so it could not imitate the gallery. And its only information about what looks good would come from one person comparing pairs of images and clicking the one they liked.

This is a toy version of a question that matters for larger systems. Reinforcement learning from human feedback (RLHF) is how many language models are shaped after pretraining, and its signal is thin: a person's preference between two outputs. We wanted to see, at a scale where every output can be looked at and every program read, what such a signal teaches. Does it improve the work? Does it lead the model to what experienced humans found? And what else gets learned along the way?

This project was done by one person with an AI coding assistant (Claude) and took two days.

## How we trained it

First, the model needed to learn the language. We generated 24,000 random programs in 43 minutes, mostly by mutating earlier valid programs, and kept only those that compiled into a non-blank image of at most 256 bytes. None were taken from the gallery. A 3-million-parameter transformer trained on these for a few minutes learned to write valid programs about two-thirds of the time, with no particular sense of what looks good.

Then came the taste. A local web page showed two images from the current model, and the labeler pressed ← or → for the one they preferred. A small "taste model" learned from these picks to predict which images the labeler would like, and the language model was trained to write programs the taste model scored highly. Every 25 picks the model updated, and the next pairs came from the updated model. Over 1,442 picks and 820 training steps the model's output changed visibly.

![The labeling page.](/posts/jxl-art-rlhf/labeling_ui.webp)
*The labeling page. The wide image on the right sits in a square card with black bars, which turned out to matter.*

The full recipe (model, data, reward, hyperparameters) is in the [appendix](#appendix-methods-and-full-results).

## Did one person's taste change the model?

Yes, by several measures, including ones that never saw the picks.

The plainest change is that the trained model breaks less: 90% of its programs produce a usable image, against 64% at the start. Its programs also got shorter, from a median of 32 bytes to 29, while its images got busier. Measured by how much a PNG needs to store them, the trained model now puts more picture into each byte than the human gallery does.

| | start | after 820 steps | human gallery |
|---|---|---|---|
| usable images | 64% | **90%** | – |
| independent judge, P("beautiful artwork") | 0.27 | **0.42** | 0.47 |
| median program size | 32 bytes | **29 bytes** | 32 bytes |
| PNG bytes per program byte | 849 | **1,737** | 1,562 |

The obvious worry with this kind of training is reward hacking: the model learns to please the taste model, and stops pleasing the person. The taste model is simple, and a language model optimising against it could find images it rates highly that no person would. We checked this three ways.

First, we used an independent judge: an off-the-shelf image model (CLIP) asked whether each image looks more like "a beautiful abstract digital artwork" or like noise, a blank screen or a glitch. It never saw a single pick. Its score rose from 0.27 to 0.42, close to the human gallery's 0.47.

Second, we refit the taste model using only the 704 picks made before step 300, so it had never seen anything the later model produced. It agrees with the full taste model: the later images score much higher under it too. And "both bad" picks fell from 45% of comparisons at the start to about 16% from step 300 on.

Third, after training ended, the labeler took a blind test: 50 pairs, one image from the starting model and one from the trained model, sides shuffled, sources hidden until the end. The trained model won 39 of 50. You can take the same test at the top of this page.

![Random samples from the starting model, step 0.](/posts/jxl-art-rlhf/evolution_step0.webp)
*Random samples from the starting model.*

![Random samples from the trained model, step 800, same seed.](/posts/jxl-art-rlhf/evolution_step800.webp)
*Random samples from the trained model, same seed.*

## Reading a 29-byte picture

A useful property of this setup is that the model's output is a short program we can read. So for the two favourite pieces, we tried to explain every token, then tested each explanation by changing the token and predicting what would happen to the picture.

Here is Neon Chevron in full:

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

The program splits the canvas at x = 226 and uses a different prediction rule on each side. Our reading:

- **The tip of the chevron is the boundary between the two rules.** If so, moving the split to x = 160 should move the tip. It does.
- **`Gradient -5` draws the glowing diagonals.** It predicts each pixel from its neighbours above and to the left, minus 5, which produces up-right stripes. Changing the constant should change the stripes and keep the shape: −1 gives faint threads, −20 blown-out bands.
- **`Select -1` bends the light downward and lets it fade.** It continues whatever arrives from the left. On its own it draws only faint stripes, because it has nothing bright to continue. With 0 in place of −1 the right arm turns into solid blocks.
- **`DeltaPalette` supplies all the colour**, so removing it should leave a black image. It does. **`Bitdepth 12` makes the night**: at 8 bits the same program washes out.
- **`RCT 13` does nothing.** It is a colour transform, and with a palette there is no colour to transform. Four different values render identically. We come back to this token below.

![Twelve variants of Neon Chevron.](/posts/jxl-art-rlhf/neon_chevron_ablation.webp)
*Neon Chevron with one token changed at a time. Open the original in the [online editor](https://www.januschka.com/jxl-art/?zcode=eNodxzEKgDAMBdA9p_gXKNgWHR1U0FFUcC422kARkQweX3F7rxGNfGmCdbRK_OBdQQPLkfTn1C6wnjrOGsaQWZVJdjyo4VxFgMHMmTeFsf_6O0Th83tJLwomGhg) and press Run.*

The second favourite, "Fault Line Meadow" (28 bytes), has the same structure. On the left of a seam, an aggressive setting of JPEG XL's self-correcting predictor turns chaotic. On the right, a simple copy-from-the-left rule carries that chaos sideways and fades it into a green field. The mossy grain comes from the decoder's upscaler: the program draws only 128×128 pixels and asks for each to be enlarged eight times.

![Eight variants of Fault Line Meadow.](/posts/jxl-art-rlhf/fault_line_meadow_ablation.webp)
*Fault Line Meadow with one token changed at a time.*

Both pieces use a device that recurs across the model's best work: a seam, with an energetic rule on one side feeding a calm rule on the other.

## Did it rediscover human art?

Several of the model's images look very much like gallery pieces, which raised an exciting possibility: that a model which never saw the gallery had found its way to the same pictures.

The closest match is to "The Queen's Fractal", a 21-byte piece by Jon Sneyers, one of JPEG XL's creators, whose code was never published. The model's version is a 35-byte program that renders the same 1024×1024 image with 53% of pixels identical and the rest very close. It uses a different program to get there: JPEG XL's multi-resolution transform filled with constants, which makes the decoder repeat the same detail at every scale.

![The model's 35-byte image (left) and The Queen's Fractal, 21 bytes (right).](/posts/jxl-art-rlhf/queens_fractal_pair.webp)
*The model's 35-byte image (left) and The Queen's Fractal, 21 bytes (right).*

Before calling this a rediscovery, we asked how often random programs produce the same image. Often enough to matter: about 1 in 170 random programs from the training data look like The Queen's Fractal, and training did not make the model more likely to produce it.

| | images that look like The Queen's Fractal |
|---|---|
| random training programs | 0.6% |
| model at the start | 1.7% |
| model after training | 1.4% |

So the honest reading is that this picture is easy to reach in JPEG XL's language. Sneyers found it by hand in 2021; random generation stumbles onto it by chance; our model makes it at about the rate it always did. We call regions like this **format sweet spots**: places where a very short program yields a rich, structured image. The other look-alikes have the same character, a shared visual idea built from a different program: "Waterfall Brushes", "melting crystal", "Shattered palette", "Chromatic Stripes". We have not measured base rates for those.

![Model images beside the gallery pieces they resemble.](/posts/jxl-art-rlhf/convergent_pairs.webp)
*Model images beside the gallery pieces they resemble.*

## Did it invent anything?

No. Training changed which of its existing abilities the model uses, and added none.

Human artists use some tools our model never touches: splines (smooth painted curves) and layered images. Those never appeared in its training data, and the model never produced them. Of the tools it did know, it moved away from the ones artists favour, like deep trees and separate logic for each colour channel, and toward palette tricks and simple split screens. Overall its mix of techniques drifted further from the gallery's.

Its images also stayed as close to its training data as they were at the start. What the clicks did was steer the model toward particular corners of what random programs already cover.

## What one person's taste taught it

The picks carried more than one person's sense of beauty. They also carried habits and accidents, and the model learned those too.

**A superstition token.** Images whose programs include `RCT` won 42% of their comparisons, against 31% for the rest. In the palette programs the labeler liked most, `RCT` does nothing, as the Neon Chevron experiment showed. But it happened to appear alongside liked images, so it was rewarded along with them, and the trained model now writes it into 72–85% of its programs.

**An interface artefact.** The labeling page showed every image in a square card. Wide and tall images appeared smaller, framed by black bars, and they won less often: 30% against 41% for square ones. The taste model learned that preference, and the language model learned it from the taste model.

Neither of these was intended. They are small versions of a familiar problem in RLHF: the model learns what the feedback rewards, and the feedback rewards more than the labeler meant.

![Top images by the learned taste model, step 820.](/posts/jxl-art-rlhf/best_by_taste.webp)
*The trained model's best images according to the taste model.*

![Top images by the independent CLIP judge, step 820.](/posts/jxl-art-rlhf/best_by_clip.webp)
*The same model's best images according to the independent judge.*

![Liked images that are least like their training data and the gallery, step 820.](/posts/jxl-art-rlhf/most_unique_liked.webp)
*Liked images that are least like anything in the training data or the gallery.*

## What went wrong along the way

This write-up is optimised with hindsight and presents the second version of the project as if it had been planned. The first version taught us most of what is above.

**The first model copied.** Its training data included edited gallery pieces, and 42% of its programs were near-copies of gallery recipes. The labeler, without knowing it, favoured them: gallery pieces are curated, so resemblance to them looked like quality. At the peak, near-copies made up 64% of what the labeler saw. We caught it by measuring how similar the outputs were to gallery programs, compared with how similar gallery programs are to each other, then threw that model away and rebuilt the data without the gallery.

![Version-1 outputs (left of each pair) beside the gallery pieces they copied.](/posts/jxl-art-rlhf/v1_copies.webp)
*Version-1 outputs (left of each pair) beside the gallery pieces they copied.*

**Style collapse.** Partway through the first version, the model settled on one idea and one palette and produced little else. We rolled back, added a penalty for look-alike images within a batch, and started showing the labeler the most varied samples instead of random ones. A milder collapse, into a woven teal, red and black pattern, appeared near the end of the second version.

![Version-1 samples during the collapse.](/posts/jxl-art-rlhf/collapse.webp)
*Version-1 samples during the collapse.*

**Smaller lessons.** Starting from the model's English-language weights made it worse at this than starting from scratch. The taste model stopped improving after about 500 picks, and since everything the language model learned passed through it, that is the ceiling of this setup. And one run slowed twentyfold when two jobs and a browser overflowed the GPU's memory.

## What this does and doesn't show

"A tiny model learned how JXL artists think" is the tempting headline, and the evidence rules it out. The model stays as close to its training data as it was at the start, never uses tools it hasn't seen, moves away from the artists' techniques, and matches their best-known piece no more often than random programs do. What we observed is selection, steered by one person's taste, within what random programs already cover.

What the evidence does support is that the format has sweet spots, and that human artists, random generation and a model steered by taste all find them. When different programs arrive at the same picture, that tells us something about the format.

The blind test has two limits. The judge is the person whose clicks trained the model, so it measures movement toward one person's taste. And after 1,442 picks, that person may recognise the trained model's style, so the test hides the labels but possibly not the style. The 39 of 50 result is strong for one judge (95% interval 64–88%); whether other people share the preference is open.

## Try it yourself

The blind test at the top of this post also has its own page with 10 rounds: [nafty.is-a.dev/jxl-blind-test](/jxl-blind-test/). Both versions of the model run in your browser, and the decoder runs as WebAssembly.

Every checkpoint, every pick, every image shown and the logs are public at https://huggingface.co/Nafty/jxl-art-rlhf. The code is at https://github.com/Nominy/jxl-art-rlhf. The human gallery is at https://jpegxl.info/art/ and the online editor at https://www.januschka.com/jxl-art/.

Next, we would like blind tests by people other than the labeler, splines and layered images in the training data so the model can reach the tools artists use, a labeling page that shows images at their natural shape, and base rates for the other look-alikes.

## Appendix: methods and full results

### Setup

**Model.** Supra2.5-Pico (SupraLabs, Apache-2.0): a 2,982,480-parameter decoder-only transformer, 10 layers, hidden size 144, 4,104-token tokenizer, trained from random initialisation. Starting from its English pretrained weights gave 41% usable images against 57% from scratch at the same learning rate.

**Output.** Text tree programs, compiled with libjxl v0.12.0 `jxl_from_tree` and decoded with `djxl`. A program counts as valid if it compiles, decodes, is at most 256 bytes and is not blank.

**Data.** 24,000 programs generated in 43 minutes: 18% sampled fresh from the tree grammar, 82% mutations of earlier accepted programs (nudged thresholds, swapped predictors, replaced subtrees), filtered for validity, size, blankness and duplicates by text and by image. Programs with recipe similarity ≥ 0.8 to any gallery piece were to be rejected; none came up. The gallery's only influence was on how often each header and predictor appears. Median tree: 7 nodes; median compiled size: 35 bytes.

**Supervised stage.** A few minutes of training on one RTX 5060 Ti. The resulting starting model makes 62% usable images and no near-copies of gallery recipes (closest: 0.73).

**RLHF loop.** The labeler presses ← or →, or marks "equal" or "both bad". A Bradley–Terry taste model, linear on CLIP ViT-B/32 image features plus a few image statistics, refits after every pick (0.2–2 s). Every 25 picks the policy takes 20 KL-regularised policy-gradient steps (batch 64, learning rate 3e-5, KL β 0.05, leave-one-out baseline), then samples a fresh batch: the 32 most mutually different of about 120 valid samples. The reward is the standardised taste score, minus a penalty for CLIP look-alikes within a batch, minus a penalty for being close to a gallery piece (recipe ≥ 0.8 or image ≥ 0.97), minus fixed penalties for broken or blank output. The taste model's accuracy on held-out picks levelled off at 0.69–0.72 after about 500 picks.

**Two machines.** Steps 0–120 ran on a Windows desktop (PyTorch with CUDA graphs, RTX 5060 Ti) and steps 120–820 on a MacBook Air through an Apple MLX port of the same model. The run syncs through a Hugging Face repo as framework-neutral safetensors. The MLX port matches PyTorch to about 2e-5 on logits and 4e-6 on a training update.

### Full results by checkpoint

256 samples per checkpoint with the same seed. "Gallery" is the 241 human pieces; "training data" is the 24,000 random programs. The CLIP judge is zero-shot CLIP choosing between "a beautiful abstract digital artwork" and prompts such as "random noise", "a boring flat image", "a glitchy corrupted image" and "a blank screen".

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

The held-out taste model (fit on the 704 picks before step 300) gives median z −0.14 at step 0, +0.80 at step 700 and +0.69 at step 800. Program length had no direct reward; broken output was penalised, and short programs break less often, which accounts for some of the shrinkage.

### Blind test

50 pairs, each with one valid image from step 0 and one from step 820, sampled once and frozen; sides randomised; images served under opaque ids. Step 820 won 39, step 0 won 11, no ties: 78%, Clopper–Pearson 95% interval 64–88%, exact two-sided binomial p = 9×10⁻⁵. The run (plan, votes, images) is in the Hugging Face repo under `reports/blind-ab`.

### Ablations

Neon Chevron, 12 variants: no `DeltaPalette`; `RCT` 0, 6, 27; `Bitdepth 8`; only `Gradient`; only `Select`; `Gradient -1` and `-20`; split at `x > 160`; `Select 0`.

Fault Line Meadow (`Bitdepth 8`, `Width 128`, `Height 128`, `Upsample 8`, `RCT 0`, `DeltaPalette`, `if x > 52` → `W -1` / `Weighted -7`), 8 variants: no `Upsample` (drawn natively at 1024 px, a smooth gradient with fine threads); no `DeltaPalette` (black); no `RCT` (unchanged; 0 is the default); only `Weighted` (chaos everywhere); only `W` (faint stripes); `Weighted -3` (mostly black with a bright glow); split at `x > 90` (smaller meadow).

### The Queen's Fractal match

Every trained-model sample was compared with every gallery piece by CLIP image similarity, and with every published gallery program by recipe (token-sequence) similarity. The closest match was decoded at full resolution and compared pixel by pixel: 53% of pixels identical, mean difference 10/255, CLIP similarity 0.998. The model's program:

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

| | Queen-like (CLIP ≥ 0.95) | ≥ 0.97 | closest |
|---|---|---|---|
| random training programs (3,000) | 0.6% | 0.2% | 0.994 |
| starting model, step 0 (661 valid of 1,024) | 1.7% | 0.6% | 0.996 |
| trained model, step 820 (917 valid of 1,024) | 1.4% | 0.4% | **0.998** |

Programs with only constant leaves rose from 2% to 42% of the model's output over training, but those mostly make other tiled patterns. Other look-alikes: "Waterfall Brushes" (Halcyon, 2025; same `DeltaPalette` + `Weighted ±3` strokes), "melting crystal" (CrushedAsian255; same `DeltaPalette` + `AvgN+NW -1` core), "Shattered palette" (CrushedAsian255; a split screen with `Gradient`), "Chromatic Stripes" (dogelition; `DeltaPalette` with diagonal `Gradient` bands). No trained-model sample reached 0.8 recipe similarity to any gallery program; the maximum was 0.64.

### Techniques

Technique usage per valid sample. The distance between the model's technique mix and the gallery's grew from 0.12 to 0.16. The median CLIP similarity of each output to its nearest training image stayed at 0.95 at every checkpoint.

| technique | gallery | step 0 | step 400 | step 820 |
|---|---|---|---|---|
| per-channel branches | 45% | 43% | 25% | 17% |
| deep trees (depth ≥ 4) | 21% | 12% | 2% | 1% |
| splines | 7% | 0% | 0% | 0% |
| multi-layer images | 1% | 0% | 0% | 0% |
| `Weighted` predictor | 16% | 12% | 8% | **19%** |
| neighbour-gradient branches | 52% | 35% | 28% | **47%** |

### What the picks rewarded

Win rates for items compared at least twice, split by a property of their program. The program parts the model abandoned (`PrevErr`, `Orientation`, `y` splits, `NE`) all scored lower with the taste model.

| property | wins with | wins without |
|---|---|---|
| `RCT` header | **42%** | 31% |
| non-square canvas | 30% | **41%** |
| deep tree (n = 32) | 21% | 38% |

### Failures in numbers

In version 1, 35% of the training programs were edits of gallery pieces and the gallery itself was repeated 10 times; the starting model produced 42% near-copies (≥ 0.8 recipe similarity). Programs at least 0.9 similar to a gallery recipe made up 64% of what the labeler saw at the peak and won 37% of comparisons against 15% for programs under 0.7. The version-1 collapse around step 160 raised within-batch CLIP similarity from 0.81 to 0.93 and halved colour spread. In version 2, near-twins rose from 38% to 57% near step 800, which mean pairwise similarity did not register.
