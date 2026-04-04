// =============================================
// Shared utilities — v2
// =============================================
function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Shared Supabase anonymous key (public, protected by RLS)
var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYWR1dWhhd3FiY2R2dGltbmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTAxMTAsImV4cCI6MjA3MDA4NjExMH0.4c5yRD8_gn9qbn483cbI7Pqukwhyei7e0evt8ELqWG0';

// =============================================
// SPA Navigation — fade transitions over mesh
// =============================================
(function () {
    var isNavigating = false;
    var FADE_DURATION = 400; // ms, matches CSS transition
    var VALID_PAGES = ['home', 'about', 'faq', 'contact', 'privacy', 'terms'];

    function navigateTo(pageName, pushState) {
        if (isNavigating) return;
        if (VALID_PAGES.indexOf(pageName) === -1) pageName = 'home';
        var current = document.querySelector('.page.active');
        var target = document.querySelector('[data-page="' + pageName + '"]');
        if (!target || target === current) return;

        isNavigating = true;

        // Update nav active state
        document.querySelectorAll('.nav-links a').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-nav') === pageName);
        });

        // Update page title
        var titles = { home: 'Sanity', about: 'About — Sanity', faq: 'FAQ — Sanity', contact: 'Support — Sanity', privacy: 'Privacy Policy — Sanity', terms: 'Terms of Service — Sanity' };
        document.title = titles[pageName] || 'Sanity';

        // Fade out current + footer
        var footer = document.querySelector('.site-footer');
        if (current) {
            current.classList.add('fading-out');
            current.classList.remove('active');
        }
        if (footer) footer.style.opacity = '0';

        // After fade out completes, fade in new + footer
        setTimeout(function () {
            if (current) current.classList.remove('fading-out');
            target.classList.add('active');
            if (footer) footer.style.opacity = '1';
            isNavigating = false;
        }, FADE_DURATION);

        // Update URL without reload
        if (pushState !== false) {
            var path = pageName === 'home' ? '/' : '/' + pageName;
            history.pushState({ page: pageName }, '', path);
        }
    }

    // Click handlers for all nav links
    document.querySelectorAll('[data-nav]').forEach(function (el) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(this.getAttribute('data-nav'));
        });
    });

    // Browser back/forward
    window.addEventListener('popstate', function (e) {
        var page = (e.state && e.state.page) || getPageFromPath();
        navigateTo(page, false);
    });

    // Route on initial load (handles direct URL visits and refreshes)
    function getPageFromPath() {
        var path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
        if (!path || path === 'index.html') return 'home';
        return path;
    }

    // Set initial state
    var initialPage = getPageFromPath();
    if (VALID_PAGES.indexOf(initialPage) === -1) initialPage = 'home';
    if (initialPage !== 'home') {
        // Swap to correct page immediately (no animation) on direct URL visit
        var home = document.querySelector('[data-page="home"]');
        var target = document.querySelector('[data-page="' + initialPage + '"]');
        if (target && home) {
            home.classList.remove('active');
            target.classList.add('active');
            document.querySelectorAll('.nav-links a').forEach(function (a) {
                a.classList.toggle('active', a.getAttribute('data-nav') === initialPage);
            });
        }
    }
    history.replaceState({ page: initialPage }, '', window.location.pathname);
})();

// =============================================
// Download button — circle-reveal hover
// =============================================
(function () {
    var wrap = document.querySelector('.nav-download-wrap');
    var reveal = wrap && wrap.querySelector('.nav-download-reveal');
    if (!wrap || !reveal) return;
    var expandTimer = null;
    var expanded = false;

    wrap.addEventListener('mousemove', function (e) {
        if (expanded) return;
        var rect = reveal.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        reveal.style.clipPath = 'circle(24px at ' + x + 'px ' + y + 'px)';
    });

    wrap.addEventListener('mouseenter', function () {
        expanded = false;
        reveal.style.transition = 'clip-path 0.15s ease-out';
        expandTimer = setTimeout(function () {
            expanded = true;
            reveal.style.transition = 'clip-path 0.6s ease-out';
            reveal.style.clipPath = 'circle(150% at 50% 50%)';
        }, 250);
    });

    wrap.addEventListener('mouseleave', function () {
        if (expandTimer) {
            clearTimeout(expandTimer);
            expandTimer = null;
        }
        expanded = false;
        reveal.style.transition = 'clip-path 0.15s ease-out';
        var current = reveal.style.clipPath;
        var match = current.match(/at (.+)\)/);
        var pos = match ? match[1] : '0px 0px';
        reveal.style.clipPath = 'circle(0px at ' + pos + ')';
    });

    // Open coming soon modal on click
    var comingSoonModal = document.getElementById('coming-soon-modal');
    var comingSoonCancel = document.getElementById('coming-soon-cancel');

    wrap.addEventListener('click', function (e) {
        e.preventDefault();
        comingSoonModal.classList.add('visible');
    });

    comingSoonCancel.addEventListener('click', function () {
        comingSoonModal.classList.remove('visible');
    });

    comingSoonModal.addEventListener('click', function (e) {
        if (e.target === comingSoonModal) comingSoonModal.classList.remove('visible');
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && comingSoonModal.classList.contains('visible')) {
            comingSoonModal.classList.remove('visible');
        }
    });
})();

