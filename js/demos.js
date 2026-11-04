/* Interactive routing demos used inside the articles.
   Classic script, no dependencies. The algorithm is a pure function so it can be tested without a browser. */
(function () {
  'use strict';

  /* ---------- Dijkstra on the lecture network (A to E) ---------- */
  var GRAPH = { A: { B: 5, C: 2, D: 3 }, B: { A: 5, C: 4, E: 3 }, C: { A: 2, B: 4, E: 4 }, D: { A: 3 }, E: { B: 3, C: 4 } };
  var POS = { A: [50, 60], B: [310, 60], C: [180, 165], D: [50, 270], E: [310, 270] };
  var EDGES = [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'E'], ['C', 'E']];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function dijkstraSteps(g, src) {
    var perm = {}, tent = {}, steps = [];
    tent[src] = { c: 0, p: null };
    steps.push({ perm: {}, tent: clone(tent), notes: ['Set the root to ' + src + ' and place it on the tentative list with cost 0.'] });
    while (Object.keys(tent).length) {
      var best = null;
      Object.keys(tent).sort().forEach(function (n) { if (best === null || tent[n].c < tent[best].c) best = n; });
      var cur = tent[best]; delete tent[best]; perm[best] = cur;
      var notes = ['Move ' + best + ' (cost ' + cur.c + ') from the tentative list to the permanent list.'];
      Object.keys(g[best]).sort().forEach(function (v) {
        if (perm[v]) return;
        var nc = cur.c + g[best][v];
        if (!tent[v]) {
          tent[v] = { c: nc, p: best };
          notes.push('Add ' + v + ' to the tentative list with cost ' + nc + ' (' + cur.c + ' + ' + g[best][v] + ').');
        } else if (nc < tent[v].c) {
          notes.push('The route to ' + v + ' through ' + best + ' costs ' + nc + ', better than ' + tent[v].c + ', so it replaces the old one.');
          tent[v] = { c: nc, p: best };
        } else {
          notes.push('The route to ' + v + ' through ' + best + ' would cost ' + nc + ', not better than ' + tent[v].c + ', so it is ignored.');
        }
      });
      steps.push({ perm: clone(perm), tent: clone(tent), notes: notes });
    }
    return steps;
  }

  function nextRouter(perm, n, src) {
    var p = perm[n].p, cur = n;
    if (p === null) return '\u2014';
    while (perm[cur].p !== src) cur = perm[cur].p;
    return cur === n ? '\u2014' : cur;
  }

  if (typeof window !== 'undefined') window.NLDemos = { dijkstraSteps: dijkstraSteps, GRAPH: GRAPH };
  if (typeof document === 'undefined') return;

  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, cls) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (cls) n.setAttribute('class', cls);
    return n;
  }
  function button(label, ghost) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (ghost ? ' btn-ghost' : ''); b.textContent = label; return b;
  }

  var host = document.getElementById('dijkstra-demo');
  if (host) {
    var steps = dijkstraSteps(GRAPH, 'A'), i = 0;
    var svg = svgEl('svg', { viewBox: '0 0 360 320', role: 'img', 'aria-label': 'Network of five routers A to E used in the Dijkstra demonstration' });
    host.appendChild(svg);
    var ctl = document.createElement('div'); ctl.className = 'ctl';
    var back = button('Back', true), next = button('Next step'), reset = button('Reset', true);
    var no = document.createElement('span'); no.className = 'stepno';
    ctl.appendChild(back); ctl.appendChild(next); ctl.appendChild(reset); ctl.appendChild(no);
    host.appendChild(ctl);
    var note = document.createElement('p'); note.className = 'note'; note.setAttribute('aria-live', 'polite'); host.appendChild(note);
    var tl = document.createElement('p'); tl.className = 'note'; tl.style.minHeight = '0'; host.appendChild(tl);
    var wrap = document.createElement('div'); wrap.className = 'table-wrap'; host.appendChild(wrap);

    var drawDijkstra = function () {
      var s = steps[i];
      svg.innerHTML = '';
      EDGES.forEach(function (e) {
        var a = POS[e[0]], b = POS[e[1]];
        var onTree = (s.perm[e[1]] && s.perm[e[1]].p === e[0]) || (s.perm[e[0]] && s.perm[e[0]].p === e[1]);
        svg.appendChild(svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, 'g-edge' + (onTree ? ' on' : '')));
      });
      EDGES.forEach(function (e) {
        var a = POS[e[0]], b = POS[e[1]];
        var t = svgEl('text', { x: (a[0] + b[0]) / 2 + (e[0] === 'B' && e[1] === 'C' ? 14 : 0), y: (a[1] + b[1]) / 2 - 6 }, 'g-w');
        t.textContent = GRAPH[e[0]][e[1]]; svg.appendChild(t);
      });
      Object.keys(POS).forEach(function (n) {
        var p = POS[n], isPerm = !!s.perm[n], isTent = !!s.tent[n];
        svg.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: 20 }, 'g-node' + (isPerm ? ' perm' : isTent ? ' tent' : '')));
        var t = svgEl('text', { x: p[0], y: p[1] + 5 }, 'g-lab' + (isPerm ? ' perm' : '')); t.textContent = n; svg.appendChild(t);
        var lab = isPerm ? s.perm[n].c : isTent ? s.tent[n].c + '?' : '';
        if (lab !== '') {
          var c = svgEl('text', { x: p[0], y: p[1] + (p[1] > 200 ? 40 : -28) }, 'g-cost'); c.textContent = lab; svg.appendChild(c);
        }
      });
      note.textContent = s.notes.join(' ');
      var tentList = Object.keys(s.tent).sort().map(function (n) { return n + ' (' + s.tent[n].c + ')'; });
      tl.textContent = 'Tentative list: ' + (tentList.length ? tentList.join(', ') : 'empty') + '. A cost followed by ? is still tentative.';
      var rows = Object.keys(s.perm).sort().map(function (n) {
        return '<tr><td>' + n + '</td><td>' + s.perm[n].c + '</td><td>' + nextRouter(s.perm, n, 'A') + '</td></tr>';
      }).join('');
      wrap.innerHTML = '<table><caption class="sr-only">Routing table for A so far</caption><thead><tr><th>Node</th><th>Cost</th><th>Next router</th></tr></thead><tbody>' + rows + '</tbody></table>';
      no.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      back.disabled = i === 0; next.disabled = i === steps.length - 1;
    };
    back.addEventListener('click', function () { if (i > 0) { i--; drawDijkstra(); } });
    next.addEventListener('click', function () { if (i < steps.length - 1) { i++; drawDijkstra(); } });
    reset.addEventListener('click', function () { i = 0; drawDijkstra(); });
    drawDijkstra();
  }

  /* ---------- Two-node instability, with and without split horizon ---------- */
  var cti = document.getElementById('cti-demo');
  if (cti) {
    var PLAIN = [
      ['Before the failure', 'X: 2 (direct)', 'X: 6 via A', 'A reaches X directly at cost 2. B reaches X through A: the link cost 4 plus A\u2019s cost 2 gives 6.'],
      ['The link between X and A fails', 'X: \u221E', 'X: 6 via A', 'A sees that X is unreachable. B has not heard yet and still holds its old route.'],
      ['B sends its table to A', 'X: 10 via B', 'X: 6 via A', 'A hears that B can reach X at cost 6. A trusts it and records 4 + 6 = 10. But B\u2019s route actually goes through A.'],
      ['A sends its table to B', 'X: 10 via B', 'X: 14 via A', 'B hears that A can reach X at cost 10, so B records 4 + 10 = 14.'],
      ['B sends its table to A', 'X: 18 via B', 'X: 14 via A', 'A records 4 + 14 = 18. Each exchange adds 4 to both costs.'],
      ['A sends its table to B', 'X: 18 via B', 'X: 22 via A', 'The two routers keep raising the cost. They stop only when the cost reaches the protocol\u2019s value for infinity (16 in RIP, where every link counts as 1).']
    ];
    var SPLIT = [
      PLAIN[0], PLAIN[1],
      ['B would send its table to A', 'X: \u221E', 'X: 6 via A', 'With split horizon, B leaves X out of what it sends to A, because B learned X from A. A keeps X as unreachable.'],
      ['A sends its table to B', 'X: \u221E', 'X: \u221E', 'A tells B that X is unreachable, so B drops its route. Both routers now agree and there is no loop.']
    ];
    var mode = PLAIN, k = 0;
    var cbWrap = document.createElement('p'), cb = document.createElement('input'), cl = document.createElement('label');
    cb.type = 'checkbox'; cb.id = 'sh'; cl.htmlFor = 'sh'; cl.textContent = ' Turn on split horizon';
    cbWrap.appendChild(cb); cbWrap.appendChild(cl); cti.appendChild(cbWrap);
    var cwrap = document.createElement('div'); cwrap.className = 'table-wrap'; cti.appendChild(cwrap);
    var cc = document.createElement('div'); cc.className = 'ctl';
    var cn = button('Next step'), cr = button('Reset', true), cs = document.createElement('span'); cs.className = 'stepno';
    cc.appendChild(cn); cc.appendChild(cr); cc.appendChild(cs); cti.appendChild(cc);
    var cnote = document.createElement('p'); cnote.className = 'note'; cnote.setAttribute('aria-live', 'polite'); cti.appendChild(cnote);
    var drawCti = function () {
      var rows = '';
      for (var r = 0; r <= k; r++) rows += '<tr><td>' + mode[r][0] + '</td><td>' + mode[r][1] + '</td><td>' + mode[r][2] + '</td></tr>';
      cwrap.innerHTML = '<table><thead><tr><th>Event</th><th>A\u2019s route to X</th><th>B\u2019s route to X</th></tr></thead><tbody>' + rows + '</tbody></table>';
      cnote.textContent = mode[k][3];
      cs.textContent = 'Step ' + (k + 1) + ' of ' + mode.length;
      cn.disabled = k === mode.length - 1;
    };
    cn.addEventListener('click', function () { if (k < mode.length - 1) { k++; drawCti(); } });
    cr.addEventListener('click', function () { k = 0; drawCti(); });
    cb.addEventListener('change', function () { mode = cb.checked ? SPLIT : PLAIN; k = 0; drawCti(); });
    drawCti();
  }
})()/* Interactive routing demos used inside the articles.
   Classic script, no dependencies. The algorithm is a pure function so it can be tested without a browser. */
