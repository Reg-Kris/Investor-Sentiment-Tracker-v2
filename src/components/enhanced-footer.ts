import anime from 'animejs';
import { gsap } from 'gsap';

export class EnhancedFooter {
  private container: HTMLElement;
  private floatingIcons: HTMLElement[] = [];
  private observer: IntersectionObserver | null = null;
  private isVisible: boolean = false;

  constructor() {
    const footer = document.querySelector('.footer') as HTMLElement;
    if (!footer) {
      throw new Error('Footer element not found');
    }
    this.container = footer;
    this.init();
  }

  private init(): void {
    this.enhanceFooterStructure();
    this.createFloatingElements();
    this.setupScrollAnimations();
    this.setupIntersectionObserver();
    this.addInteractiveElements();
  }

  private enhanceFooterStructure(): void {
    // Wrap existing content in enhanced structure
    const existingContent = this.container.innerHTML;
    
    this.container.innerHTML = `
      <div class="footer-background">
        <div class="footer-gradient"></div>
        <div class="floating-elements-container"></div>
      </div>
      
      <div class="footer-content">
        <div class="footer-main">
          ${existingContent}
        </div>
        
        <div class="footer-social">
          <div class="social-links">
            <a href="#" class="social-link" data-platform="twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" class="social-link" data-platform="github">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" class="social-link" data-platform="linkedin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div class="footer-tech-info">
          <div class="tech-badge">
            <span class="tech-label">Powered by</span>
            <div class="tech-stack">
              <span class="tech-item">TypeScript</span>
              <span class="tech-item">Vite</span>
              <span class="tech-item">GSAP</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add enhanced styling
    this.addEnhancedStyles();
  }

  private addEnhancedStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .footer-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 1;
      }

      .footer-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.05) 0%,
          rgba(139, 92, 246, 0.05) 50%,
          rgba(6, 214, 160, 0.05) 100%
        );
        opacity: 0;
        transition: opacity 2s ease;
      }

      .footer-background.visible .footer-gradient {
        opacity: 1;
      }

      .floating-elements-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .footer-content {
        position: relative;
        z-index: 2;
      }

      .footer-social {
        margin: 2rem 0;
        opacity: 0;
        transform: translateY(20px);
      }

      .social-links {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
      }

      .social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .social-link::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
      }

      .social-link:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
      }

      .social-link:hover::before {
        left: 100%;
      }

      .footer-tech-info {
        margin-top: 2rem;
        opacity: 0;
        transform: translateY(20px);
      }

      .tech-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 1rem 2rem;
        backdrop-filter: blur(10px);
        max-width: 300px;
        margin: 0 auto;
      }

      .tech-label {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      .tech-stack {
        display: flex;
        gap: 1rem;
      }

      .tech-item {
        font-size: 0.75rem;
        color: var(--accent-primary);
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .tech-item:hover {
        background: rgba(59, 130, 246, 0.2);
        transform: translateY(-2px);
      }

      .floating-element {
        position: absolute;
        pointer-events: none;
        opacity: 0.1;
      }

      .floating-code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--accent-primary);
        white-space: nowrap;
      }

      .floating-icon {
        width: 20px;
        height: 20px;
        opacity: 0.2;
      }

      @media (max-width: 768px) {
        .social-links {
          gap: 1rem;
        }
        
        .social-link {
          width: 40px;
          height: 40px;
        }
        
        .tech-badge {
          padding: 0.75rem 1.5rem;
        }
        
        .tech-stack {
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  private createFloatingElements(): void {
    const container = this.container.querySelector('.floating-elements-container') as HTMLElement;
    if (!container) return;

    // Code snippets that float around
    const codeSnippets = [
      'const data = await fetch()',
      'console.log("Hello World")',
      'npm install package',
      'git commit -m "feat"',
      'function analyze() {}',
      'export default class',
      'import { gsap } from "gsap"',
      '=> promise.resolve()'
    ];

    // Create floating code elements
    codeSnippets.forEach((code, _index) => {
      const element = document.createElement('div');
      element.className = 'floating-element floating-code';
      element.textContent = code;
      element.style.cssText = `
        left: ${Math.random() * 80 + 10}%;
        top: ${Math.random() * 80 + 10}%;
        opacity: 0;
      `;
      
      this.floatingIcons.push(element);
      container.appendChild(element);
    });

    // Create floating geometric shapes
    for (let i = 0; i < 6; i++) {
      const shape = document.createElement('div');
      shape.className = 'floating-element floating-icon';
      shape.style.cssText = `
        width: ${15 + Math.random() * 10}px;
        height: ${15 + Math.random() * 10}px;
        background: rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, 0.1);
        border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
        left: ${Math.random() * 90 + 5}%;
        top: ${Math.random() * 90 + 5}%;
        opacity: 0;
      `;
      
      this.floatingIcons.push(shape);
      container.appendChild(shape);
    }
  }

  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.isVisible) {
              this.isVisible = true;
              this.animateIn();
            }
          });
        },
        { threshold: 0.1 }
      );
      
      this.observer.observe(this.container);
    } else {
      this.isVisible = true;
      this.animateIn();
    }
  }

  private animateIn(): void {
    // Add visible class for gradient
    const background = this.container.querySelector('.footer-background') as HTMLElement;
    if (background) {
      background.classList.add('visible');
    }

    // Animate main content
    const timeline = gsap.timeline();
    
    timeline.fromTo('.footer-main',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
    );

    timeline.fromTo('.footer-social',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      '-=0.5'
    );

    timeline.fromTo('.footer-tech-info',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      '-=0.3'
    );

    // Animate social links with stagger
    gsap.fromTo('.social-link',
      { scale: 0, rotation: -180 },
      { 
        scale: 1, 
        rotation: 0, 
        duration: 0.6, 
        stagger: 0.1, 
        ease: "back.out(1.7)",
        delay: 0.5
      }
    );

    // Animate floating elements
    this.startFloatingAnimations();
  }

  private startFloatingAnimations(): void {
    this.floatingIcons.forEach((element, index) => {
      const delay = index * 200;
      
      // Initial fade in
      gsap.to(element, {
        opacity: 0.3,
        delay: delay / 1000,
        duration: 1,
        ease: "power2.out"
      });

      // Continuous floating animation
      anime({
        targets: element,
        translateX: [
          { value: Math.random() * 40 - 20, duration: 4000 + Math.random() * 2000 },
          { value: Math.random() * 40 - 20, duration: 4000 + Math.random() * 2000 }
        ],
        translateY: [
          { value: Math.random() * 30 - 15, duration: 5000 + Math.random() * 2000 },
          { value: Math.random() * 30 - 15, duration: 5000 + Math.random() * 2000 }
        ],
        opacity: [
          { value: Math.random() * 0.4 + 0.1, duration: 3000 },
          { value: Math.random() * 0.2 + 0.05, duration: 3000 }
        ],
        delay: delay,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    });
  }

  private setupScrollAnimations(): void {
    // Parallax effect for footer background
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = this.container.querySelector('.footer-gradient') as HTMLElement;
      
      if (parallax) {
        const speed = scrolled * 0.1;
        parallax.style.transform = `translateY(${speed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  private addInteractiveElements(): void {
    // Add hover effects to social links
    const socialLinks = this.container.querySelectorAll('.social-link');
    
    socialLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        gsap.to(link, {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        });

        // Create ripple effect on hover
        this.createSocialRipple(link as HTMLElement);
      });

      link.addEventListener('mouseleave', () => {
        gsap.to(link, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });

    // Add click animation to tech items
    const techItems = this.container.querySelectorAll('.tech-item');
    techItems.forEach(item => {
      item.addEventListener('click', () => {
        gsap.to(item, {
          scale: 0.95,
          duration: 0.1,
          onComplete: () => {
            gsap.to(item, {
              scale: 1,
              duration: 0.2,
              ease: "back.out(2)"
            });
          }
        });
      });
    });
  }

  private createSocialRipple(element: HTMLElement): void {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1;
    `;

    element.appendChild(ripple);

    gsap.to(ripple, {
      width: 60,
      height: 60,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });
  }

  public updateLastUpdated(timestamp: string): void {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
      // Animate the update
      gsap.to(lastUpdateElement, {
        scale: 1.1,
        color: '#3b82f6',
        duration: 0.3,
        onComplete: () => {
          lastUpdateElement.textContent = timestamp;
          gsap.to(lastUpdateElement, {
            scale: 1,
            color: 'inherit',
            duration: 0.3,
            delay: 0.5
          });
        }
      });
    }
  }

  public celebrateUpdate(): void {
    // Create celebration particles
    const container = this.container.querySelector('.floating-elements-container') as HTMLElement;
    if (!container) return;

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: ${['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]};
        border-radius: 50%;
        left: 50%;
        top: 20%;
        pointer-events: none;
        z-index: 10;
      `;
      
      container.appendChild(particle);

      anime({
        targets: particle,
        translateX: (Math.random() - 0.5) * 300,
        translateY: Math.random() * 200 + 100,
        rotate: Math.random() * 720,
        opacity: [1, 0],
        scale: [0, 1, 0],
        duration: 2000,
        easing: 'easeOutCubic',
        complete: () => particle.remove()
      });
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Clean up animations
    anime.remove(this.floatingIcons);
    gsap.killTweensOf([this.container, ...this.floatingIcons]);
  }
}