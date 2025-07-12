import anime from 'animejs';
import { gsap } from 'gsap';

export class EnhancedHero {
  private container: HTMLElement;
  private particles: HTMLElement[] = [];
  private animationFrame: number = 0;
  private isVisible: boolean = false;
  private observer: IntersectionObserver | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Hero container with id "${containerId}" not found`);
    }
    this.container = container;
    this.init();
  }

  private init(): void {
    this.createParticleBackground();
    this.createFloatingElements();
    this.setupIntersectionObserver();
    this.setupHoverEffects();
    this.startAnimations();
  }

  private createParticleBackground(): void {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    `;

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: rgba(59, 130, 246, ${Math.random() * 0.6 + 0.2});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: 0;
      `;
      
      this.particles.push(particle);
      particleContainer.appendChild(particle);
    }

    this.container.appendChild(particleContainer);
  }

  private createFloatingElements(): void {
    // Add floating geometric shapes
    const shapes = ['circle', 'triangle', 'square'];
    shapes.forEach((shape, index) => {
      const element = document.createElement('div');
      element.className = `floating-${shape}`;
      element.style.cssText = `
        position: absolute;
        ${shape === 'circle' ? 'border-radius: 50%;' : ''}
        ${shape === 'triangle' ? 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);' : ''}
        background: linear-gradient(135deg, 
          rgba(139, 92, 246, 0.1), 
          rgba(59, 130, 246, 0.1)
        );
        width: ${30 + index * 10}px;
        height: ${30 + index * 10}px;
        opacity: 0;
        pointer-events: none;
        z-index: 2;
      `;
      this.container.appendChild(element);
    });
  }

  private setupIntersectionObserver(): void {
    // Use native Intersection Observer API instead of polyfill
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
      // Fallback for older browsers
      this.isVisible = true;
      this.animateIn();
    }
  }

  private setupHoverEffects(): void {
    const heroWrapper = this.container.querySelector('.sentiment-cluster-wrapper') as HTMLElement;
    if (!heroWrapper) return;

    heroWrapper.addEventListener('mouseenter', () => {
      this.animateHoverIn();
    });

    heroWrapper.addEventListener('mouseleave', () => {
      this.animateHoverOut();
    });

    // Touch events for mobile
    heroWrapper.addEventListener('touchstart', () => {
      this.animateHoverIn();
    });

    heroWrapper.addEventListener('touchend', () => {
      setTimeout(() => this.animateHoverOut(), 2000);
    });
  }

  private startAnimations(): void {
    // Continuous particle animation
    const animateParticles = () => {
      this.particles.forEach((particle, index) => {
        const delay = index * 200;
        
        anime({
          targets: particle,
          translateY: [
            { value: Math.random() * -50 - 10, duration: 2000 + Math.random() * 1000 },
            { value: Math.random() * 50 + 10, duration: 2000 + Math.random() * 1000 }
          ],
          translateX: [
            { value: Math.random() * -30 - 10, duration: 3000 + Math.random() * 1000 },
            { value: Math.random() * 30 + 10, duration: 3000 + Math.random() * 1000 }
          ],
          opacity: [
            { value: Math.random() * 0.8 + 0.2, duration: 1000 },
            { value: Math.random() * 0.3 + 0.1, duration: 1000 }
          ],
          scale: [
            { value: Math.random() * 0.5 + 0.5, duration: 1500 },
            { value: Math.random() * 1.5 + 0.5, duration: 1500 }
          ],
          delay: delay,
          loop: true,
          direction: 'alternate',
          easing: 'easeInOutSine'
        });
      });
    };

    if (this.isVisible) {
      animateParticles();
    }
  }

  private animateIn(): void {
    // Main hero entrance animation
    const timeline = gsap.timeline();
    
    // Animate the main container
    timeline.fromTo(this.container, 
      { 
        opacity: 0, 
        y: 100, 
        scale: 0.8 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 1.5, 
        ease: "power3.out" 
      }
    );

    // Animate floating shapes
    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    shapes.forEach((shape, index) => {
      timeline.fromTo(shape,
        { 
          opacity: 0, 
          y: 50, 
          rotation: -180 
        },
        { 
          opacity: 0.6, 
          y: 0, 
          rotation: 0, 
          duration: 1, 
          ease: "elastic.out(1, 0.5)" 
        },
        `-=${0.8 - index * 0.2}`
      );
    });

    // Start particle animations after main animation
    timeline.call(() => {
      this.startAnimations();
    });
  }

  private animateHoverIn(): void {
    const wrapper = this.container.querySelector('.sentiment-cluster-wrapper');
    if (!wrapper) return;

    // Enhanced hover animation with GSAP
    gsap.to(wrapper, {
      scale: 1.05,
      y: -10,
      boxShadow: '0 30px 80px rgba(59, 130, 246, 0.4)',
      duration: 0.6,
      ease: "power2.out"
    });

    // Animate particles more intensely on hover
    this.particles.forEach((particle, index) => {
      anime({
        targets: particle,
        scale: Math.random() * 2 + 1,
        opacity: Math.random() * 1 + 0.5,
        duration: 800,
        delay: index * 50,
        easing: 'easeOutElastic(1, .8)'
      });
    });

    // Add glowing effect to floating shapes
    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    shapes.forEach(shape => {
      gsap.to(shape, {
        opacity: 1,
        scale: 1.2,
        filter: 'brightness(1.5) blur(0.5px)',
        duration: 0.5,
        ease: "power2.out"
      });
    });
  }

  private animateHoverOut(): void {
    const wrapper = this.container.querySelector('.sentiment-cluster-wrapper');
    if (!wrapper) return;

    // Return to normal state
    gsap.to(wrapper, {
      scale: 1,
      y: 0,
      boxShadow: '0 25px 50px rgba(59, 130, 246, 0.25)',
      duration: 0.8,
      ease: "power2.out"
    });

    // Return particles to normal
    this.particles.forEach(particle => {
      anime({
        targets: particle,
        scale: 1,
        opacity: Math.random() * 0.6 + 0.2,
        duration: 1000,
        easing: 'easeOutQuart'
      });
    });

    // Return shapes to normal
    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    shapes.forEach(shape => {
      gsap.to(shape, {
        opacity: 0.6,
        scale: 1,
        filter: 'brightness(1) blur(0px)',
        duration: 0.8,
        ease: "power2.out"
      });
    });
  }

  public updateSentiment(sentimentValue: number): void {
    // Dynamic color changes based on sentiment
    const getColorFromSentiment = (value: number) => {
      if (value < 25) return 'rgba(239, 68, 68, 0.3)'; // Red for fear
      if (value < 45) return 'rgba(245, 158, 11, 0.3)'; // Orange for mild fear
      if (value > 75) return 'rgba(34, 197, 94, 0.3)'; // Green for greed
      if (value > 55) return 'rgba(16, 185, 129, 0.3)'; // Teal for mild greed
      return 'rgba(59, 130, 246, 0.3)'; // Blue for neutral
    };

    const sentimentColor = getColorFromSentiment(sentimentValue);
    
    // Update particle colors
    this.particles.forEach(particle => {
      gsap.to(particle, {
        backgroundColor: sentimentColor,
        duration: 2,
        ease: "power2.inOut"
      });
    });

    // Update background gradient
    const backgroundElement = document.querySelector('.background-gradient') as HTMLElement;
    if (backgroundElement) {
      backgroundElement.className = `background-gradient ${this.getSentimentClass(sentimentValue)}`;
    }
  }

  private getSentimentClass(value: number): string {
    if (value < 25) return 'extreme-fear';
    if (value < 45) return 'fear';
    if (value > 75) return 'extreme-greed';
    if (value > 55) return 'greed';
    return '';
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Clean up anime.js animations
    anime.remove(this.particles);
    
    // Clean up GSAP animations
    gsap.killTweensOf([this.container, ...this.particles]);
  }

  // Public method to trigger celebration animation
  public celebrate(): void {
    // Create temporary celebration particles
    const celebrationContainer = document.createElement('div');
    celebrationContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: ${['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]};
        left: 50%;
        top: 50%;
        border-radius: 50%;
      `;
      celebrationContainer.appendChild(confetti);

      // Animate confetti
      anime({
        targets: confetti,
        translateX: (Math.random() - 0.5) * 400,
        translateY: (Math.random() - 0.5) * 400,
        rotate: Math.random() * 720,
        opacity: [1, 0],
        duration: 2000,
        easing: 'easeOutCubic',
        complete: () => confetti.remove()
      });
    }

    this.container.appendChild(celebrationContainer);
    
    // Remove celebration container after animation
    setTimeout(() => {
      if (celebrationContainer.parentNode) {
        celebrationContainer.remove();
      }
    }, 2000);
  }
}