// =============================================
// City Dashboard — live data from edge function
// =============================================
(function () {
    var API_URL = 'https://emaduuhawqbcdvtimnjo.supabase.co/functions/v1/get-city-dashboard';
    var VIOLATION_LABELS = {
        rodents: 'Rodents', pests: 'Pests', bacterial: 'Bacterial',
        chemical: 'Chemical', mold: 'Mold', temperature: 'Temperature',
        improper_storage: 'Improper Storage', documentation: 'Documentation'
    };
    // Metro coverage tooltips (from MetropolitanArea.areaDescription in iOS app)
    var AREA_INFO = {
        'nyc': 'Manhattan, Brooklyn, Queens & more',
        'chicago': 'Chicago & Evanston',
        'seattle': 'Seattle, Bellevue & King County',
        'sf': 'San Francisco, Oakland, San Jose',
        'boston': 'Boston & Cambridge',
        'vancouver': 'Vancouver, Richmond & Greater Vancouver'
    };
    // Override display names for the website (DB has full jurisdiction names)
    var DISPLAY_NAMES = {
        'seattle': 'Seattle',
        'vancouver': 'Vancouver, BC'
    };
    // Custom tile order (left→right, top→bottom)
    var TILE_ORDER = ['sf', 'nyc', 'seattle', 'boston', 'vancouver', 'chicago'];

    // Merge Boston + Cambridge into one entry
    function mergeBostonCambridge(data) {
        var boston = null, cambridge = null, rest = [];
        data.forEach(function (city) {
            if (city.jurisdiction_code === 'boston') boston = city;
            else if (city.jurisdiction_code === 'cambridge') cambridge = city;
            else rest.push(city);
        });
        if (boston && cambridge) {
            boston.display_name = 'Boston';
            boston.total_establishments += cambridge.total_establishments;
            boston.green_count += cambridge.green_count;
            boston.yellow_count += cambridge.yellow_count;
            boston.orange_count += cambridge.orange_count;
            boston.red_count += cambridge.red_count;
            var vc = boston.violation_counts || {};
            var cv = cambridge.violation_counts || {};
            Object.keys(cv).forEach(function (key) {
                vc[key] = (vc[key] || 0) + cv[key];
            });
            boston.violation_counts = vc;
        }
        if (boston) rest.push(boston);
        // Sort by custom tile order
        rest.sort(function (a, b) {
            var ai = TILE_ORDER.indexOf(a.jurisdiction_code);
            var bi = TILE_ORDER.indexOf(b.jurisdiction_code);
            if (ai === -1) ai = 999;
            if (bi === -1) bi = 999;
            return ai - bi;
        });
        return rest;
    }

    var BAR_LABELS = {
        green: 'places in good standing',
        yellow: 'places with low severity violations',
        orange: 'places with medium severity violations',
        red: 'places with high or critical violations'
    };

    function healthBarSegment(cls, count, pct) {
        if (count === 0) return '';
        var small = pct < 5 ? ' data-small="1"' : '';
        return '<span class="' + cls + '" style="flex-grow:' + pct.toFixed(1) + '" ' +
            'data-base="' + pct.toFixed(1) + '" data-pct="' + pct.toFixed(1) + '"' +
            small + '>' +
            '<span class="bar-tooltip">' + Number(count).toLocaleString() + ' ' +
            BAR_LABELS[cls.replace('hb-', '')] + '</span></span>';
    }

    function initHealthBarHovers() {
        var PROXIMITY_PX = 10;

        document.querySelectorAll('.health-bar').forEach(function (bar) {
            var segments = Array.prototype.slice.call(
                bar.querySelectorAll('span[data-base]')
            );
            if (segments.length === 0) return;

            var activeSeg = null;
            var activeTime = 0;

            function deactivate() {
                if (activeSeg) {
                    if (activeSeg.hasAttribute('data-small')) {
                        activeSeg._deactivatedAt = Date.now();
                    }
                    activeSeg.style.flexGrow = activeSeg.getAttribute('data-base');
                    activeSeg.classList.remove('bar-active');
                    activeSeg = null;
                }
            }

            function activate(seg) {
                if (seg === activeSeg) return;
                deactivate();
                activeSeg = seg;
                activeTime = Date.now();
                seg.classList.add('bar-active');
                var pct = parseFloat(seg.getAttribute('data-pct'));
                if (pct < 50) {
                    var grow = pct * 1.8;
                    if (seg.hasAttribute('data-small')) grow = Math.max(grow, 8);
                    seg.style.flexGrow = grow.toFixed(1);
                }
            }

            function findSegment(clientX) {
                var barRect = bar.getBoundingClientRect();
                var x = clientX - barRect.left;

                var boundaries = [];
                for (var i = 0; i < segments.length; i++) {
                    var rect = segments[i].getBoundingClientRect();
                    boundaries.push({
                        seg: segments[i],
                        left: rect.left - barRect.left,
                        right: rect.right - barRect.left,
                        isSmall: segments[i].hasAttribute('data-small')
                    });
                }

                // Check expanded hit zones for small segments first
                var proximityHit = null;
                var proximityDist = Infinity;
                for (var i = 0; i < boundaries.length; i++) {
                    if (!boundaries[i].isSmall) continue;
                    if (boundaries[i].seg === activeSeg && Date.now() - activeTime > 300) continue;
                    if (boundaries[i].seg._deactivatedAt && Date.now() - boundaries[i].seg._deactivatedAt < 350) continue;
                    var expandedLeft = boundaries[i].left - PROXIMITY_PX;
                    var expandedRight = boundaries[i].right + PROXIMITY_PX;
                    if (x >= expandedLeft && x <= expandedRight) {
                        var center = (boundaries[i].left + boundaries[i].right) / 2;
                        var dist = Math.abs(x - center);
                        if (dist < proximityDist) {
                            proximityDist = dist;
                            proximityHit = boundaries[i];
                        }
                    }
                }
                if (proximityHit) return proximityHit.seg;

                // Fall back to direct hit on any segment
                for (var i = 0; i < boundaries.length; i++) {
                    if (x >= boundaries[i].left && x <= boundaries[i].right) {
                        return boundaries[i].seg;
                    }
                }
                return null;
            }

            bar.addEventListener('mousemove', function (e) {
                var seg = findSegment(e.clientX);
                if (seg) {
                    activate(seg);
                } else {
                    deactivate();
                }
            });

            bar.addEventListener('mouseleave', function () {
                deactivate();
            });
        });
    }

    var SEVERITY_COLORS = {
        pests: ['#EB5757'],
        rodents: ['#EB5757'],
        mold: ['#EB5757'],
        chemical: ['#F2994B', '#EB5757'],
        improper_storage: ['#F2C94C', '#EB5757', '#F2994B'],
        bacterial: ['#F2C94C', '#EB5757', '#F2994B'],
        temperature: ['#F2C94C', '#EB5757', '#F2994B'],
        documentation: ['#F2C94C', '#EB5757', '#F2994B']
    };

    function initViolationTagHovers() {
        document.querySelectorAll('.violation-tag[data-vtype]').forEach(function (tag) {
            var vtype = tag.getAttribute('data-vtype');
            var colors = SEVERITY_COLORS[vtype];
            if (!colors) return;
            var colorLayer = tag.querySelector('.vtag-color');
            if (!colorLayer) return;

            var colorIndex = 0;
            var cycleInterval = null;
            var expandTimer = null;
            var expanded = false;

            function setColor(color) {
                colorLayer.style.color = color;
                var vc = colorLayer.querySelector('.vcount');
                if (vc) vc.style.color = color;
            }

            tag.addEventListener('mouseenter', function () {
                colorIndex = 0;
                expanded = false;
                colorLayer.style.transition = 'color 0.4s ease, clip-path 0.15s ease-out';
                setColor(colors[0]);
                if (colors.length > 1) {
                    cycleInterval = setInterval(function () {
                        colorIndex = (colorIndex + 1) % colors.length;
                        setColor(colors[colorIndex]);
                    }, 800);
                }
                expandTimer = setTimeout(function () {
                    expanded = true;
                    colorLayer.style.transition = 'color 0.4s ease, clip-path 0.6s ease-out';
                    colorLayer.style.clipPath = 'circle(150% at 50% 50%)';
                }, 1250);
            });

            tag.addEventListener('mousemove', function (e) {
                if (expanded) return;
                var rect = tag.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                colorLayer.style.clipPath = 'circle(20px at ' + x + 'px ' + y + 'px)';
            });

            tag.addEventListener('mouseleave', function () {
                if (cycleInterval) {
                    clearInterval(cycleInterval);
                    cycleInterval = null;
                }
                if (expandTimer) {
                    clearTimeout(expandTimer);
                    expandTimer = null;
                }
                expanded = false;
                colorLayer.style.transition = 'color 0.4s ease, clip-path 0.15s ease-out';
                // Collapse circle at last known position
                var current = colorLayer.style.clipPath;
                var match = current.match(/at (.+)\)/);
                var pos = match ? match[1] : '0px 0px';
                colorLayer.style.clipPath = 'circle(0px at ' + pos + ')';
            });
        });
    }

    function renderDashboard(cities) {
        var container = document.getElementById('city-dashboard');
        container.innerHTML = '';
        cities.forEach(function (city) {
            var code = city.jurisdiction_code;
            if (code === 'austin') return; // Austin is score-only — rendered as ghost tile below
            var name = DISPLAY_NAMES[code] || city.display_name;
            var safeName = escapeHtml(name);
            var total = city.total_establishments;
            var g = city.green_count, y = city.yellow_count;
            var o = city.orange_count, r = city.red_count;

            var gPct = g / total * 100;
            var yPct = y / total * 100;
            var oPct = o / total * 100;
            var rPct = r / total * 100;

            // Violation tags sorted by count descending
            var vc = city.violation_counts || {};
            var sorted = Object.keys(vc).sort(function (a, b) { return vc[b] - vc[a]; });
            var tags = sorted.map(function (key) {
                var safeKey = escapeAttr(key);
                var label = VIOLATION_LABELS[key] || escapeHtml(key);
                var countStr = Number(vc[key]).toLocaleString();
                var innerHtml = '<span class="vcount">' + countStr + '</span> ' + label;
                return '<span class="violation-tag" data-vtype="' + safeKey + '">' +
                    innerHtml +
                    '<span class="vtag-color" aria-hidden="true">' + innerHtml + '</span>' +
                    '</span>';
            }).join('');

            // Info tooltip (SF Symbol info.circle.fill as inline SVG)
            var infoHtml = '';
            if (AREA_INFO[code]) {
                infoHtml = '<span class="info-icon">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="#ccc" xmlns="http://www.w3.org/2000/svg">' +
                    '<circle cx="12" cy="12" r="12"/>' +
                    '<text x="12" y="17" text-anchor="middle" font-size="14" font-weight="700" font-family="-apple-system,BlinkMacSystemFont,sans-serif" fill="#fff">i</text>' +
                    '</svg>' +
                    '<span class="tooltip">' + escapeHtml(AREA_INFO[code]) + '</span></span>';
            }

            var tile = document.createElement('div');
            tile.className = 'city-tile';
            tile.innerHTML =
                '<div class="city-header"><h2>' + safeName + '</h2>' + infoHtml + '</div>' +
                '<div class="city-total">' + Number(total).toLocaleString() + ' establishments</div>' +
                '<div class="health-bar">' +
                    healthBarSegment('hb-green', g, gPct) +
                    healthBarSegment('hb-yellow', y, yPct) +
                    healthBarSegment('hb-orange', o, oPct) +
                    healthBarSegment('hb-red', r, rPct) +
                '</div>' +
                '<div class="violations-header">Violations</div>' +
                '<div class="violation-list">' + tags + '</div>';
            container.appendChild(tile);
        });

        // Austin "Coming Soon" tile (styled like a real city tile, greyed out)
        var austinGhost = document.createElement('div');
        austinGhost.className = 'city-tile coming-soon';
        austinGhost.innerHTML =
            '<div class="city-header"><h2>Austin</h2></div>' +
            '<div class="city-total">5,945 establishments</div>' +
            '<div class="health-bar"><span style="flex-grow:1;border-radius:3px"></span></div>' +
            '<div class="violations-header">Coming Soon...</div>';
        container.appendChild(austinGhost);

        // Ghost "Coming Soon" tile with form CTA
        var ghost = document.createElement('div');
        ghost.className = 'ghost-tile';
        ghost.innerHTML = '<span class="ghost-label">Coming Soon</span>' +
            '<span class="ghost-cta">Don\'t see your city? <a id="open-request-modal">Request it here</a></span>';
        container.appendChild(ghost);

        // Wire up modal open
        document.getElementById('open-request-modal').addEventListener('click', function (e) {
            e.preventDefault();
            openRequestModal();
        });

        // Faded ghost tiles (bottom row)
        var fadeWrap = document.createElement('div');
        fadeWrap.className = 'ghost-fade-wrap';
        for (var gi = 0; gi < 2; gi++) {
            var fadedGhost = document.createElement('div');
            fadedGhost.className = 'ghost-tile';
            fadedGhost.innerHTML = '<span class="ghost-label">Coming Soon</span>';
            fadeWrap.appendChild(fadedGhost);
        }
        container.appendChild(fadeWrap);

        // Social links
        var socialsEl = document.createElement('div');
        socialsEl.className = 'dashboard-socials';
        socialsEl.innerHTML = '<a href="https://instagram.com/sanity_app" target="_blank" rel="noopener" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.08 4.08 0 011.47.957c.453.453.78.898.957 1.47.163.46.35 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.08 4.08 0 01-.957 1.47 4.08 4.08 0 01-1.47.957c-.46.163-1.26.35-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.08 4.08 0 01-1.47-.957 4.08 4.08 0 01-.957-1.47c-.163-.46-.35-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.08 4.08 0 01.957-1.47A4.08 4.08 0 015.063 2.293c.46-.163 1.26-.35 2.43-.403C8.759 1.832 9.139 1.82 12 1.82zM12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.876 5.876 0 00.63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.876 5.876 0 001.384 2.126A5.876 5.876 0 004.14 23.37c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a5.876 5.876 0 002.126-1.384 5.876 5.876 0 001.384-2.126c.297-.763.499-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.876 5.876 0 00-1.384-2.126A5.876 5.876 0 0019.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>'
            + '<a href="https://x.com/sanity_app" target="_blank" rel="noopener" aria-label="X"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>'
            + '<a href="https://tiktok.com/@sanity_app" target="_blank" rel="noopener" aria-label="TikTok"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.41a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.84z"/></svg></a>';
        container.parentNode.appendChild(socialsEl);

        // Wire up hover interactions
        initHealthBarHovers();
        initViolationTagHovers();
    }

    var controller = new AbortController();
    setTimeout(function () { controller.abort(); }, 15000);

    fetch(API_URL, { signal: controller.signal })
        .then(function (res) {
            if (!res.ok) throw new Error('Server error: ' + res.status);
            var ct = res.headers.get('content-type') || '';
            if (ct.indexOf('application/json') === -1) throw new Error('Unexpected response type');
            return res.json();
        })
        .then(function (data) {
            if (Array.isArray(data)) renderDashboard(mergeBostonCambridge(data));
            else throw new Error(data.error || 'Unknown error');
        })
        .catch(function (err) {
            var container = document.getElementById('city-dashboard');
            var msg = err && err.name === 'AbortError' ? 'Request timed out.' : 'Unable to load city data.';
            container.innerHTML = '<p class="dashboard-loading">' + msg + '</p>';
        });
})();

