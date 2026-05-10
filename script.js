// Core Application State
const state = {
    scene: null,
    camera: null,
    renderer: null,
    mouse: new THREE.Vector2(),
    targetMouse: new THREE.Vector2(),
    clock: new THREE.Clock(),
    isMobile: window.innerWidth < 768,
    scrollProgress: 0
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // initThree();
    initUI();
    // animate();
});

function initThree() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // Scene Setup
    state.scene = new THREE.Scene();
    
    // Camera Setup - Perspective for depth
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    state.camera.position.z = 5;

    // Renderer Setup
    state.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Simple Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    state.scene.add(ambientLight);

    // Add Fluid Orb
    state.fluidOrb = new FluidOrb();
    state.scene.add(state.fluidOrb.mesh);

    // Initial Resize
    onWindowResize();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll);
}

function initUI() {
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
            menuToggle && menuToggle.classList.remove('is-active');
            navLinks && navLinks.classList.remove('active');
        });
    });

    // Smooth scrolling for anchor links using GSAP
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: targetId,
                    ease: "power4.inOut"
                });
            }
        });
    });

    // Contact Form & Popup (Maintain existing logic)
    window.submitted = false;

    // Reveal Animations
    initAnimations();
}

function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Fade in sections
    const sections = document.querySelectorAll('section, footer');
    sections.forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            opacity: 0,
            y: 50,
            duration: 1,
            ease: "power3.out"
        });
    });

    // Staggered cards reveal
    const cards = document.querySelectorAll('.service-card, .project-card');
    cards.forEach(card => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: "back.out(1.7)"
        });
    });
}

function onWindowResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
    state.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onScroll() {
    const h = document.documentElement, 
          b = document.body,
          st = 'scrollTop',
          sh = 'scrollHeight';
    state.scrollProgress = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = state.clock.getElapsedTime();

    // Update Fluid Orb
    if (state.fluidOrb) {
        state.fluidOrb.update(elapsedTime, state.mouse);
    }

    // Smooth Mouse Movement
    state.mouse.x += (state.targetMouse.x - state.mouse.x) * 0.05;
    state.mouse.y += (state.targetMouse.y - state.mouse.y) * 0.05;

    // Apply Subtle Parallax to Camera
    if (state.camera) {
        state.camera.position.x += (state.mouse.x * 0.5 - state.camera.position.x) * 0.05;
        state.camera.position.y += (state.mouse.y * 0.5 - state.camera.position.y) * 0.05;
        state.camera.lookAt(0, 0, 0);
    }

    state.renderer.render(state.scene, state.camera);
}

// // --- Fluid Orb Implementation ---
class FluidOrb {
    constructor() {
        // High segment count for smooth vertex displacement
        const geometry = new THREE.SphereGeometry(1.5, 128, 128);

        // Custom GLSL Shaders
        const vertexShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying float vNoise;

            // Simplex 3D Noise function (Ashima Arts)
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) {
                const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx) ;
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute( permute( permute(
                           i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                         + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                         + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                float n_ = 0.142857142857; // 1.0/7.0
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            void main() {
                vUv = uv;

                // Create noise based on position and time
                float noise = snoise(vec3(position.x * 1.5, position.y * 1.5 + uTime * 0.5, position.z * 1.5 + uTime * 0.3));
                
                // Add mouse interaction to the noise
                float mouseDist = distance(uv, uMouse * 0.5 + 0.5);
                noise += smoothstep(0.5, 0.0, mouseDist) * 0.5;
                
                vNoise = noise;

                // Displace vertices along normal
                vec3 newPosition = position + normal * (noise * 0.3);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            varying vec2 vUv;
            varying float vNoise;

            void main() {
                // Color Palette based on requested neon Purple and Blue
                vec3 color1 = vec3(0.66, 0.33, 0.97); // #A855F7 (Purple)
                vec3 color2 = vec3(0.23, 0.51, 0.96); // #3B82F6 (Blue)
                vec3 color3 = vec3(0.05, 0.05, 0.1);  // Dark Base

                // Mix colors based on UV and noise
                float mixRatio = vUv.y + vNoise * 0.5 + sin(uTime * 0.5) * 0.2;
                vec3 finalColor = mix(color1, color2, smoothstep(0.0, 1.0, mixRatio));

                // Add rim glow effect
                float rim = 1.0 - max(dot(normalize(vUv), vec2(0.5)), 0.0);
                finalColor += vec3(0.3, 0.2, 0.8) * rim * vNoise;

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2() }
            },
            transparent: true,
            wireframe: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        
        // Position orb slightly to the left behind the text, or center. Reference image has it slightly offset.
        this.mesh.position.set(0, 0, 0); 
    }

    update(time, mouse) {
        this.material.uniforms.uTime.value = time;
        // Smooth mouse influence for the shader
        this.material.uniforms.uMouse.value.lerp(mouse, 0.05);
        
        // Gentle rotation
        this.mesh.rotation.y = time * 0.1;
        this.mesh.rotation.z = time * 0.05;
    }
}

// Global scope functions for legacy HTML attributes
window.showPopup = function() {
    const popup = document.getElementById('confirmation-popup');
    if (popup) {
        popup.classList.add('active');
        const form = document.getElementById('contactForm');
        if (form) form.reset();
        window.submitted = false;
    }
};

window.closePopup = function() {
    const popup = document.getElementById('confirmation-popup');
    if (popup) popup.classList.remove('active');
};
