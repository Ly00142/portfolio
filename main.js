const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isEnglish = document.documentElement.lang === 'en';

// Fond animé : des points qui dérivent et se relient quand ils sont proches.
// Décoratif, masqué aux lecteurs d'écran, en pause quand l'onglet est caché
// et figé si le visiteur a demandé moins d'animations.
const networkBg = document.getElementById('matrix-bg');
if (networkBg) {
    networkBg.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    networkBg.appendChild(canvas);

    const linkDistance = 140;
    let points = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const count = Math.min(90, Math.floor(canvas.width * canvas.height / 16000));
        points = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of points) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dx = points[i].x - points[j].x;
                const dy = points[i].y - points[j].y;
                const d = Math.hypot(dx, dy);
                if (d < linkDistance) {
                    ctx.strokeStyle = `rgba(45, 212, 191, ${0.25 * (1 - d / linkDistance)})`;
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    resize();
    window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });

    if (reduceMotion) {
        draw();
    } else {
        let frame;
        const loop = () => { draw(); frame = requestAnimationFrame(loop); };
        loop();
        document.addEventListener('visibilitychange', () => {
            cancelAnimationFrame(frame);
            if (!document.hidden) loop();
        });
    }
}

// Effet machine à écrire.
// - Le haut de page s'écrit élément par élément, dans l'ordre.
// - Les titres de section plus bas s'écrivent quand ils arrivent à l'écran.
// - La place est réservée avant d'effacer : la page ne saute pas.
// - Les lecteurs d'écran lisent le texte complet (copie masquée visuellement),
//   et rien ne s'anime si le visiteur a demandé moins d'animations.
// Chaque groupe s'écrit d'un coup ; les groupes s'enchaînent l'un après l'autre.
const introGroups = [
    ['.glitch'],
    ['.hero-school', '.role', '.bio-short'],
    ['#about-title'],
    ['.about-text p'],
    ['#expertise-title'],
    ['#film-title', '.film-text']
];

function prepareTyping(element) {
    if (element.dataset.typed) return null;
    element.dataset.typed = '1';
    element.style.visibility = '';
    element.style.minHeight = element.offsetHeight + 'px';

    const full = element.textContent.replace(/\s+/g, ' ').trim();
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    while (element.firstChild) visual.appendChild(element.firstChild);
    const readable = document.createElement('span');
    readable.className = 'sr-only';
    readable.textContent = full;
    element.append(readable, visual);

    // On garde les balises internes (ex. le nom en dégradé) et on vide seulement le texte.
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent.replace(/\s+/g, ' ');
        if (text.trim() === '' && nodes.length === 0) { node.textContent = ''; continue; }
        nodes.push({ node, text });
        node.textContent = '';
    }
    return { element, nodes };
}

function typeInto(job, speed) {
    return new Promise(resolve => {
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        let n = 0, i = 0;

        const step = () => {
            if (n >= job.nodes.length) {
                cursor.remove();
                job.element.style.minHeight = '';
                return resolve();
            }
            const { node, text } = job.nodes[n];
            if (i === 0) node.parentNode.insertBefore(cursor, node.nextSibling);
            node.textContent = text.slice(0, i + 1);
            i++;
            if (i >= text.length) { n++; i = 0; }
            setTimeout(step, speed);
        };
        step();
    });
}

const speedFor = el => (el.textContent.length > 60 ? 12 : 40);

if (!reduceMotion) {
    const groups = introGroups
        .map(selectors => selectors
            .flatMap(selector => [...document.querySelectorAll(selector)])
            .map(prepareTyping)
            .filter(Boolean))
        .filter(jobs => jobs.length);

    (async () => {
        for (const jobs of groups) {
            await Promise.all(jobs.map(job => typeInto(job, speedFor(job.element))));
            await new Promise(r => setTimeout(r, 120));
        }
    })();

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            const job = prepareTyping(entry.target);
            if (job) typeInto(job, 35);
        });
    }, { threshold: 0.6 });

    document.querySelectorAll('.section-title, .subsection-title, .cert-block > h3').forEach(el => {
        if (el.dataset.typed) return;
        el.style.visibility = 'hidden';
        observer.observe(el);
    });
}

// Menu mobile repliable. Sans JavaScript, le menu reste simplement déplié.
const nav = document.querySelector('.glass-nav');
if (nav) {
    const list = nav.querySelector('ul');
    list.id = 'site-menu';
    nav.querySelectorAll('a.active').forEach(a => a.setAttribute('aria-current', 'page'));

    const toggle = document.createElement('button');
    toggle.className = 'menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'site-menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i><span class="sr-only">' +
        (isEnglish ? 'Menu' : 'Menu') + '</span>';
    nav.insertBefore(toggle, list);
    document.documentElement.classList.add('js');

    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && nav.classList.contains('open')) {
            nav.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus();
        }
    });
}

// Visionneuse de certificats : ouvrable à la souris et au clavier, fermée par Échap,
// le focus revient sur l'image d'origine.
const certImages = document.querySelectorAll('.clickable-cert img');
certImages.forEach(img => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', (isEnglish ? 'Enlarge: ' : 'Agrandir : ') + img.alt);

    const open = () => {
        const modal = document.createElement('div');
        modal.className = 'lightbox';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', img.alt);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'lightbox-close';
        closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i><span class="sr-only">' +
            (isEnglish ? 'Close' : 'Fermer') + '</span>';

        const zoomed = document.createElement('img');
        zoomed.src = img.src;
        zoomed.alt = img.alt;

        modal.append(closeBtn, zoomed);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        closeBtn.focus();

        const close = () => {
            modal.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
            img.focus();
        };
        const onKey = e => {
            if (e.key === 'Escape') close();
            if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
        };
        modal.addEventListener('click', e => { if (e.target !== zoomed) close(); });
        document.addEventListener('keydown', onKey);
    };

    img.addEventListener('click', open);
    img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
});

// Vidéos : muettes au départ (seule la lecture muette est autorisée sans clic),
// lues seulement quand elles sont à l'écran, et un bouton pour activer le son.
// Une seule vidéo sonore à la fois.
const videos = document.querySelectorAll('.media-video video');
const soundOff = isEnglish ? 'Turn sound off' : 'Couper le son';

function setSound(figure, on) {
    const video = figure.querySelector('video');
    const button = figure.querySelector('.sound-toggle');
    video.muted = !on;
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('i').className = 'fas ' + (on ? 'fa-volume-high' : 'fa-volume-xmark');
    button.querySelector('span').textContent = on ? soundOff : button.dataset.on;
}

videos.forEach(video => {
    const figure = video.closest('.media-video');
    const button = figure.querySelector('.sound-toggle');
    button.setAttribute('aria-pressed', 'false');
    if (reduceMotion) video.controls = true;

    button.addEventListener('click', () => {
        const on = video.muted;
        if (on) {
            document.querySelectorAll('.media-video').forEach(other => {
                if (other !== figure) setSound(other, false);
            });
            video.play().catch(() => {});
        }
        setSound(figure, on);
    });
});

if (!reduceMotion && videos.length) {
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.4 });
    videos.forEach(video => videoObserver.observe(video));
}