// =============================================
// City Request Modal
// =============================================
var openRequestModal;
(function () {
    var SUBMIT_URL = 'https://emaduuhawqbcdvtimnjo.supabase.co/functions/v1/submit-form';
    var submitTimestamps = [];
    var RATE_LIMIT = 5;
    var RATE_WINDOW = 5 * 60 * 1000; // 5 minutes

    var modal = document.getElementById('request-modal');
    var formView = document.getElementById('modal-form-view');
    var successView = document.getElementById('modal-success-view');
    var cityInput = document.getElementById('request-city');
    var emailInput = document.getElementById('request-email');
    var phoneInput = document.getElementById('request-phone');
    var submitBtn = document.getElementById('modal-submit');
    var cancelBtn = document.getElementById('modal-cancel');
    var errorEl = document.getElementById('modal-validation-error');
    var successCityText = document.getElementById('success-city-text');

    function resetModal() {
        formView.style.display = '';
        successView.style.display = 'none';
        cityInput.value = '';
        emailInput.value = '';
        phoneInput.value = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submit Request';
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }

    openRequestModal = function () {
        resetModal();
        modal.classList.add('visible');
        cityInput.focus();
    };

    // FAQ page "request it here" link (replaces inline onclick for CSP compliance)
    var faqRequestLink = document.getElementById('faq-request-link');
    if (faqRequestLink) {
        faqRequestLink.addEventListener('click', function (e) {
            e.preventDefault();
            openRequestModal();
        });
    }

    function closeModal() {
        modal.classList.remove('visible');
    }

    // Phone auto-formatting: (XXX) XXX-XXXX
    function formatPhone(input) {
        var digits = input.replace(/\D/g, '').slice(0, 10);
        if (digits.length === 0) return '';
        if (digits.length <= 3) return '(' + digits;
        if (digits.length <= 6) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
        return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
    }

    phoneInput.addEventListener('input', function () {
        var pos = phoneInput.selectionStart;
        var before = phoneInput.value;
        phoneInput.value = formatPhone(phoneInput.value);
        // Adjust cursor if formatting changed length
        var diff = phoneInput.value.length - before.length;
        phoneInput.setSelectionRange(pos + diff, pos + diff);
    });

    // Enable submit only when city is filled
    cityInput.addEventListener('input', function () {
        submitBtn.disabled = !cityInput.value.trim();
        errorEl.style.display = 'none';
    });

    cancelBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
    });

    function validate() {
        var email = emailInput.value.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.style.display = 'block';
            return false;
        }
        var phoneDigits = phoneInput.value.replace(/\D/g, '');
        if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
            errorEl.textContent = 'Please enter a 10-digit phone number.';
            errorEl.style.display = 'block';
            return false;
        }
        errorEl.style.display = 'none';
        return true;
    }

    submitBtn.addEventListener('click', function () {
        var cityRaw = cityInput.value.trim();
        if (!cityRaw) return;
        if (!validate()) return;

        // Rate limiting
        var now = Date.now();
        submitTimestamps = submitTimestamps.filter(function (t) { return now - t < RATE_WINDOW; });
        if (submitTimestamps.length >= RATE_LIMIT) {
            errorEl.textContent = 'Too many submissions. Please try again later.';
            errorEl.style.display = 'block';
            return;
        }
        submitTimestamps.push(now);

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Parse city, state from comma-separated input
        var parts = cityRaw.split(',').map(function (s) { return s.trim(); });
        var content = { city: parts[0] };
        if (parts.length > 1 && parts[1]) content.state = parts[1];
        var email = emailInput.value.trim();
        if (email) content.email = email;
        var phoneDigits = phoneInput.value.replace(/\D/g, '');
        if (phoneDigits) content.phone = phoneDigits;

        fetch(SUBMIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ANON_KEY
            },
            body: JSON.stringify({ type: 'city_request', content: content })
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Request failed: ' + res.status);
            successCityText.textContent = "We'll consider adding " + cityRaw + " in a future update.";
            formView.style.display = 'none';
            successView.style.display = '';
            setTimeout(closeModal, 2000);
        })
        .catch(function () {
            submitBtn.textContent = 'Error — try again';
            submitBtn.disabled = false;
        });
    });
})();

