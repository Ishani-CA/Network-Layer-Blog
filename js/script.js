/* Network Layer Explained: shared behaviour (Phases 1 and 2).
   Classic script (no ES modules) so the site also works when opened from the filesystem. */
(function () {
  'use strict';
  var root = document.body.getAttribute('data-root') || '.';

  /* ---------- Content data (also feeds search) ---------- */
  var ARTICLES = [
    { id: 'architecture', cat: 'Foundations', min: 12,
      title: 'Architecture, functions and internetworking',
      sum: 'What the network layer is for, the services it offers the layers around it, and how unlike networks are joined into one internet.',
      topics: ['Design issues', 'Functions and services', 'Connectionless and connection-oriented service', 'Datagram networks', 'Internetworking', 'Direct and indirect delivery', 'Tunneling'] },
    { id: 'routing', cat: 'Routing', min: 18,
      title: 'Routing algorithms and techniques',
      sum: 'How routers decide where packets go: shortest paths, flooding, distance vector, link state and the protocols built on them.',
      topics: ['Optimality principle', 'Dijkstra shortest path', 'Flooding', 'Distance vector routing', 'Link state routing', 'Path vector routing', 'Static and dynamic routing', 'RIP', 'OSPF', 'BGP', 'Count-to-infinity problem'] },
    { id: 'forwarding', cat: 'Delivery', min: 15,
      title: 'Packet delivery, forwarding and helper protocols',
      sum: 'How a router forwards one packet using its table, and how ARP, ICMP and IGMP support delivery.',
      topics: ['Packet delivery', 'Forwarding', 'Routing tables', 'Next-hop forwarding', 'Default route', 'ARP and RARP', 'ICMP', 'Ping and traceroute', 'IGMP', 'Unicast, broadcast and multicast'] },
    { id: 'ip-addressing', cat: 'Addressing', min: 22,
      title: 'IP addressing and Internet Protocols',
      sum: 'IPv4 and IPv6 addresses, subnetting, CIDR, NAT, datagram formats, fragmentation and the move to IPv6.',
      topics: ['IPv4 addressing', 'Classful and classless addressing', 'Subnetting', 'Supernetting', 'CIDR', 'Public and private addresses', 'NAT', 'IPv4 datagram format', 'Fragmentation', 'Header checksum', 'IPv6', 'IPv4 to IPv6 transition'] },
    { id: 'congestion', cat: 'Traffic', min: 18,
      title: 'Congestion control and quality of service',
      sum: 'Why networks jam, how to prevent and relieve it, and how to give important traffic a better deal.',
      topics: ['Congestion', 'Open-loop and closed-loop control', 'Traffic-aware routing', 'Admission control', 'Traffic throttling', 'Load shedding', 'Leaky bucket', 'Token bucket', 'Quality of service', 'Jitter', 'Scheduling', 'Resource reservation'] }
  ];
  function url(a) { return root + '/articles/' + a.id + '.html'; }

  /* ---------- Shared components ---------- */
  var mark = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="6" cy="16" r="3.2" fill="var(--accent)"/><circle cx="16" cy="7" r="3.2" fill="var(--accent2)"/><circle cx="26" cy="16" r="3.2" fill="var(--accent)"/><circle cx="16" cy="25" r="3.2" fill="var(--accent2)"/><path d="M6 16 16 7l10 9-10 9z" fill="none" stroke="var(--muted)" stroke-width="1.5"/></svg>';
  var header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = '<div class="wrap bar">' +
      '<a class="brand" href="' + root + '/index.html">' + mark + 'Network Layer</a>' +
      '<nav aria-label="Main"><a href="' + root + '/index.html#articles">Articles</a><a href="' + root + '/index.html#demo">Packet demo</a></nav>' +
      '<div class="search"><input id="q" type="search" placeholder="Search concepts" aria-label="Search concepts" autocomplete="off">' +
      '<ul class="results" id="results" hidden></ul></div>' +
      '<button class="btn btn-ghost theme-btn" id="theme" type="button"></button></div>';
  }
  var footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = '<div class="wrap">Network Layer Explained, a B.Tech Computer Science project. Text and diagrams are original.</div>';
  }

  /* ---------- Theme toggle (remembers choice) ---------- */
  var themeBtn = document.getElementById('theme');
  function currentTheme() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function paintThemeBtn() {
    if (themeBtn) themeBtn.textContent = currentTheme() === 'dark' ? 'Light mode' : 'Dark mode';
  }
  if (themeBtn) {
    paintThemeBtn();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('nl-theme', next); } catch (e) { /* storage unavailable */ }
      paintThemeBtn();
    });
  }

  /* ---------- Search (client-side, built from ARTICLES) ---------- */
  var INDEX = [];
  ARTICLES.forEach(function (a) {
    INDEX.push({ label: a.title, where: 'Article: ' + a.cat, href: url(a), text: (a.title + ' ' + a.sum).toLowerCase() });
    a.topics.forEach(function (t) {
      INDEX.push({ label: t, where: 'In ' + a.title, href: url(a), text: (t + ' ' + a.title).toLowerCase() });
    });
  });
  var q = document.getElementById('q'), box = document.getElementById('results');
  function runSearch() {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { box.hidden = true; return; }
    var hits = INDEX.filter(function (e) { return words.every(function (w) { return e.text.indexOf(w) > -1; }); }).slice(0, 8);
    box.innerHTML = hits.length
      ? hits.map(function (h) { return '<li><a href="' + h.href + '">' + h.label + '<small>' + h.where + '</small></a></li>'; }).join('')
      : '<li class="none">No match yet. Try a word like routing, subnet or bucket.</li>';
    box.hidden = false;
  }
  if (q && box) {
    q.addEventListener('input', runSearch);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { box.hidden = true; }
      if (e.key === 'Enter') { var first = box.querySelector('a'); if (first) window.location.href = first.href; }
      if (e.key === 'ArrowDown') { var f = box.querySelector('a'); if (f) { e.preventDefault(); f.focus(); } }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search')) box.hidden = true; });
  }

  /* ---------- Homepage: article list with category filter ---------- */
  var list = document.getElementById('list'), chips = document.getElementById('chips');
  if (list && chips) {
    var cats = ['All'].concat(ARTICLES.map(function (a) { return a.cat; }));
    chips.innerHTML = cats.map(function (c, i) {
      return '<button class="chip" type="button" data-cat="' + c + '" aria-pressed="' + (i === 0) + '">' + c + '</button>';
    }).join('');
    var drawList = function (cat) {
      list.innerHTML = ARTICLES.map(function (a, i) {
        if (cat !== 'All' && a.cat !== cat) return '';
        return '<li><a class="row" href="' + url(a) + '"><span class="num" aria-hidden="true">' + (i + 1) + '</span>' +
          '<div><h3>' + a.title + '</h3><p>' + a.sum + '</p><ul class="topics">' +
          a.topics.slice(0, 5).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>' +
          '<span class="meta">' + a.cat + ', ' + a.min + ' min read</span></a></li>';
      }).join('');
    };
    drawList('All');
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      drawList(b.getAttribute('data-cat'));
    });
  }

  /* ---------- Homepage: packet forwarding demo ---------- */
  var svg = document.getElementById('demo-svg');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var NODES = { PC: [50, 150, 'Your PC', 1], R1: [150, 70, 'R1'], R2: [150, 230, 'R2'], R3: [275, 150, 'R3'],
                  R4: [395, 70, 'R4'], R5: [395, 230, 'R5'], WEB: [505, 70, 'Web', 1], MAIL: [505, 230, 'Mail', 1] };
    var LINKS = [['PC', 'R1'], ['PC', 'R2'], ['R1', 'R3'], ['R2', 'R3'], ['R3', 'R4'], ['R3', 'R5'], ['R2', 'R5'], ['R4', 'WEB'], ['R5', 'MAIL']];
    var DEST = {
      WEB: { ip: '203.0.113.7', net: '203.0.113.0/24', name: 'the web server', path: ['PC', 'R1', 'R3', 'R4', 'WEB'] },
      MAIL: { ip: '198.51.100.25', net: '198.51.100.0/24', name: 'the mail server', path: ['PC', 'R2', 'R5', 'MAIL'] }
    };
    var make = function (tag, attrs) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };
    var linkEls = {}, nodeEls = {};
    LINKS.forEach(function (l) {
      var a = NODES[l[0]], b = NODES[l[1]];
      var ln = make('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'link' });
      svg.appendChild(ln); linkEls[l[0] + l[1]] = ln;
    });
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id], w = n[3] ? 60 : 36, g = make('g', { 'class': 'node' + (n[3] ? ' host' : '') });
      g.appendChild(make('rect', { x: n[0] - w / 2, y: n[1] - 14, width: w, height: 28, rx: 6 }));
      var t = make('text', { x: n[0], y: n[1] + 4 }); t.textContent = n[2]; g.appendChild(t);
      svg.appendChild(g); nodeEls[id] = g;
    });
    var pkt = make('circle', { cx: 0, cy: 0, r: 7, 'class': 'pkt' });
    pkt.style.transform = 'translate(50px,150px)';
    svg.appendChild(pkt);

    var log = document.getElementById('demo-log'), buttons = document.querySelectorAll('[data-dest]'), busy = false;
    var reset = function () {
      Object.keys(linkEls).forEach(function (k) { linkEls[k].setAttribute('class', 'link'); });
      Object.keys(nodeEls).forEach(function (k) { nodeEls[k].setAttribute('class', 'node' + (NODES[k][3] ? ' host' : '')); });
      log.innerHTML = '';
    };
    var message = function (d, i) {
      var cur = d.path[i], nxt = d.path[i + 1];
      if (i === 0) return 'Your PC has no specific route for ' + d.ip + ', so it sends the packet to its default gateway, ' + nxt + '.';
      if (!nxt) return 'The packet is delivered to ' + d.name + '.';
      if (nxt === 'WEB' || nxt === 'MAIL') return cur + ': ' + d.ip + ' is on the directly connected network ' + d.net + ', so ' + cur + ' delivers it.';
      return cur + ': ' + d.ip + ' matches ' + d.net + ' in its table, so it forwards to ' + nxt + '.';
    };
    var send = function (key) {
      if (busy) return;
      busy = true; reset();
      buttons.forEach(function (b) { b.disabled = true; });
      var d = DEST[key], i = 0;
      var step = function () {
        var id = d.path[i], n = NODES[id];
        pkt.style.transform = 'translate(' + n[0] + 'px,' + n[1] + 'px)';
        nodeEls[id].setAttribute('class', nodeEls[id].getAttribute('class') + ' on');
        if (i > 0) {
          var k = d.path[i - 1] + id, k2 = id + d.path[i - 1];
          (linkEls[k] || linkEls[k2]).setAttribute('class', 'link on');
        }
        var li = document.createElement('li'); li.textContent = message(d, i); log.appendChild(li);
        i++;
        if (i < d.path.length) { setTimeout(step, 1100); }
        else { busy = false; buttons.forEach(function (b) { b.disabled = false; }); }
      };
      step();
    };
    buttons.forEach(function (b) { b.addEventListener('click', function () { send(b.getAttribute('data-dest')); }); });
  }
})();
