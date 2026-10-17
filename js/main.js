/* NB P4 PDP: front-end behaviour. No dependencies. */
(function () {
  'use strict';

  /* Keep the decorative offer fireworks paused offscreen or in a hidden tab. */
  var offer = document.getElementById('s-offer');
  if (offer) {
    var offerInView = false;
    function updateOfferFireworks() {
      offer.classList.toggle('is-visible', offerInView && !document.hidden);
    }
    if ('IntersectionObserver' in window) {
      var offerObserver = new IntersectionObserver(function (entries) {
        offerInView = entries[0].isIntersecting;
        updateOfferFireworks();
      }, { threshold: 0.1 });
      offerObserver.observe(offer);
    } else {
      offerInView = true;
      updateOfferFireworks();
    }
    document.addEventListener('visibilitychange', updateOfferFireworks);
  }

  /* 1. Looping media: play only while on screen (saves CPU/data). Falls back to the GIF inside <video> if MP4 can't play. */
  var vids = document.querySelectorAll('video.loop-media');
  vids.forEach(function (v) {
    v.muted = true;
    v.addEventListener('error', swapToGif, true);
    function swapToGif() { var g = v.querySelector('img[data-gif-fallback]'); if (g) { g.loading = 'eager'; v.replaceWith(g); } }
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (v.preload === 'none') { v.preload = 'auto'; v.load(); } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { rootMargin: '200px' });
    vids.forEach(function (v) { io.observe(v); });
  } else vids.forEach(function (v) { v.preload = 'auto'; v.play(); });

  /* The product gallery uses the supplied thumbs as its source of truth. */
  var gallery = document.getElementById('s-gallery');
  if (gallery) {
    var stage = gallery.querySelector('.stage');
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.vthumbs .vth'));
    var galleryMedia = document.createElement('div');
    galleryMedia.className = 'stage-gallery-media';
    galleryMedia.setAttribute('aria-live', 'polite');
    stage.appendChild(galleryMedia);

    function selectGalleryItem(index) {
      var thumb = thumbs[index];
      if (!thumb) return;
      var playing = galleryMedia.querySelector('video');
      if (playing) playing.pause();
      galleryMedia.replaceChildren();
      galleryMedia.classList.toggle('is-box-portrait', index === 1);
      stage.classList.toggle('is-alt', index !== 0);

      if (index !== 0) {
        var thumbVideo = thumb.querySelector('video');
        var media;
        if (thumbVideo) {
          media = document.createElement('video');
          media.controls = true;
          media.autoplay = true;
          media.muted = true;
          media.loop = true;
          media.playsInline = true;
          media.preload = 'metadata';
          media.poster = thumbVideo.getAttribute('poster') || '';
          media.src = thumbVideo.querySelector('source').getAttribute('src');
          media.setAttribute('aria-label', thumbVideo.getAttribute('aria-label') || 'Product video');
          media.addEventListener('error', function () {
            var fallback = thumbVideo.querySelector('[data-gif-fallback]');
            if (fallback) {
              var gif = document.createElement('img');
              gif.src = fallback.getAttribute('src');
              gif.alt = fallback.getAttribute('alt') || 'Product animation';
              media.replaceWith(gif);
            }
          }, { once: true });
        } else {
          media = document.createElement('img');
          var image = thumb.querySelector('img');
          media.src = image.getAttribute('src');
          media.alt = image.getAttribute('alt') || 'Product image';
        }
        galleryMedia.appendChild(media);
        if (media.tagName === 'VIDEO') media.play().catch(function () {});
      }

      thumbs.forEach(function (item, itemIndex) {
        var selected = itemIndex === index;
        item.classList.toggle('on', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
    }

    thumbs.forEach(function (thumb, index) {
      var visual = thumb.querySelector('img, video');
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('aria-label', 'Show ' + (visual.getAttribute('alt') || visual.getAttribute('aria-label') || 'product image'));
      thumb.addEventListener('click', function () { selectGalleryItem(index); });
      thumb.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectGalleryItem(index);
        }
      });
    });
    selectGalleryItem(0);
  }

  /* The storyboard now plays the complete official video; frames seek to their moments. */
  var storyboard = document.getElementById('s-video');
  if (storyboard) {
    var screen = storyboard.querySelector('.pscreen');
    var productVideo = document.createElement('video');
    productVideo.className = 'product-story-video';
    productVideo.src = 'assets/video/p4-official-product.mp4';
    productVideo.poster = 'assets/img/p4-official-product-first.jpg';
    productVideo.preload = 'metadata';
    productVideo.muted = true;
    productVideo.defaultMuted = true;
    productVideo.playsInline = true;
    productVideo.controls = true;
    productVideo.setAttribute('aria-label', 'Official NB P4 product video');
    screen.appendChild(productVideo);
    screen.classList.add('has-video');

    var scenes = Array.prototype.slice.call(storyboard.querySelectorAll('.scenes .sc2'));
    var markers = Array.prototype.slice.call(storyboard.querySelectorAll('.tlbar .mk'));
    var moments = [1, 2, 8, 20, 37, 43];
    var fill = storyboard.querySelector('.tlfill');
    var caption = storyboard.querySelector('.pcap');
    fill.style.width = '0%';
    caption.textContent = '0:00 · Official NB P4 product video';

    /* Start the second-fold video when its player enters view, and pause it offscreen. */
    var storyVisible = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function updateStoryPlayback() {
      if (storyVisible && !document.hidden && !reduceMotion) {
        productVideo.preload = 'auto';
        var playback = productVideo.play();
        if (playback && playback.catch) playback.catch(function () {});
      } else {
        productVideo.pause();
      }
    }
    if ('IntersectionObserver' in window) {
      var storyObserver = new IntersectionObserver(function (entries) {
        storyVisible = entries[0].intersectionRatio >= 0.25;
        updateStoryPlayback();
      }, { threshold: [0, 0.25] });
      storyObserver.observe(screen);
    } else {
      storyVisible = true;
      updateStoryPlayback();
    }
    document.addEventListener('visibilitychange', updateStoryPlayback);

    function seekTo(index) {
      if (typeof moments[index] !== 'number') return;
      productVideo.currentTime = moments[index];
      productVideo.play().catch(function () {});
      scenes.forEach(function (scene, sceneIndex) {
        scene.classList.toggle('is-current', sceneIndex === index);
        scene.setAttribute('aria-current', sceneIndex === index ? 'true' : 'false');
      });
      caption.textContent = '0:' + String(moments[index]).padStart(2, '0') + ' · ' + scenes[index].querySelector('b').textContent;
    }

    scenes.forEach(function (scene, index) {
      scene.setAttribute('role', 'button');
      scene.setAttribute('tabindex', '0');
      scene.setAttribute('aria-label', 'Play from ' + scene.querySelector('b').textContent);
      scene.addEventListener('click', function () { seekTo(index); });
      scene.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          seekTo(index);
        }
      });
    });
    markers.forEach(function (marker, index) {
      marker.setAttribute('role', 'button');
      marker.setAttribute('tabindex', '0');
      marker.setAttribute('aria-label', 'Play video from ' + moments[index] + ' seconds');
      marker.addEventListener('click', function () { seekTo(index); });
      marker.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          seekTo(index);
        }
      });
    });
    productVideo.addEventListener('timeupdate', function () {
      if (productVideo.duration) fill.style.width = (productVideo.currentTime / productVideo.duration * 100) + '%';
    });
    productVideo.addEventListener('error', function () {
      screen.classList.remove('has-video');
      productVideo.remove();
    }, { once: true });
  }

  /* 2. Sticky mobile buy bar: show after the main Buy button scrolls out of view */
  var bar = document.getElementById('s-mobilebuy');
  var buy = document.querySelector('.buybox .buy');
  if (bar && buy && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { bar.classList.toggle('is-visible', !e[0].isIntersecting && e[0].boundingClientRect.top < 0); })
      .observe(buy);
  }

  /* 3. Fit checker: FRONT-END STUB ONLY.
     TODO(backend): replace stubCheck() with a POST to the Worker endpoint described in fit-checker-build.md:
       fetch(ENDPOINT, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({model, product:'nb-p4'})})
     Expected response: {status:'fits'|'unsure'|'no_fit', summary?, reason?, whatsapp}
     Never ship the stub: it does not know real TV specs. */
  var ENDPOINT = null; // TODO(backend): e.g. 'https://fit.newlinktv.in/check'
  var WA = 'https://wa.me/919131956290?text=';
  var form = document.getElementById('fit-form');
  var input = document.getElementById('fit-model');
  var out = document.getElementById('fit-result');

  function waLink(model) { return WA + encodeURIComponent('Hi, will the NB P4 fit my TV? Model: ' + model); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function stubCheck(model) {
    // DEMO ONLY so the three UI states can be seen. Uses no real data.
    var m = model.toUpperCase();
    return new Promise(function (res) {
      setTimeout(function () {
        // Only the literal demo keywords trigger fits/no_fit; every real model returns 'unsure'.
        if (m === 'DEMO-NOFIT') res({ status: 'no_fit', reason: 'VESA 600×400 (example)' });
        else if (m === 'DEMO-FIT') res({ status: 'fits', summary: 'VESA 200×200, 8.2 kg, 43" (example)' });
        else res({ status: 'unsure' });
      }, 700);
    });
  }
  function check(model) {
    if (ENDPOINT) {
      return fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: model, product: 'nb-p4' }) })
        .then(function (r) { return r.json(); });
    }
    return stubCheck(model);
  }
  function render(r, model) {
    var wa = '<a href="' + waLink(model) + '" target="_blank" rel="noopener">WhatsApp us your model</a>';
    if (r.status === 'fits')
      out.innerHTML = '<div class="fr ok"><span class="fr-i">✓</span><div><b>Fits: ' + esc(r.summary || '') + '</b><small>Within all three P4 limits</small></div></div>';
    else if (r.status === 'no_fit')
      out.innerHTML = '<div class="fr no"><span class="fr-i">✕</span><div><b>Won\'t fit: ' + esc(r.reason || '') + '</b><small>Outside the P4\'s limits. ' + wa + ' and we\'ll suggest a mount that fits.</small></div></div>';
    else
      out.innerHTML = '<div class="fr mid"><span class="fr-i">?</span><div><b>Not sure. ' + wa + '</b><small>We\'ll confirm before you pay · +91 91319 56290</small></div></div>';
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var model = (input.value || '').trim().slice(0, 40);
      if (!model) { input.focus(); return; }
      out.innerHTML = '<div class="fr loading"><div><b>Checking ' + esc(model) + '…</b></div></div>';
      check(model).then(function (r) { render(r, model); })
        .catch(function () { render({ status: 'unsure' }, model); });
    });
    document.querySelectorAll('.fa-chip').forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.dataset.model; input.focus(); });
    });
  }
  // Dev aid: type DEMO-FIT / DEMO-NOFIT / anything else to see each state, or open index.html#fit-demo to show the three designed example states.
  if (location.hash === '#fit-demo') { var ex = document.getElementById('fit-examples'); if (ex) ex.hidden = false; }

  /* Size, weight and VESA guide: one focused diagram at a time. */
  var fitGuide = document.querySelector('#s-load .fit-guide');
  if (fitGuide) {
    var fitTabs = Array.prototype.slice.call(fitGuide.querySelectorAll('[role="tab"]'));
    function selectFitTab(tab, moveFocus) {
      fitTabs.forEach(function (item) {
        var selected = item === tab;
        var panel = document.getElementById(item.getAttribute('aria-controls'));
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        if (panel) panel.hidden = !selected;
      });
      if (moveFocus) tab.focus();
    }
    fitTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { selectFitTab(tab, false); });
      tab.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % fitTabs.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + fitTabs.length) % fitTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = fitTabs.length - 1;
        else return;
        event.preventDefault();
        selectFitTab(fitTabs[next], true);
      });
    });
  }

  /* VESA explorer: preview one exact supported pattern at a time. */
  var vesaCarousel = document.getElementById('vesa-carousel');
  if (vesaCarousel) {
    var vcPatterns = [[100, 100], [200, 100], [200, 200], [300, 200], [300, 300], [400, 200], [400, 300], [400, 400]];
    var vcIndex = 2;
    /* Keep even the 400 × 400 pattern within the generated TV's blank rear panel. */
    var vcScale = .575;
    var vcCenterX = 400;
    var vcCenterY = 232.5;
    var vcHoles = Array.prototype.slice.call(document.querySelectorAll('#vc-selected-holes circle'));
    var vcDots = document.getElementById('vc-dots');
    var vcValue = document.getElementById('vc-pattern');
    var vcCount = document.getElementById('vc-count');
    var vcTitle = document.getElementById('vc-svg-title');
    var vcShape = document.getElementById('vc-selected-shape');
    var vcWidthArrow = document.getElementById('vc-width-arrow');
    var vcHeightArrow = document.getElementById('vc-height-arrow');
    var vcWidthLabel = document.getElementById('vc-width-label');
    var vcHeightLabel = document.getElementById('vc-height-label');
    function vcLabel(pattern) { return pattern[0] + ' × ' + pattern[1] + ' mm'; }
    function vcRender(index) {
      vcIndex = (index + vcPatterns.length) % vcPatterns.length;
      var pattern = vcPatterns[vcIndex];
      var x1 = vcCenterX - pattern[0] * vcScale / 2;
      var x2 = vcCenterX + pattern[0] * vcScale / 2;
      var y1 = vcCenterY - pattern[1] * vcScale / 2;
      var y2 = vcCenterY + pattern[1] * vcScale / 2;
      [[x1, y1], [x2, y1], [x1, y2], [x2, y2]].forEach(function (point, holeIndex) {
        vcHoles[holeIndex].setAttribute('cx', point[0]);
        vcHoles[holeIndex].setAttribute('cy', point[1]);
      });
      vcShape.setAttribute('x', x1);
      vcShape.setAttribute('y', y1);
      vcShape.setAttribute('width', x2 - x1);
      vcShape.setAttribute('height', y2 - y1);
      vcWidthArrow.setAttribute('d', 'M' + (x1 + 12) + ' ' + (y1 - 28) + 'H' + (x2 - 12));
      vcHeightArrow.setAttribute('d', 'M' + (x1 - 28) + ' ' + (y1 + 12) + 'V' + (y2 - 12));
      vcWidthLabel.setAttribute('y', y1 - 43);
      vcWidthLabel.textContent = pattern[0] + ' mm across';
      vcHeightLabel.setAttribute('x', x1 - 44);
      vcHeightLabel.setAttribute('y', vcCenterY + 7);
      vcHeightLabel.textContent = pattern[1] + ' mm down';
      vcValue.textContent = vcLabel(pattern);
      vcCount.textContent = 'Pattern ' + (vcIndex + 1) + ' of ' + vcPatterns.length;
      vcTitle.textContent = 'Example VESA ' + pattern[0] + ' by ' + pattern[1] + ' millimetre pattern';
      Array.prototype.forEach.call(vcDots.children, function (dot, dotIndex) {
        dot.setAttribute('aria-current', String(dotIndex === vcIndex));
      });
    }
    vcPatterns.forEach(function (pattern, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Show ' + vcLabel(pattern) + ' pattern');
      dot.addEventListener('click', function () { vcRender(index); });
      vcDots.appendChild(dot);
    });
    document.getElementById('vc-prev').addEventListener('click', function () { vcRender(vcIndex - 1); });
    document.getElementById('vc-next').addEventListener('click', function () { vcRender(vcIndex + 1); });
    vesaCarousel.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); vcRender(vcIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); vcRender(vcIndex + 1); }
    });
    var vcTouchStart = null;
    vesaCarousel.querySelector('.vc-tv').addEventListener('touchstart', function (event) {
      vcTouchStart = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
    }, { passive: true });
    vesaCarousel.querySelector('.vc-tv').addEventListener('touchend', function (event) {
      if (!vcTouchStart) return;
      var dx = event.changedTouches[0].clientX - vcTouchStart[0];
      var dy = event.changedTouches[0].clientY - vcTouchStart[1];
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) vcRender(vcIndex + (dx < 0 ? 1 : -1));
      vcTouchStart = null;
    }, { passive: true });
    vcRender(vcIndex);
  }
})();
