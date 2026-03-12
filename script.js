document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('is-active');
            navLinks.classList.remove('active');
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in classes to elements
    const elementsToAnimate = document.querySelectorAll('.service-card, .project-card, .section-title, .hero-content');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Add visible class styling dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});

// Sticky Column Headers Interaction
document.addEventListener('DOMContentLoaded', () => {
    const serviceCards = document.querySelectorAll('.service-card');

    serviceCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent default behavior if needed
            // Toggle active class on the clicked card
            // Close other cards? If we want accordion style logic:
            serviceCards.forEach(c => {
                if (c !== card) {
                    c.classList.remove('active');
                }
            });

            card.classList.toggle('active');
        });
    });
});

// Contact Form Submission & Popup Logic
var submitted = false;

function showPopup() {
    const popup = document.getElementById('confirmation-popup');
    if (popup) {
        popup.classList.add('active');
        const form = document.getElementById('contactForm');
        if (form) form.reset();
        submitted = false;
    }
}

function closePopup() {
    const popup = document.getElementById('confirmation-popup');
    if (popup) {
        popup.classList.remove('active');
    }
}


// Background Animation Code
(function() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let birds = [];

    function init() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Initialize birds
        birds = Array.from({ length: 5 }, () => ({
            x: Math.random() * width,
            y: Math.random() * (height / 2),
            speed: 0.5 + Math.random(),
            amplitude: Math.random() * 20
        }));
    }

    function drawMountain(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w / 2, y - h);
        ctx.lineTo(x + w, y);
        ctx.closePath();
        ctx.fill();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // 1. Sky Background (Pink/Purple Gradient)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#f9a8d4'); // Light pink
        skyGrad.addColorStop(1, '#a855f7'); // Purple
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Distant Mountains (Lighter)
        drawMountain(width * 0.1, height * 0.7, width * 0.4, 200, '#d8b4fe');
        drawMountain(width * 0.4, height * 0.7, width * 0.5, 250, '#c084fc');

        // 3. The Water (Animated Glow)
        const time = Date.now() * 0.002;
        const waterGlow = 180 + Math.sin(time) * 20;
        ctx.fillStyle = `rgb(236, 72, ${waterGlow})`; 
        ctx.fillRect(0, height * 0.65, width, height * 0.35);

        // 4. Foreground Slopes (Darker Purple/Indigo)
        drawMountain(-width * 0.1, height, width * 0.6, 400, '#581c87');
        drawMountain(width * 0.5, height, width * 0.7, 450, '#3b0764');

        // 5. Animated Birds
        ctx.fillStyle = '#000';
        birds.forEach(bird => {
            bird.x += bird.speed;
            const birdY = bird.y + Math.sin(bird.x * 0.02) * 5;
            if (bird.x > width) bird.x = -10;
            ctx.fillRect(bird.x, birdY, 3, 2);
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();
})();