(function () {
  'use strict';

  /* ---------- Dijkstra on the lecture network (A to E) ---------- */
  var GRAPH = { A: { B: 5, C: 2, D: 3 }, B: { A: 5, C: 4, E: 3 }, C: { A: 2, B: 4, E: 4 }, D: { A: 3 }, E: { B: 3, C: 4 } };
  var POS = { A: [50, 60], B: [310, 60], C: [180, 165], D: [50, 270], E: [310, 270] };
  var EDGES = [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'E'], ['C', 'E']];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function dijkstraSteps(g, src) {
    var perm = {}, tent = {}, steps = [];
    tent[src] = { c: 0, p: null };
    steps.push({ perm: {}, tent: clone(tent), notes: ['Set the root to ' + src + ' and place it on the tentative list with cost 0.'] });
    while (Object.keys(tent).length) {
      var best = null;
      Object.keys(tent).sort().forEach(function (n) { if (best === null || tent[n].c < tent[best].c) best = n; });
      var cur = tent[best]; delete tent[best]; perm[best] = cur;
      var notes = ['Move ' + best + ' (cost ' + cur.c + ') from the tentative list to the permanent list.'];
      Object.keys(g[best]).sort().forEach(function (v) {
        if (perm[v]) return;
        var nc = cur.c + g[best][v];
        if (!tent[v]) {
          tent[v] = { c: nc, p: best };
          notes.push('Add ' + v + ' to the tentative list with cost ' + nc + ' (' + cur.c + ' + ' + g[best][v] + ').');
        } else if (nc < tent[v].c) {
          notes.push('The route to ' + v + ' through ' + best + ' costs ' + nc + ', better than ' + tent[v].c + ', so it replaces the old one.');
          tent[v] = { c: nc, p: best };
        } else {
          notes.push('The route to ' + v + ' through ' + best + ' would cost ' + nc + ', not better than ' + tent[v].c + ', so it is ignored.');
        }
      });
      steps.push({ perm: clone(perm), tent: clone(tent), notes: notes });
    }
    return steps;
  }

  function nextRouter(perm, n, src) {
    var p = perm[n].p, cur = n;
    if (p === null) return '\u2014';
    while (perm[cur].p !== src) cur = perm[cur].p;
    return cur === n ? '\u2014' : cur;
  }

  if (typeof window !== 'undefined') window.NLDemos = { dijkstraSteps: dijkstraSteps, GRAPH: GRAPH };
  if (typeof document === 'undefined') return;

  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, cls) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (cls) n.setAttribute('class', cls);
    return n;
  }
  function button(label, ghost) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (ghost ? ' btn-ghost' : ''); b.textContent = label; return b;
  }

  var host = document.getElementById('dijkstra-demo');
  if (host) {
    var steps = dijkstraSteps(GRAPH, 'A'), i = 0;
    var svg = svgEl('svg', { viewBox: '0 0 360 320', role: 'img', 'aria-label': 'Network of five routers A to E used in the Dijkstra demonstration' });
    host.appendChild(svg);
    var ctl = document.createElement('div'); ctl.className = 'ctl';
    var back = button('Back', true), next = button('Next step'), reset = button('Reset', true);
    var no = document.createElement('span'); no.className = 'stepno';
    ctl.appendChild(back); ctl.appendChild(next); ctl.appendChild(reset); ctl.appendChild(no);
    host.appendChild(ctl);
    var note = document.createElement('p'); note.className = 'note'; note.setAttribute('aria-live', 'polite'); host.appendChild(note);
    var tl = document.createElement('p'); tl.className = 'note'; tl.style.minHeight = '0'; host.appendChild(tl);
    var wrap = document.createElement('div'); wrap.className = 'table-wrap'; host.appendChild(wrap);

    var drawDijkstra = function () {
      var s = steps[i];
      svg.innerHTML = '';
      EDGES.forEach(function (e) {
        var a = POS[e[0]], b = POS[e[1]];
        var onTree = (s.perm[e[1]] && s.perm[e[1]].p === e[0]) || (s.perm[e[0]] && s.perm[e[0]].p === e[1]);
        svg.appendChild(svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, 'g-edge' + (onTree ? ' on' : '')));
      });
      EDGES.forEach(function (e) {
        var a = POS[e[0]], b = POS[e[1]];
        var t = svgEl('text', { x: (a[0] + b[0]) / 2 + (e[0] === 'B' && e[1] === 'C' ? 14 : 0), y: (a[1] + b[1]) / 2 - 6 }, 'g-w');
        t.textContent = GRAPH[e[0]][e[1]]; svg.appendChild(t);
      });
      Object.keys(POS).forEach(function (n) {
        var p = POS[n], isPerm = !!s.perm[n], isTent = !!s.tent[n];
        svg.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: 20 }, 'g-node' + (isPerm ? ' perm' : isTent ? ' tent' : '')));
        var t = svgEl('text', { x: p[0], y: p[1] + 5 }, 'g-lab' + (isPerm ? ' perm' : '')); t.textContent = n; svg.appendChild(t);
        var lab = isPerm ? s.perm[n].c : isTent ? s.tent[n].c + '?' : '';
        if (lab !== '') {
          var c = svgEl('text', { x: p[0], y: p[1] + (p[1] > 200 ? 40 : -28) }, 'g-cost'); c.textContent = lab; svg.appendChild(c);
        }
      });
      note.textContent = s.notes.join(' ');
      var tentList = Object.keys(s.tent).sort().map(function (n) { return n + ' (' + s.tent[n].c + ')'; });
      tl.textContent = 'Tentative list: ' + (tentList.length ? tentList.join(', ') : 'empty') + '. A cost followed by ? is still tentative.';
      var rows = Object.keys(s.perm).sort().map(function (n) {
        return '<tr><td>' + n + '</td><td>' + s.perm[n].c + '</td><td>' + nextRouter(s.perm, n, 'A') + '</td></tr>';
      }).join('');
      wrap.innerHTML = '<table><caption class="sr-only">Routing table for A so far</caption><thead><tr><th>Node</th><th>Cost</th><th>Next router</th></tr></thead><tbody>' + rows + '</tbody></table>';
      no.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      back.disabled = i === 0; next.disabled = i === steps.length - 1;
    };
    back.addEventListener('click', function () { if (i > 0) { i--; drawDijkstra(); } });
    next.addEventListener('click', function () { if (i < steps.length - 1) { i++; drawDijkstra(); } });
    reset.addEventListener('click', function () { i = 0; drawDijkstra(); });
    drawDijkstra();
  }

  /* ---------- Two-node instability, with and without split horizon ---------- */
  var cti = document.getElementById('cti-demo');
  if (cti) {
    var PLAIN = [
      ['Before the failure', 'X: 2 (direct)', 'X: 6 via A', 'A reaches X directly at cost 2. B reaches X through A: the link cost 4 plus A\u2019s cost 2 gives 6.'],
      ['The link between X and A fails', 'X: \u221E', 'X: 6 via A', 'A sees that X is unreachable. B has not heard yet and still holds its old route.'],
      ['B sends its table to A', 'X: 10 via B', 'X: 6 via A', 'A hears that B can reach X at cost 6. A trusts it and records 4 + 6 = 10. But B\u2019s route actually goes through A.'],
      ['A sends its table to B', 'X: 10 via B', 'X: 14 via A', 'B hears that A can reach X at cost 10, so B records 4 + 10 = 14.'],
      ['B sends its table to A', 'X: 18 via B', 'X: 14 via A', 'A records 4 + 14 = 18. Each exchange adds 4 to both costs.'],
      ['A sends its table to B', 'X: 18 via B', 'X: 22 via A', 'The two routers keep raising the cost. They stop only when the cost reaches the protocol\u2019s value for infinity (16 in RIP, where every link counts as 1).']
    ];
    var SPLIT = [
      PLAIN[0], PLAIN[1],
      ['B would send its table to A', 'X: \u221E', 'X: 6 via A', 'With split horizon, B leaves X out of what it sends to A, because B learned X from A. A keeps X as unreachable.'],
      ['A sends its table to B', 'X: \u221E', 'X: \u221E', 'A tells B that X is unreachable, so B drops its route. Both routers now agree and there is no loop.']
    ];
    var mode = PLAIN, k = 0;
    var cbWrap = document.createElement('p'), cb = document.createElement('input'), cl = document.createElement('label');
    cb.type = 'checkbox'; cb.id = 'sh'; cl.htmlFor = 'sh'; cl.textContent = ' Turn on split horizon';
    cbWrap.appendChild(cb); cbWrap.appendChild(cl); cti.appendChild(cbWrap);
    var cwrap = document.createElement('div'); cwrap.className = 'table-wrap'; cti.appendChild(cwrap);
    var cc = document.createElement('div'); cc.className = 'ctl';
    var cn = button('Next step'), cr = button('Reset', true), cs = document.createElement('span'); cs.className = 'stepno';
    cc.appendChild(cn); cc.appendChild(cr); cc.appendChild(cs); cti.appendChild(cc);
    var cnote = document.createElement('p'); cnote.className = 'note'; cnote.setAttribute('aria-live', 'polite'); cti.appendChild(cnote);
    var drawCti = function () {
      var rows = '';
      for (var r = 0; r <= k; r++) rows += '<tr><td>' + mode[r][0] + '</td><td>' + mode[r][1] + '</td><td>' + mode[r][2] + '</td></tr>';
      cwrap.innerHTML = '<table><thead><tr><th>Event</th><th>A\u2019s route to X</th><th>B\u2019s route to X</th></tr></thead><tbody>' + rows + '</tbody></table>';
      cnote.textContent = mode[k][3];
      cs.textContent = 'Step ' + (k + 1) + ' of ' + mode.length;
      cn.disabled = k === mode.length - 1;
    };
    cn.addEventListener('click', function () { if (k < mode.length - 1) { k++; drawCti(); } });
    cr.addEventListener('click', function () { k = 0; drawCti(); });
    cb.addEventListener('change', function () { mode = cb.checked ? SPLIT : PLAIN; k = 0; drawCti(); });
    drawCti();
  }
})();