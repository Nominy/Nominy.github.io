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

> **The short version**
>
> I spent two days teaching a tiny model to write JPEG XL art: little programs, a few dozen bytes each, that an image decoder turns into pictures. The model is small enough to run in your browser, which is what the test above is doing. It never saw art made by people. Everything it knows about what looks good, it learned from me clicking left or right on pairs of its pictures, about fourteen hundred times.
>
> It got better, and in a blind test afterwards I picked its newer pictures 39 times out of 50. Some of its images turned out to look almost exactly like pieces by human artists. Working out why was my favourite part.

![Twelve hand-picked images from the trained model, each with its checkpoint and byte size.](/posts/jxl-art-rlhf/panel.webp)
*A few of the model's pictures. Each one is a program of a few dozen bytes.*

## Pictures made of rules

Imagine you get 29 bytes to make a picture. That's not even enough to store ten pixels. The only way to get an image out of it is to write down a rule and let something else do the drawing.

JPEG XL, the image format, has a little rule language built in. When it compresses an image, it guesses each pixel from its neighbours using a tiny decision tree: "on the right half, copy the pixel to the left; everywhere else, average the ones above". Usually the file also stores corrections for every wrong guess. If you leave the corrections out, the decoder simply paints its guesses, and the tree becomes the picture.

People have been writing these trees by hand since 2021 and calling it JXL art. There's a lovely gallery of 241 pieces at jpegxl.info, most of them found by fiddling in an online editor until something beautiful appeared. The picture at the top of this post is one my model wrote. I call it Neon Chevron, and it's 29 bytes.

## What I wanted to find out

I was curious how far a really small model could get at this with two handicaps. It would never see a program written by a person, so it couldn't copy the gallery. And the only thing telling it what looks good would be me, picking the nicer of two pictures, over and over.

That second part is a miniature of how chatbots get shaped after their main training: people compare two answers and pick the better one, and the model learns from those picks. That's called RLHF, reinforcement learning from human feedback. It's hard to see what those picks teach a big model. Here everything is small enough to look at: every picture, every program, every click.

I built it with Claude as a coding partner, over two days.

## How it went

First the model had to learn the language. I generated 24,000 random programs, which took about three-quarters of an hour, and kept the ones that actually produced a picture. None came from the gallery. After a few minutes of training on those, the model could write working programs about two-thirds of the time, with no taste at all yet.

Then the fun part. A little page on my screen showed two of the model's pictures, and I pressed ← or → for the one I liked. A small helper model learned my taste from those clicks, the main model learned to make pictures the helper thought I'd like, and every 25 clicks I got a fresh batch from the improved model. I started on my desktop PC. When I had chores to do, I moved everything to my MacBook and kept clicking from there.

![The labeling page.](/posts/jxl-art-rlhf/labeling_ui.webp)
*The page I clicked through 1,442 times. The square cards will come up again later.*

## Did my taste rub off on it?

It did, and not only by my own judgement.

The first thing you notice is that it breaks less. At the start about a third of its programs failed to produce a picture; by the end, one in ten did. Its programs also got shorter while the pictures got richer. By one rough measure it now packs more picture into each byte than the human gallery does.

![Random samples from the starting model, step 0.](/posts/jxl-art-rlhf/evolution_step0.webp)
*Random pictures from the model before I started clicking.*

![Random samples from the trained model, step 800, same seed.](/posts/jxl-art-rlhf/evolution_step800.webp)
*Random pictures from the same model near the end.*

There's a known trap with this kind of training. The model only ever hears from the helper model, never from me directly, so it might learn to please the helper and drift away from what I actually like. I checked this a few ways.

I asked an off-the-shelf image model, one that never saw any of my clicks, whether each picture looked more like "a beautiful abstract artwork" or like noise and glitches. It liked the trained model's pictures much more, nearly as much as the human gallery. A version of my helper trained only on my early clicks, before it could have seen any of the later pictures, agreed too. And I hit "both bad" far less often as training went on.

