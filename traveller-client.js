// The traveling patient, browser side (design 4.1, build plan stage 3). Reads the compact data asset, keeps the route
// in the URL hash (#r=PRT:ESP.m,FRA.m), and re-renders Figure 1, the notes and the stop tables with TravellerCore,
// the same code that rendered the page at build time. No third-party request; no animation (stage 4).
(function () {
  'use strict';
  var C = window.TravellerCore, form = document.getElementById('traveller-app');
  if (!C || !form || !window.fetch) return;
  var $ = function (id) { return document.getElementById(id); };
  var A = null, nb = null, nbl = null, route = null, presetId = 'visitor', OUT = null, cur = 'end', timer = null, playing = false;
  var stage = $('stage');
  var valid = function (i) { return !!(A && A.data[i]); };

  function say(msg) { $('tr-msg').textContent = msg; }
  function note(msg) { var n = $('st-note'); n.textContent = msg; n.hidden = !msg; }
  function options() { return $('tr-country-options').innerHTML; }

  function render(r, opts) {
    opts = opts || {};
    var errs = C.validateRoute(r, valid);
    if (errs.length) { say(errs.join(' ')); syncEditor(); return false; }
    route = r; note('');
    var named = C.namedRoute(r, nb);
    presetId = named.id;
    var out;
    try { out = C.renderDynamic(A, r, nb); } catch (e) { say('We could not draw this trip. The trip on screen is unchanged.'); syncEditor(); return false; }
    OUT = out;
    $('route-h2').innerHTML = stage.classList.contains('wz-open') ? C.esc(WZ_H2) : out.h2html; // the wizard keeps its own question
    $('figs').innerHTML = out.figs;
    $('stops-dyn').innerHTML = out.stops;
    $('method-notes').innerHTML = out.methodNotes;
    if (!opts.quiet) $('route-live').textContent = out.live;
    say('');
    syncControls(named);
    bindLocator();
    stop(false); setStop(opts.cur === undefined ? 'end' : opts.cur, { quiet: true, ms: 0 });
    return true;
  }

  function syncControls(named) {
    $('tr-home').value = route.home;
    $('tr-preset').value = named.id;
    var ao = $('tr-preset').querySelector('option[value="athlete"]'); if (ao) ao.textContent = C.presetRoute('athlete', route.home, nb).title; // the move count follows the home
    $('tr-modes').textContent = named.id === 'custom' ? 'Your own trip: ' + route.stops.map(function (s, i) { return (i + 1) + ' ' + A.data[s.iso3].name + ' (' + modeWord(s, i) + ')'; }).join(', ') + '.'
      : named.title + ', ' + named.note + ': ' + named.modes + '.';
    syncEditor();
  }
  function modeWord(s, i) { var h = C.holdersFor(route)[i]; return h.kind === 'return' ? 'back home' : s.mode; }

  // The free-route editor: one row per stop, every control labelled with its stop number.
  function syncEditor() {
    var ol = $('tr-stops'), r = route, html = '';
    r.stops.forEach(function (s, i) {
      var n = i + 1;
      html += '<li><div class="crow">' +
        '<label for="tr-s' + i + '" class="vh">Stop ' + n + ' country</label><select id="tr-s' + i + '" data-i="' + i + '" data-k="iso">' + options() + '</select>' +
        '<label for="tr-m' + i + '" class="vh">Stop ' + n + ' mode</label><select id="tr-m' + i + '" data-i="' + i + '" data-k="mode"><option value="visiting">visit</option><option value="moved">move there</option></select>' +
        '<button type="button" data-i="' + i + '" data-k="up"' + (i === 0 ? ' disabled' : '') + '>Move stop ' + n + ' up</button>' +
        '<button type="button" data-i="' + i + '" data-k="down"' + (i === r.stops.length - 1 ? ' disabled' : '') + '>Move stop ' + n + ' down</button>' +
        '<button type="button" data-i="' + i + '" data-k="del"' + (r.stops.length === 1 ? ' disabled' : '') + '>Remove stop ' + n + '</button></div></li>';
    });
    ol.innerHTML = html;
    r.stops.forEach(function (s, i) { $('tr-s' + i).value = s.iso3; $('tr-m' + i).value = s.mode; });
    var full = r.stops.length >= C.MAX_STOPS;
    $('tr-add-btn').disabled = full;
    $('tr-add').disabled = full;
  }

  function copyRoute() { return { home: route.home, stops: route.stops.map(function (s) { return { iso3: s.iso3, mode: s.mode }; }) }; }

  function addStop(iso) {
    if (route.stops.length >= C.MAX_STOPS) { say('A trip can have up to ' + C.MAX_STOPS + ' stops.'); return; }
    var r = copyRoute(); r.stops.push({ iso3: iso, mode: 'visiting' });
    if (render(r)) say('Added ' + A.data[iso].name + ' as stop ' + r.stops.length + '.');
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('tr-home').addEventListener('change', function () {
    var home = this.value, p = C.presetById(presetId);
    if (p && !p.fixedHome) render(C.presetRoute(p.id, home, nb));
    else { var r = copyRoute(); r.home = home; render(r); }
  });
  $('tr-preset').addEventListener('change', function () {
    if (this.value === 'custom') return;
    if (render(C.presetRoute(this.value, $('tr-home').value, nb)) && !reduced) play(0);
  });
  $('tr-stops').addEventListener('change', function (e) {
    var t = e.target, i = +t.getAttribute('data-i'), k = t.getAttribute('data-k'), r = copyRoute();
    if (k === 'iso') r.stops[i].iso3 = t.value; else if (k === 'mode') r.stops[i].mode = t.value; else return;
    render(r); var el = $(t.id); if (el) el.focus();
  });
  $('tr-stops').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    var i = +t.getAttribute('data-i'), k = t.getAttribute('data-k'), r = copyRoute(), j = i;
    if (k === 'up' && i > 0) { j = i - 1; } else if (k === 'down' && i < r.stops.length - 1) { j = i + 1; }
    if (k === 'del') { r.stops.splice(i, 1); } else { var s = r.stops[i]; r.stops[i] = r.stops[j]; r.stops[j] = s; }
    if (!render(r)) return;
    var sel = k === 'del' ? '#tr-stops button[data-i="' + Math.max(0, Math.min(i, r.stops.length - 1)) + '"][data-k="del"]' : '#tr-stops button[data-i="' + j + '"][data-k="' + k + '"]';
    var f = document.querySelector(sel) || $('tr-add'); if (f.disabled) f = document.querySelector('#tr-stops select[data-i="' + j + '"]') || $('tr-add'); f.focus();
  });
  $('tr-add-btn').addEventListener('click', function () { addStop($('tr-add').value); });

  // Click a map (the stage picture, the globe, or Figure 1's locator): the nearest rated country becomes the next stop.
  function nearestTo(lng, lat) {
    var best = null, bd = Infinity;
    Object.keys(A.data).forEach(function (i) { var d = C.gcKm([lng, lat], A.data[i].pos); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function pickAt(lat, lng) { var b = nearestTo(lng, lat); if (b) { stop(false); addStop(b); } }
  function nearestProjected(svg, W, H, e) {
    var r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) * W / r.width, sy = (e.clientY - r.top) * H / r.height;
    var a = +svg.getAttribute('data-a'), b = +svg.getAttribute('data-b'), z = +svg.getAttribute('data-z'), wx = (sx - a) / z, wy = (sy - b) / z, best = null, bd = Infinity;
    Object.keys(A.data).forEach(function (i) { var p = C.eqEarth(A.data[i].pos[0], A.data[i].pos[1]), d = (p[0] - wx) * (p[0] - wx) + (p[1] - wy) * (p[1] - wy); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  $('st-pic').addEventListener('click', function (e) {
    var svg = e.target.closest('svg.routepic'); if (!svg) return;
    var vb = svg.viewBox.baseVal, b = nearestProjected(svg, vb.width, vb.height, e); if (b) { stop(false); addStop(b); }
  });
  function bindLocator() {
    var svg = document.querySelector('#fig1 .loc'); if (!svg) return;
    svg.classList.add('pick');
    svg.addEventListener('click', function (e) {
      var r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) * C.LOC.W / r.width, sy = (e.clientY - r.top) * C.LOC.H / r.height;
      var a = +svg.getAttribute('data-a'), b = +svg.getAttribute('data-b'), z = +svg.getAttribute('data-z');
      var wx = (sx - a) / z, wy = (sy - b) / z, best = null, bd = Infinity;
      Object.keys(A.data).forEach(function (i) { var p = C.eqEarth(A.data[i].pos[0], A.data[i].pos[1]), d = (p[0] - wx) * (p[0] - wx) + (p[1] - wy) * (p[1] - wy); if (d < bd) { bd = d; best = i; } });
      if (best) addStop(best);
    });
  }

  // ---- the journey stage (docs/TRAVELLER_JOURNEY_UX.md): settled stops, trail, scrubber, transport ----
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = function () { return window.matchMedia && matchMedia('(max-width: 700px)').matches; };
  function N() { return OUT.routes[0].derived.length; }
  function R() { return OUT.routes[0]; }
  // setStop: the settled state of one stop (or the end), everywhere at once. ms: camera time on the globe.
  function setStop(c, o) {
    o = o || {};
    if (c !== 'end') c = Math.max(0, Math.min(N(), c));
    cur = c;
    var st = C.renderStage(A, R(), c, { buttons: true });
    if (phone()) st.picture = C.routePicture(R(), A.data, { current: c, W: 390, H: 260, padL: 30, padR: 30, padY: 26 });
    $('st-pic').innerHTML = st.picture;
    if (!o.keepPanel) $('st-panel').innerHTML = st.panel;
    $('st-trail-list').innerHTML = st.trail;
    var rg = $('st-range'); rg.max = st.N; rg.value = st.idx; rg.setAttribute('aria-valuetext', st.valuetext);
    var h = '#' + C.encodeHash(route, c);
    if (location.hash !== h) history.replaceState(null, '', h);
    markColumn(st.idx);
    if (G && !o.noGlobe) scene(c, o.ms === undefined ? (reduced ? 0 : 600) : o.ms);
    if (!o.quiet) $('route-live').textContent = st.settle;
    if (wzView) showView(wzView, 0); // while the wizard previews, nothing else reaches the map
  }
  // The band never changes; the current column takes a 1.5 px ink rule laid over it, outside the SVG.
  function markColumn(idx) {
    var wrap = document.querySelector('#fig1 .bandwrap'); if (!wrap) return;
    var m = wrap.querySelector('.colmark'); if (!m) { m = document.createElement('div'); m.className = 'colmark'; m.setAttribute('aria-hidden', 'true'); wrap.appendChild(m); }
    m.style.left = (C.G.label + idx * C.G.col) + 'px'; m.style.width = C.G.col + 'px';
  }

  // ---- stage B: the globe (self-hosted globe.gl), loaded lazily; the static picture stays underneath as the fallback ----
  var FAIL = 'The map didn\'t load. Every stop is in the chart below.';
  var G = null, gLoading = null, curIso = null, tweens = [];
  // Below 700 px the globe never loads: the static 390 x 260 picture carries the journey throughout.
  function canGlobe() { return !phone(); }
  function loadGlobe(onPlay) {
    if (G) return Promise.resolve(G);
    if (gLoading) return gLoading;
    if (!canGlobe()) return Promise.resolve(null);
    var msg = function (t) { var m = $('gl-msg'); if (!t) { if (m) m.remove(); return; } if (!m) { m = document.createElement('p'); m.className = 'gl-msg'; m.id = 'gl-msg'; $('st-map').appendChild(m); } m.textContent = t; };
    msg('Loading the map\u2026');
    gLoading = new Promise(function (res) {
      var done = function () { res(typeof window.Globe === 'function'); };
      if (typeof window.Globe === 'function') return done();
      var sc = document.createElement('script'); sc.src = '../assets/globe.gl.min.js'; sc.onload = done; sc.onerror = function () { res(false); }; document.head.appendChild(sc);
    }).then(function (ok) { return ok ? fetch('globe.json').then(function (r) { return r.json(); }) : null; })
      .then(function (gj) { if (gj) initGlobe(C.decodeGlobe(gj)); msg(G ? '' : FAIL); return G; })
      .catch(function () { msg(FAIL); return null; });
    return gLoading;
  }
  // globe.gl centres the element on its coordinate, so the element is zero-size and an inner wrapper places the dot's centre at the origin.
  function label(d) {
    var el = document.createElement('div'), inn = document.createElement('div');
    el.className = 'gl-lab'; el.setAttribute('aria-hidden', 'true');
    inn.className = 'gl-in' + (d.home ? ' home' : '') + (d.dotless ? ' dotless' : '') + (d.solid ? ' solid' : '');
    inn.innerHTML = d.home ? '<span class="t">home</span><span class="d"></span>' : '<span class="d">' + d.i + '</span>' + (d.current ? '<span class="t">' + C.numH(d.text) + '</span>' : '');
    el.appendChild(inn);
    return el;
  }
  // Arcs are 1.5 px on screen: globe.gl's tube width is in degrees, so it is set from the camera altitude (fov 50, radius 100).
  function strokeDeg(alt) { var h = $('st-globe').getBoundingClientRect().height || 600, unitsPerPx = 2 * 100 * alt * Math.tan(25 * Math.PI / 180) / h; return C.GLOBE.arcPx * unitsPerPx * 180 / (Math.PI * 100); }
  // Scale at the surface under the camera: the camera stands altitude x radius above it (not radius x (1 + altitude) from the centre).
  function pxPerDeg(alt) { var h = $('st-globe').getBoundingClientRect().height || 600, unitsPerPx = 2 * 100 * alt * Math.tan(25 * Math.PI / 180) / h; return (Math.PI * 100 / 180) / unitsPerPx; }
  var offX = 0;
  // The current stop's words go right of its numeral unless they would cover another marker; then they go left.
  function flipLabels() {
    var cur = document.querySelector('#st-globe .gl-in .t:not(:empty)'); if (!cur) return;
    var box = cur.parentNode; box.classList.remove('left');
    var r = cur.getBoundingClientRect(), hit = Array.prototype.some.call(document.querySelectorAll('#st-globe .gl-in .d'), function (d) {
      if (box.contains(d)) return false; var q = d.getBoundingClientRect(); return q.width && q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom; });
    if (hit) box.classList.add('left');
  }
  function initGlobe(fc) {
    var host = $('st-map'), el = document.createElement('div');
    el.className = 'st-globe'; el.id = 'st-globe'; el.setAttribute('aria-hidden', 'true'); host.appendChild(el);
    try {
      G = window.Globe()(el).backgroundColor('#ffffff').showAtmosphere(false).showGraticules(false)
        .polygonsData(fc.features).polygonCapColor(function () { return '#F3F4F6'; }).polygonSideColor(function () { return 'rgba(0,0,0,0)'; })
        .polygonStrokeColor(function (f) { return f.properties.iso3 && f.properties.iso3 === curIso ? '#111827' : '#D1D5DB'; })
        .polygonAltitude(function (f) { return f.properties.iso3 && f.properties.iso3 === curIso ? C.GLOBE.curCapAlt : C.GLOBE.capAlt; }).polygonsTransitionDuration(0)
        .onGlobeClick(function (p) { pickAt(p.lat, p.lng); }).onPolygonClick(function (f, ev, p) { if (p) pickAt(p.lat, p.lng); })
        .pathsData([]).pathPoints('points').pathPointLat('lat').pathPointLng('lng').pathPointAlt(C.GLOBE.pathAlt)
        .pathColor(function () { return C.PATH_INK; }).pathStroke(null).pathTransitionDuration(0)
        .pathDashLength(1).pathDashGap(1).pathDashInitialGap(function (d) { return d.g; })
        .arcsData([]).arcStartLat('startLat').arcStartLng('startLng').arcEndLat('endLat').arcEndLng('endLng')
        .arcColor(function () { return '#0F766E'; }).arcStroke(0.15).arcAltitude('alt').arcsTransitionDuration(0)
        .arcDashLength(1).arcDashGap(1).arcDashInitialGap(function (d) { return d.g; })
        .htmlElementsData([]).htmlLat('lat').htmlLng('lng').htmlAltitude(0.012).htmlElement(label).htmlTransitionDuration(0)
        .htmlElementVisibilityModifier(function (el, vis) { el.style.opacity = vis ? 1 : 0; });
      G.globeMaterial().color.set('#ffffff');
      try { var L = G.lights(); L.forEach(function (l) { if (l.isDirectionalLight) l.intensity = 0; if (l.isAmbientLight) { l.color.set('#ffffff'); l.intensity = Math.PI; } }); G.lights(L); } catch (e) {}
      G.controls().autoRotate = false; G.controls().enableZoom = true;
      try { G.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); } catch (e) {}
      // The left of the canvas sits under the white wash and the panel: shift the globe's centre into the clear part.
      var size = function () {
        var r = el.getBoundingClientRect(); if (!r.width) return;
        G.width(r.width).height(r.height);
        var left = document.querySelector('.st-left'), cover = left ? Math.max(0, left.getBoundingClientRect().right - r.left) + 80 : 0; // the column over the map, plus the solid part of the wash
        offX = Math.round(Math.min(cover, r.width * 0.5) / 2); // the globe's centre sits mid-way across the clear part
      };
      if (window.ResizeObserver) new ResizeObserver(size).observe(el); size();
      host.classList.add('globe-on');
      if (wzView) paintGlobe(wzView, 0); else scene(cur, 0);
      if (window.IntersectionObserver) new IntersectionObserver(function (es) { if (!G) return; es[0].isIntersecting ? G.resumeAnimation() : G.pauseAnimation(); }).observe(host);
    } catch (err) {
      G = null; el.remove();
    }
  }
  // One-shot draw-on: a dash of length 1 with gap 1; the initial gap runs from -1 (nothing) to 0 (whole line), so it grows start to end.
  function tween(kind, items, ms) {
    items.forEach(function (d) { d.g = ms ? -1 : 0; });
    if (!ms) return;
    var t0 = performance.now(), my = {};
    tweens.push(my);
    (function f(now) {
      if (my.dead || !G) return;
      var k = Math.min(1, (now - t0) / ms);
      items.forEach(function (d) { d.g = k - 1; });
      kind === 'arc' ? G.arcDashInitialGap(G.arcDashInitialGap()) : G.pathDashInitialGap(G.pathDashInitialGap());
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  function killTweens() { tweens.forEach(function (t) { t.dead = true; }); tweens = []; }
  // scene: the globe at stop c. ms: camera time; o.drawLeg / o.drawArcs animate the newest leg and the arcs.
  function scene(c, ms, o) {
    if (!G) return null;
    o = o || {};
    var sc = C.globeScene(R(), A.data, c);
    curIso = sc.stopIso;
    var legs = sc.legs.map(function (l) { return { idx: l.idx, points: l.points, g: 0 }; });
    var arcs = o.noArcs ? [] : sc.arcs.map(function (a) { return Object.assign({ g: 0 }, a); });
    G.pathsData(legs).arcStroke(strokeDeg(sc.pov.altitude)).arcsData(arcs).htmlElementsData(sc.labels);
    [60, 400, 1200].forEach(function (d) { setTimeout(flipLabels, (reduced ? 0 : ms) + d); }); // after globe.gl has placed the labels
    // The south pan (only when the frame holds an arc) is countered by moving the globe down, so the route sits mid-frame.
    G.globeOffset([offX, Math.round(sc.pov.south * pxPerDeg(sc.pov.altitude))]);
    G.polygonStrokeColor(G.polygonStrokeColor()).polygonAltitude(G.polygonAltitude());
    if (o.drawLeg && legs.length && !reduced) tween('path', [legs[legs.length - 1]], o.drawLeg);
    if (o.drawArcs && !reduced) tween('arc', arcs, o.drawArcs);
    G.pointOfView(sc.pov, reduced ? 0 : ms);
    return sc;
  }

  // ---- the wizard's view (JAS, 2 Oct): the chosen home alone, then the chosen trip; never a route the reader did not pick ----
  var wzView = null;
  function paintGlobe(w, ms) {
    if (!G) return;
    var sc = w.scene; curIso = sc.stopIso; killTweens();
    G.pathsData(sc.legs.map(function (l) { return { idx: l.idx, points: l.points, g: 0 }; })).arcStroke(strokeDeg(sc.pov.altitude))
      .arcsData(sc.arcs.map(function (a) { return Object.assign({ g: 0 }, a); })).htmlElementsData(sc.labels);
    G.globeOffset([offX, Math.round(sc.pov.south * pxPerDeg(sc.pov.altitude))]);
    G.polygonStrokeColor(G.polygonStrokeColor()).polygonAltitude(G.polygonAltitude());
    G.pointOfView(sc.pov, ms);
    setTimeout(flipLabels, ms + 60);
  }
  function showView(w, ms) {
    wzView = w;
    $('st-pic').innerHTML = phone() ? C.routePicture(w.route, A.data, { current: w.cur, W: 390, H: 260, padL: 30, padR: 30, padY: 26 }) : C.routePicture(w.route, A.data, { current: w.cur });
    paintGlobe(w, ms === undefined ? w.ms : ms);
  }
  function wizView(trip) { showView(C.wizardScene(A, nb, wz.home, trip, reduced)); }

  // ---- stage C: the beats (doc 1.3), with a cancel token; reduced motion turns Play into Next ----
  var token = 0;
  function wait(ms, t) { return new Promise(function (res, rej) { timer = setTimeout(function () { t === token ? res() : rej('cancelled'); }, ms); }); }
  function setPlaying(on) { playing = on; $('st-play').textContent = on ? 'Pause' : 'Play'; $('st-play').setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function stop(settle) {
    token++; if (timer) { clearTimeout(timer); timer = null; } killTweens();
    var was = playing; setPlaying(false);
    if (was && settle !== false && OUT) setStop(cur, { quiet: true }); // no half-collapsed state stays on screen
  }
  function surface(i) { $('st-panel').innerHTML = C.stopPanelSurface(A.xb, A.data, R(), i); }
  // The collapse: in the same rows, each held bar fades to its real mark (bars only); the words and the count swap once, at the midpoint.
  function collapse(i, t) {
    var real = C.stopPanel(A.xb, A.data, R(), i, 0), host = $('st-panel');
    if (reduced) { host.innerHTML = real; return; }
    var sur = host.querySelector('.panel'), tmp = document.createElement('div'); tmp.innerHTML = real;
    var rp = tmp.firstElementChild, sRows = sur.querySelectorAll('.pl-rows tr'), rRows = rp.querySelectorAll('.pl-rows tr');
    Array.prototype.forEach.call(sRows, function (tr, k) {
      var cell = tr.children[1], oldBar = cell.firstElementChild, newBar = rRows[k].children[1].firstElementChild.cloneNode(true);
      var box = document.createElement('div'); box.style.cssText = 'position:relative;width:' + oldBar.getAttribute('width') + 'px;height:' + oldBar.getAttribute('height') + 'px';
      cell.insertBefore(box, oldBar); box.appendChild(oldBar); box.appendChild(newBar); // one origin for both bars
      newBar.style.cssText = 'position:absolute;left:0;top:0;opacity:0;transition:opacity .9s';
      oldBar.style.cssText = 'position:absolute;left:0;top:0;transition:opacity .9s';
      requestAnimationFrame(function () { requestAnimationFrame(function () { newBar.style.opacity = 1; oldBar.style.opacity = 0; }); });
    });
    setTimeout(function () {
      if (t !== token) return;
      Array.prototype.forEach.call(sRows, function (tr, k) { tr.children[2].innerHTML = rRows[k].children[2].innerHTML; });
      sur.querySelector('.pl-cnt').innerHTML = rp.querySelector('.pl-cnt').innerHTML;
    }, C.BEATS.collapse / 2);
  }
  function play(from) {
    if (playing) { stop(); return; }
    if (reduced) { setStop(cur === 'end' || cur >= N() ? 0 : idxNow() + 1); return; } // Play becomes Next; nothing on a timer
    var t = ++token, P = C.beatPlan(R(), A.data), start = from === undefined ? (cur === 'end' || cur >= N() ? 0 : cur) : from;
    setPlaying(true);
    loadGlobe(true).then(function () {
      if (t !== token) return;
      var go = Promise.resolve();
      if (start === 0) go = go.then(function () { setStop(0, { quiet: true, ms: P.rewind }); if (G) scene(0, P.rewind, { noArcs: true }); return wait(P.rewind, t); })
        .then(function () { $('route-live').textContent = C.renderStage(A, R(), 0).settle; return wait(P.home, t); });
      P.stops.slice(Math.max(0, start === 0 ? 0 : start - 1)).forEach(function (b) {
        go = go.then(function () { // fly: the person's path draws to this stop; the last stop's arcs retract (cleared)
          setStop(b.idx, { quiet: true, keepPanel: true, noGlobe: true });
          if (G) scene(b.idx, b.fly, { noArcs: true, drawLeg: b.fly });
          return wait(b.fly, t);
        }).then(function () { // surface: the lanes held at the holder; record arcs draw on, holder to stop
          surface(b.idx);
          if (G) scene(b.idx, 0, { drawArcs: C.BEATS.arcDraw });
          return wait(b.surface, t);
        }).then(function () { collapse(b.idx, t); return wait(b.collapse, t); }) // crossfade to the real marks; the count changes once
          .then(function () { $('st-panel').innerHTML = C.stopPanel(A.xb, A.data, R(), b.idx, 0); $('route-live').textContent = C.renderStage(A, R(), b.idx).settle; return wait(b.settle, t); });
      });
      go.then(function () { setStop('end', { quiet: true, ms: P.end }); return wait(P.end, t); })
        .then(function () { setPlaying(false); $('st-play-main').textContent = 'Play the trip again'; window.whrTrack && whrTrack('journey_end', {}); })
        .catch(function () { /* cancelled */ });
    });
    window.whrTrack && whrTrack('journey_play', {});
  }
  function idxNow() { return cur === 'end' ? N() : cur; }
  $('st-back').addEventListener('click', function () { stop(false); setStop(idxNow() - 1); });
  $('st-next').addEventListener('click', function () { stop(false); setStop(idxNow() + 1); });
  $('st-end').addEventListener('click', function () { stop(false); setStop('end'); });
  $('st-play').addEventListener('click', function () { play(); });
  $('st-play-main').addEventListener('click', function () { stop(false); setStop(0, { quiet: true }); play(0); });
  $('st-range').addEventListener('input', function () { stop(false); setStop(+this.value); });
  $('st-trail-list').addEventListener('click', function (e) { var t = e.target.closest('.tick'); if (t) { stop(false); setStop(+t.getAttribute('data-s')); } });
  stage.addEventListener('keydown', function (e) {
    if (/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.id !== 'st-range') return;
    var k = e.key;
    if (k === 'ArrowLeft') { stop(false); setStop(idxNow() - 1); } else if (k === 'ArrowRight') { stop(false); setStop(idxNow() + 1); }
    else if (k === ' ' && e.target.tagName !== 'BUTTON') { play(); } else if (k === 'Home') { stop(false); setStop(0); } else if (k === 'End' || k === 'Escape') { stop(false); setStop('end'); } else return;
    e.preventDefault();
  });
  // Desktop: the globe loads when the stage is on screen (never on a phone until Play; never with Save-Data).
  if (window.IntersectionObserver) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting && A) { loadGlobe(false); io.disconnect(); } }); io.observe(stage); }

  // ---- the wizard (three steps in the stage's left column; script only; sessionStorage remembers it for this tab) ----
  var WZ_H2 = 'Does your health record follow you to another country?';
  var wz = { step: 1, home: 'PRT', trip: 'trip', route: null, picked: false };
  function track(ev, p) { if (window.whrTrack) whrTrack(ev, p || {}); }
  function storeDone() { try { sessionStorage.setItem(C.WIZ_KEY, 'done'); } catch (e) {} }
  function storedDone() { try { return sessionStorage.getItem(C.WIZ_KEY); } catch (e) { return null; } }
  function wizShow(step, initial) {
    wz.step = step;
    var box = $('st-wizard');
    if (step === 3) { var r = C.tripRoute(wz.trip, wz.home, nb); wz.route = r ? C.renderDynamic(A, r, nb).routes[0] : null; }
    box.innerHTML = C.wizardHtml(step, { home: wz.home, trip: wz.trip, route: wz.route, why: step === 3 ? C.wizWhy(wz.trip, wz.home, nb, nbl, A.data) : '', options: $('tr-country-options').innerHTML }, A.data) + '<p class="vh" aria-live="polite" id="wz-live"></p>';
    box.hidden = false; stage.classList.add('wz-open'); $('st-change').hidden = true; $('route-h2').textContent = WZ_H2;
    if (step === 1 || (step === 2 && !wz.picked)) wizView(null); // the home alone
    else if (step === 2) wizView(wz.trip === 'own' ? null : wz.trip);
    var h = $('wz-h'); if (h && !initial) h.focus(); // on page load the step is announced, not focused, so the page is never hijacked
    $('wz-live').textContent = h ? h.textContent : '';
    track('wizard_step', { step: step });
  }
  function wizClose() {
    $('st-wizard').hidden = true; $('st-wizard').innerHTML = ''; stage.classList.remove('wz-open'); $('st-change').hidden = false; storeDone();
    wzView = null;
    if (OUT) { $('route-h2').innerHTML = OUT.h2html; setStop(cur, { quiet: true }); } // back to the trip on record, framed
  }
  $('st-wizard').addEventListener('change', function (e) {
    if (e.target.id === 'wz-home') { wz.home = e.target.value; wz.picked = false; wizView(null); } // the old route goes; the globe turns to the new home
    if (e.target.name === 'wz-trip') pickTrip(e.target.value);
  });
  function pickTrip(v) { wz.trip = v; wz.picked = true; wizView(v === 'own' ? null : v); }
  $('st-wizard').addEventListener('focusin', function (e) { if (e.target.name === 'wz-trip' && e.target.checked && !wz.picked) pickTrip(e.target.value); });
  $('st-wizard').addEventListener('click', function (e) {
    var b = e.target.closest('[data-wz]'); if (!b) return;
    var act = b.getAttribute('data-wz');
    if (act === 'skip') { track('wizard_skip', { step: wz.step }); if (wz.home !== route.home) { var p0 = C.presetById(presetId), sr = p0 && !p0.fixedHome ? C.presetRoute(p0.id, wz.home, nb) : C.tripRoute('trip', wz.home, nb); if (sr) render(sr, { quiet: true }); } wizClose(); $('route-h2').focus && stage.focus(); return; }
    if (act === 'back') { wizShow(Math.max(1, wz.step - 1)); return; }
    if (act === 'next') {
      if (wz.step === 2 && wz.trip === 'own') { // build my own route: the stop editor, from this home
        track('wizard_complete', {}); wizClose();
        var r = copyRoute(); r.home = wz.home; if (r.stops.length && r.stops[0].iso3 === wz.home) r.stops.shift(); if (!r.stops.length) r.stops = C.tripRoute('trip', wz.home, nb).stops; render(r);
        var ed = $('traveller-app'); ed.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); var f = ed.querySelector('select, button'); if (f) f.focus();
        return;
      }
      if (wz.step === 2) { var tr = C.tripRoute(wz.trip, wz.home, nb); if (tr) { wz.picked = true; wzView = null; render(tr, { quiet: true }); } } // Next on a trip is a pick
      wizShow(wz.step + 1); return;
    }
    if (act === 'play') { track('wizard_complete', {}); wizClose(); stop(false); setStop(0, { quiet: true }); play(0); }
  });
  $('st-change').addEventListener('click', function () { stop(false); wz.home = route.home; wz.picked = false; wizShow(2); });

  fetch('data.json').then(function (r) { return r.json(); }).then(function (j) {
    A = { xb: j.xb, data: j.data }; A.base = C.baseRate(A.xb); nb = j.nb; nbl = j.nbl;
    form.hidden = false; $('st-transport').hidden = false; $('st-play-main').hidden = false;
    var hash0 = location.hash, rh = C.readRouteHash(hash0, valid), fromHash = rh.route;
    route = fromHash || C.presetRoute('visitor', 'PRT', nb);
    var sh = fromHash ? C.readStopHash(hash0, route.stops.length) : { cur: 'end', problem: null };
    render(route, { quiet: true, cur: sh.cur });
    // A shared link that does not read in full is never silently replaced: the panel says what happened.
    var plain = function (p) { return p.charAt(0).toUpperCase() + p.slice(1).replace(/\. .*$/, '').replace(/\.$/, ''); }; // codes keep their case
    if (rh.problem) note(plain(rh.problem) + '. Showing a sample trip instead.');
    else if (sh.problem) note(sh.problem);
    if (window.IntersectionObserver) { var r0 = stage.getBoundingClientRect(); if (r0.top < innerHeight && r0.bottom > 0) loadGlobe(false); }
    if (C.wizardShouldShow(hash0, storedDone())) { wz.home = C.homeFromLocales(navigator.languages || [navigator.language], A.data); wizShow(1, true); }
    else $('st-change').hidden = false;
    window.addEventListener('hashchange', function () {
      note(''); // a stale note never outlives the link it was about
      var rr = C.readRouteHash(location.hash, valid);
      if (!rr.route) { if (rr.problem) note(plain(rr.problem) + '. The trip on screen is unchanged.'); return; }
      var ss = C.readStopHash(location.hash, rr.route.stops.length);
      if (!C.sameRoute(rr.route, route)) render(rr.route, { cur: ss.cur }); else if (ss.cur !== cur) { stop(false); setStop(ss.cur); }
      if (ss.problem) note(ss.problem);
    });
  }).catch(function () { /* the server-rendered still stays; controls stay hidden */ });
})();