// =============================================
// Support Form — inline on /contact page
// =============================================
(function () {
    var SUBMIT_URL = 'https://emaduuhawqbcdvtimnjo.supabase.co/functions/v1/submit-support-request';
    var submitTimestamps = [];
    var RATE_LIMIT = 5;
    var RATE_WINDOW = 5 * 60 * 1000; // 5 minutes

    var formView = document.getElementById('support-form-view');
    var successView = document.getElementById('support-success-view');
    var categorySelect = document.getElementById('support-category');
    var emailInput = document.getElementById('support-email');
    var messageInput = document.getElementById('support-message');
    var submitBtn = document.getElementById('support-submit');
    var errorEl = document.getElementById('support-validation-error');
    var sendAnotherBtn = document.getElementById('support-send-another');

    function updateSubmitState() {
        var hasEmail = emailInput.value.trim().length > 0;
        var hasMessage = messageInput.value.trim().length > 0;
        submitBtn.disabled = !(hasEmail && hasMessage);
        errorEl.style.display = 'none';
    }

    emailInput.addEventListener('input', updateSubmitState);
    messageInput.addEventListener('input', updateSubmitState);

    function validate() {
        var email = emailInput.value.trim();
        if (!email) {
            errorEl.textContent = 'Email is required.';
            errorEl.style.display = 'block';
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.style.display = 'block';
            return false;
        }
        var message = messageInput.value.trim();
        if (!message) {
            errorEl.textContent = 'Please enter a message.';
            errorEl.style.display = 'block';
            return false;
        }
        errorEl.style.display = 'none';
        return true;
    }

    function resetForm() {
        categorySelect.selectedIndex = 0;
        emailInput.value = '';
        messageInput.value = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Send Message';
        errorEl.style.display = 'none';
    }

    sendAnotherBtn.addEventListener('click', function () {
        successView.style.display = 'none';
        formView.style.display = '';
        resetForm();
    });

    submitBtn.addEventListener('click', function () {
        if (!validate()) return;

        // Rate limiting
        var now = Date.now();
        submitTimestamps = submitTimestamps.filter(function (t) { return now - t < RATE_WINDOW; });
        if (submitTimestamps.length >= RATE_LIMIT) {
            errorEl.textContent = 'Too many submissions. Please try again later.';
            errorEl.style.display = 'block';
            return;
        }
        submitTimestamps.push(now);

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        var category = categorySelect.value || 'general_question';
        var email = emailInput.value.trim();
        var message = messageInput.value.trim();

        fetch(SUBMIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ANON_KEY
            },
            body: JSON.stringify({
                category: category,
                email: email,
                message: message
            })
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Request failed: ' + res.status);
            formView.style.display = 'none';
            successView.style.display = '';
        })
        .catch(function () {
            submitBtn.textContent = 'Error — try again';
            submitBtn.disabled = false;
        });
    });
})();