The most direct check was a blind test after training ended. I looked at 50 fresh pairs, each with one picture from the model before training and one from after, shuffled, with no labels until the end. I picked the trained model's picture 39 times out of 50. You can take the same test at the top of this page.

## Taking a 29-byte picture apart

My favourite thing about this setup is that the model's output is a program you can read. So I took my favourite piece, which also happened to be Claude's, and tried to explain every word in it. Then I checked each explanation by changing that word and seeing whether the picture changed the way I expected.

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

The program splits the canvas at x = 226 and paints each side with a different rule.

- **The tip of the chevron is where the two rules meet.** Move the split to 160 and the tip moves with it.
- **`Gradient -5` draws the glowing diagonals.** Change the 5 and the stripes change, from faint threads to blown-out bands, but the shape stays.
- **`Select -1` bends the light downward and lets it fade.** On its own it draws almost nothing, because there's nothing bright for it to carry on.
- **`DeltaPalette` brings all the colour.** Take it away and the picture goes black. **`Bitdepth 12`** gives the deep night sky; at 8 the same program washes out.
- **`RCT 13` does nothing at all.** Four different values give the same picture. Hold that thought.

![Twelve variants of Neon Chevron.](/posts/jxl-art-rlhf/neon_chevron_ablation.webp)
*Neon Chevron with one word changed at a time. You can open the original in the [online editor](https://www.januschka.com/jxl-art/?zcode=eNodxzEKgDAMBdA9p_gXKNgWHR1U0FFUcC422kARkQweX3F7rxGNfGmCdbRK_OBdQQPLkfTn1C6wnjrOGsaQWZVJdjyo4VxFgMHMmTeFsf_6O0Th83tJLwomGhg) and press Run.*

Another favourite, which I named Fault Line Meadow, works the same way. On one side of a seam, a jittery rule makes chaos. On the other, a calm rule carries that chaos sideways and fades it into a green field. The mossy grain comes from the program drawing a small image and asking the decoder to blow it up eight times.

![Eight variants of Fault Line Meadow.](/posts/jxl-art-rlhf/fault_line_meadow_ablation.webp)
*Fault Line Meadow, taken apart the same way.*

Once I'd seen that pattern, I kept finding it in the model's best pictures: a seam, with something energetic on one side feeding something calm on the other.

## The fractal that turned out to be a sweet spot

Partway through, I noticed that some of the model's pictures looked a lot like gallery pieces. One in particular looked almost exactly like "The Queen's Fractal", a 21-byte piece by Jon Sneyers, one of the people who created JPEG XL. He never published its code.

The model's version is a different, slightly longer program, and it draws the same image at the same size. More than half of the pixels are identical, and the rest are very close.

![The model's 35-byte image (left) and The Queen's Fractal, 21 bytes (right).](/posts/jxl-art-rlhf/queens_fractal_pair.webp)
*The model's version on the left, Jon Sneyers' original on the right.*

For a moment it looked like the model had rediscovered a human artwork without ever seeing it. Before saying that out loud, I checked how often plain random programs land on the same picture. The answer: about one in 170. And the model made it about as often before training as after.

So the more honest story is that this picture is easy to reach in JPEG XL's little language. Jon found it by hand, random programs stumble onto it, and my model makes it at about the rate it always did. I started calling places like this **format sweet spots**: corners of the format where a very short program gives you a rich, structured image. The other look-alikes feel the same way, the same visual idea built from a different program.

![Model images beside the gallery pieces they resemble.](/posts/jxl-art-rlhf/convergent_pairs.webp)
*More of the model's pictures beside gallery pieces they resemble.*

## What it didn't learn

It didn't invent anything new. My clicks changed which of its existing habits it uses, and that's all.

Human artists use some tools my model never touches, like smooth painted curves and stacked layers. Those were never in its training data, and it never found them on its own. Among the tools it did know, it drifted away from the ones artists like most. Its pictures stayed about as close to its random training data as they were on day one. What my clicks did was point it at the parts of that data I liked.

## What it learned from me by accident

My clicks taught it more than I meant to.

Remember `RCT 13`, the word that does nothing? Pictures with it happened to win more often, so the model learned to write it, and by the end most of its programs include it. It's a little superstition, picked up from my clicks.

The labeling page left its mark too. Every picture sat in a square card, so wide and tall pictures showed up smaller, with black bars around them, and I picked them less often. The model learned to prefer squares.

I find these two oddly charming, and they're also a small version of a real problem with RLHF: a model learns whatever the feedback rewards, and the feedback always rewards a bit more than the person giving it intended.

![Top images by the learned taste model, step 820.](/posts/jxl-art-rlhf/best_by_taste.webp)
*The pictures my helper model likes best.*

![Top images by the independent CLIP judge, step 820.](/posts/jxl-art-rlhf/best_by_clip.webp)
*The pictures the outside judge likes best.*

![Liked images that are least like their training data and the gallery, step 820.](/posts/jxl-art-rlhf/most_unique_liked.webp)
*Pictures I liked that look least like anything in the training data or the gallery.*

## Things that went wrong

This post makes it sound smoother than it was. The first attempt went sideways in a couple of instructive ways.

**The first model copied.** In my first try, the training data included edited versions of gallery pieces. The model learned to make near-copies of them, and I kept picking those, because gallery pieces are the good ones and resemblance looked like quality. At one point most of what I was shown was close to something in the gallery. Once I measured it, I threw that model away and started over without the gallery.

![Version-1 outputs (left of each pair) beside the gallery pieces they copied.](/posts/jxl-art-rlhf/v1_copies.webp)
*First-attempt pictures (left in each pair) next to the gallery pieces they were copying.*

**It got stuck on one idea.** At one point the first model made the same pattern in the same colours over and over. I rolled it back and changed the setup so that each batch showed me the most varied pictures it could find. A milder version of this crept back near the end of the second run, as a woven teal, red and black pattern.

![Version-1 samples during the collapse.](/posts/jxl-art-rlhf/collapse.webp)
*The first model, stuck on one idea.*

**Smaller bumps.** The model started from scratch because starting from its English-language weights made it worse at this. My helper model stopped getting sharper after about 500 clicks, which caps how far this setup can go. And at one point training crawled at a twentieth of its speed because I had two jobs and a browser open at once and the graphics card ran out of memory.

## What I think this shows

The exciting headline would be "a tiny model learned to think like JXL artists", and I don't think that's true here. It never used the artists' tools, it moved away from their techniques, and it lands on their most famous look-alike no more often than random programs do. What I saw is a model being steered, by one person's taste, toward particular places it could already reach.

The idea I'm left with is the sweet spots. JPEG XL's little language seems to have a few places where tiny programs make rich pictures, and artists, random search and a taste-guided model all end up there. When very different programs arrive at the same picture, that says something about the format itself.

The blind test has two catches. I'm the person whose clicks trained the model, so it only shows the model moved toward my taste. And after fourteen hundred clicks I might recognise its style, so the test hides the labels but maybe not the style. I'd love to know whether other people pick the same way.

## Play with it

The test at the top of this post also has its own page with more rounds: [nafty.is-a.dev/jxl-blind-test](/jxl-blind-test/). Everything runs on your device.

The code is at [github.com/Nominy/jxl-art-rlhf](https://github.com/Nominy/jxl-art-rlhf). Every checkpoint, every click and every picture shown during training is at [huggingface.co/Nafty/jxl-art-rlhf](https://huggingface.co/Nafty/jxl-art-rlhf). The human gallery lives at [jpegxl.info/art](https://jpegxl.info/art/), and you can write your own pieces in the [online editor](https://www.januschka.com/jxl-art/).

Things I'd like to try next: blind tests with people other than me, giving the model curves and layers so it can reach the tools artists use, a labeling page that shows pictures at their real shape, and checking how easy the other look-alikes are to reach by chance.

## For the curious: methods and numbers

Everything above, with the details and numbers left in.

### How it was built

**Model.** Supra2.5-Pico by SupraLabs (Apache-2.0): a 2,982,480-parameter transformer with 10 layers, trained from scratch. Starting from its English weights gave 41% usable pictures against 57% from scratch.

**Programs.** Tree programs compiled with libjxl v0.12.0's `jxl_from_tree`. A program counts if it compiles, decodes, is at most 256 bytes and isn't blank.

**Training data.** 24,000 programs made in 43 minutes, 18% drawn fresh from the grammar and 82% small mutations of earlier ones, with duplicates removed. Anything within 0.8 similarity of a gallery program would have been thrown out; none came up. Median size 35 bytes.

**The clicking loop.** I could pick left, right, "equal" or "both bad". The helper (a Bradley–Terry model on CLIP image features) refit after every click. Every 25 clicks the model took 20 small policy-gradient steps, kept close to where it started by a KL penalty, and the next batch showed the 32 most varied of about 120 fresh pictures. The reward also penalised look-alikes within a batch, near-copies of the gallery, and broken output.

**Machines.** Training started on my Windows PC with an RTX 5060 Ti. From step 120 on it ran on a MacBook Air, using an Apple MLX version of the same model that gives the same outputs within rounding. The run moved between the two through Hugging Face.

### Before and after

256 samples per checkpoint. The outside judge is CLIP choosing between "a beautiful abstract digital artwork" and prompts like "random noise", "a blank screen" and "a glitchy corrupted image".

| | random training programs | human gallery | start | step 400 | step 820 |
|---|---|---|---|---|---|
| usable pictures | – | – | 64% | 84% | **90%** |
| helper's score (median) | −0.35 | 0.85 | −0.27 | 0.05 | **0.69** |
| outside judge, P("beautiful artwork") | 0.27 | 0.47 | 0.27 | 0.34 | **0.42** |
| picture detail (PNG KB at 256 px) | 34 | 61 | 24 | 21 | **50** |
| PNG bytes per program byte | 913 | 1,562 | 849 | 743 | **1,737** |
| program size (median bytes) | 35 | 32 | 32 | 31 | **29** |
| near-copies of gallery programs | 0% | – | 0% | 0% | **0%** |

A helper trained only on my first 704 clicks scores the pictures −0.14 at the start and +0.69 at step 800. "Both bad" went from 45% of my picks at the start to about 16% from step 300 on.

### The blind test

50 pairs, sampled once and frozen, sides shuffled, sources hidden. The trained model won 39, the starting model 11, no ties. That's 78%, with a 95% interval of 64–88% (exact binomial p = 9×10⁻⁵). The pairs and my votes are on Hugging Face under `reports/blind-ab`.

### The Queen's Fractal

The model's 35-byte program against Jon's 21 bytes: 53% of pixels identical at 1024×1024, average difference 10 out of 255.

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

| | pictures that look like The Queen's Fractal |
|---|---|
| random training programs | 0.6% (about 1 in 170) |
| model at the start | 1.7% |
| model after training | 1.4% |

Other look-alikes: "Waterfall Brushes" (Halcyon), "melting crystal" and "Shattered palette" (CrushedAsian255), "Chromatic Stripes" (dogelition). None of the model's programs came within 0.8 similarity of a gallery program; the closest was 0.64.

### Techniques

| technique | human gallery | start | step 400 | step 820 |
|---|---|---|---|---|
| separate logic per colour channel | 45% | 43% | 25% | 17% |
| deep trees | 21% | 12% | 2% | 1% |
| curves (splines) | 7% | 0% | 0% | 0% |
| layers | 1% | 0% | 0% | 0% |
| `Weighted` predictor | 16% | 12% | 8% | 19% |

### What my clicks rewarded

| | won with it | won without it |
|---|---|---|
| `RCT` in the program | 42% | 31% |
| non-square picture | 30% | 41% |

The model writes `RCT` in 72–85% of its programs by the end.

### The first attempt, in numbers

35% of the first training set were edits of gallery pieces. 42% of that model's programs were near-copies, and near-copies made up 64% of what I saw at the peak. They won 37% of my comparisons against 15% for original-looking ones. The collapse pushed the similarity between pictures in a batch from 0.81 to 0.93.