// =============================================
// Animated mesh gradient (6x6, Catmull-Rom)
// =============================================
(function () {
    var canvas = document.getElementById('mesh-bg');
    var ctx = canvas.getContext('2d');

    var GRID = 6;
    var SPANS = GRID - 1;
    var TOTAL = GRID * GRID;

    var RENDER_SIZE = 224;
    var offscreen = document.createElement('canvas');
    offscreen.width = RENDER_SIZE;
    offscreen.height = RENDER_SIZE;
    var offCtx = offscreen.getContext('2d');
    var imageData = offCtx.createImageData(RENDER_SIZE, RENDER_SIZE);

    var dispX = new Float32Array(TOTAL);
    var dispY = new Float32Array(TOTAL);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }

    function catmullRom(p0, p1, p2, p3, t) {
        var t2 = t * t, t3 = t2 * t;
        return 0.5 * (
            (-t3 + 2 * t2 - t) * p0 +
            (3 * t3 - 5 * t2 + 2) * p1 +
            (-3 * t3 + 4 * t2 + t) * p2 +
            (t3 - t2) * p3
        );
    }

    function sampleGrid(grid, nx, ny) {
        var sx = nx * SPANS, sy = ny * SPANS;
        var ix = Math.min(SPANS - 1, Math.max(0, Math.floor(sx)));
        var iy = Math.min(SPANS - 1, Math.max(0, Math.floor(sy)));
        var tx = sx - ix, ty = sy - iy;

        var c0 = Math.max(0, ix - 1), c1 = ix;
        var c2 = Math.min(GRID - 1, ix + 1), c3 = Math.min(GRID - 1, ix + 2);
        var r0 = Math.max(0, iy - 1), r1 = iy;
        var r2 = Math.min(GRID - 1, iy + 1), r3 = Math.min(GRID - 1, iy + 2);

        var v0 = catmullRom(grid[r0 * GRID + c0], grid[r0 * GRID + c1], grid[r0 * GRID + c2], grid[r0 * GRID + c3], tx);
        var v1 = catmullRom(grid[r1 * GRID + c0], grid[r1 * GRID + c1], grid[r1 * GRID + c2], grid[r1 * GRID + c3], tx);
        var v2 = catmullRom(grid[r2 * GRID + c0], grid[r2 * GRID + c1], grid[r2 * GRID + c2], grid[r2 * GRID + c3], tx);
        var v3 = catmullRom(grid[r3 * GRID + c0], grid[r3 * GRID + c1], grid[r3 * GRID + c2], grid[r3 * GRID + c3], tx);

        return catmullRom(v0, v1, v2, v3, ty);
    }

    var JITTER = [
        [0,0],       [.015,0],    [-.025,0],   [.02,0],     [-.015,0],   [0,0],
        [0,.015],    [.035,-.025],[-.02,.03],   [.025,-.02], [-.03,.025], [0,-.01],
        [0,-.02],    [-.025,.035],[.04,-.015],  [-.03,.025], [.02,-.03],  [0,.02],
        [0,.025],    [.03,.02],   [-.035,-.03], [.02,.035],  [-.025,-.015],[0,-.02],
        [0,-.015],   [-.02,.03],  [.03,-.025],  [-.035,.02], [.025,.03],  [0,.015],
        [0,0],       [-.02,0],    [.015,0],    [-.025,0],   [.02,0],     [0,0],
    ];

    var PERSONALITY = [
        null, [0,0,.9,0,0,0], [0,0,1.15,0,0,0], [0,0,.8,0,0,0], [0,0,1.05,0,0,0], null,
        [0,.010,0,1.0,0,0],
        [.08,.03, 1.44, .65, 0, 2.1],
        [.015,.015,.42, .38, 1.5, .9],
        [.04,.07, .85, 1.55, 3.0, 0],
        [.06,.04, 1.25, .72, 1.8, 3.2],
        [0,.008,0,.88,0,0],
        [0,.012,0,1.1,0,0],
        [.03,.06, .60, 1.30, 2.0, 0],
        [.07,.07, 1.50,1.35, 0, 1.5],
        [.02,.02, .45, .50, 2.8, 1.2],
        [.05,.03, 1.10, .58, .5, 2.5],
        [0,.010,0,.95,0,0],
        [0,.009,0,.85,0,0],
        [.04,.05, .75, 1.10, 0, 3.5],
        [.01,.02, .35, .48, 1.2, 0],
        [.08,.04, 1.60, .70, 2.5, 1.0],
        [.03,.08, .55, 1.65, 3.8, 0],
        [0,.012,0,1.05,0,0],
        [0,.011,0,.92,0,0],
        [.06,.02, 1.30, .45, 0, 2.8],
        [.05,.06, .90, 1.20, 1.5, 0],
        [.02,.015,.40, .35, 3.2, 1.8],
        [.07,.05, 1.15, 1.00, 0, .6],
        [0,.009,0,1.12,0,0],
        null, [0,0,1.0,0,0,0], [0,0,.85,0,0,0], [0,0,1.2,0,0,0], [0,0,.95,0,0,0], null,
    ];

    function getPoints(t) {
        var points = new Array(TOTAL);
        for (var r = 0; r < GRID; r++) {
            for (var c = 0; c < GRID; c++) {
                var i = r * GRID + c;
                var j = JITTER[i];
                var bx = c / SPANS + j[0];
                var by = r / SPANS + j[1];
                var dx = 0, dy = 0;

                var p = PERSONALITY[i];
                if (p !== null) {
                    var onEdgeX = (c === 0 || c === SPANS);
                    var onEdgeY = (r === 0 || r === SPANS);

                    if (!onEdgeX && !onEdgeY) {
                        dx = p[0] * Math.sin(t * p[2] + p[4]);
                        dy = p[1] * Math.cos(t * p[3] + p[5]);
                    } else if (!onEdgeX && onEdgeY) {
                        dx = 0.015 * Math.sin(t * p[2]);
                    } else if (onEdgeX && !onEdgeY) {
                        dy = p[1] * Math.sin(t * p[3]);
                    }
                }

                points[i] = [bx + dx, by + dy];
            }
        }
        return points;
    }

    function getColors(t) {
        var g = new Array(14);
        var amps =  [.030,.042,.020,.038,.048,.025,.035,.045,.022,.040,.032,.050,.028,.035];
        var freqs = [.72, .95, 1.15,.58, .82, 1.35,.68, 1.05,.48, .78, 1.25,.62, .88, 1.42];
        for (var i = 0; i < 14; i++) {
            g[i] = 0.911 + amps[i] * ((i & 1)
                ? Math.cos(t * freqs[i] + i * 1.1)
                : Math.sin(t * freqs[i] + i * 0.8));
        }

        var W = 1.0, S = 0.911;
        return [
            g[0],  g[1],  W,     S,     W,     S,
            W,     g[2],  g[3],  W,     S,     g[4],
            g[5],  W,     S,     g[6],  W,     S,
            S,     W,     g[7],  W,     S,     W,
            W,     S,     W,     g[8],  g[9],  g[10],
            S,     W,     S,     g[11], W,     g[12],
        ];
    }

    function render(time) {
        var t = time / 1000;
        var points = getPoints(t);
        var colors = getColors(t);
        var data = imageData.data;
        var W = RENDER_SIZE, H = RENDER_SIZE;

        for (var i = 0; i < TOTAL; i++) {
            var r = (i / GRID) | 0, c = i % GRID;
            dispX[i] = points[i][0] - c / SPANS;
            dispY[i] = points[i][1] - r / SPANS;
        }

        for (var py = 0; py < H; py++) {
            var ny = py / (H - 1);
            for (var px = 0; px < W; px++) {
                var nx = px / (W - 1);

                var dx = sampleGrid(dispX, nx, ny);
                var dy = sampleGrid(dispY, nx, ny);

                var wx = nx - dx;
                var wy = ny - dy;
                if (wx < 0) wx = 0; else if (wx > 1) wx = 1;
                if (wy < 0) wy = 0; else if (wy > 1) wy = 1;

                var c = sampleGrid(colors, wx, wy);
                if (c < 0) c = 0; else if (c > 1) c = 1;

                var grey = (c * 255 + 0.5) | 0;
                var pi = (py * W + px) << 2;
                data[pi] = grey;
                data[pi + 1] = grey;
                data[pi + 2] = grey;
                data[pi + 3] = 255;
            }
        }

        offCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(render);
})();
