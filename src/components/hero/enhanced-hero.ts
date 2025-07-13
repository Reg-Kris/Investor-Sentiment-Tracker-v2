/**
 * Enhanced Hero Module
 * Main orchestrator for hero functionality using modular components
 */
import { BackgroundEffects } from './background-effects';
import { ParticleSystem } from './particle-system';
import { HeroAnimations } from './animations';

export class EnhancedHero {
  private container: HTMLElement;
  private backgroundEffects: BackgroundEffects;
  private particleSystem!: ParticleSystem;
  private animations: HeroAnimations;
  private observer: IntersectionObserver | null = null;
  private isVisible: boolean = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Hero container with id "${containerId}" not found`);
    }
    this.container = container;

    // Initialize modules
    this.backgroundEffects = new BackgroundEffects(this.container);
    this.animations = new HeroAnimations(this.container);

    this.init();
  }

  private init(): void {
    this.createVisualElements();
    this.setupIntersectionObserver();
    this.setupHoverEffects();
  }

  private createVisualElements(): void {
    // Create background particles and floating elements
    const particles = this.backgroundEffects.createParticleBackground();
    this.backgroundEffects.createFloatingElements();

    // Initialize particle system with created particles
    this.particleSystem = new ParticleSystem(particles);
  }

  private setupIntersectionObserver(): void {
    // Use native Intersection Observer API
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.isVisible) {
              this.isVisible = true;
              this.animateIn();
            }
          });
        },
        { threshold: 0.1 },
      );

      this.observer.observe(this.container);
    } else {
      // Fallback for older browsers
      this.isVisible = true;
      this.animateIn();
    }
  }

  private setupHoverEffects(): void {
    const heroWrapper = this.container.querySelector(
      '.sentiment-cluster-wrapper',
    ) as HTMLElement;
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

  private animateIn(): void {
    const timeline = this.animations.animateIn();

    // Start particle animations after main animation
    timeline.call(() => {
      this.particleSystem.startContinuousAnimation();
    });
  }

  private animateHoverIn(): void {
    this.animations.animateHoverIn();
    this.particleSystem.animateHoverIntensity();
  }

  private animateHoverOut(): void {
    this.animations.animateHoverOut();
    this.particleSystem.animateHoverNormal();
  }

  public updateSentiment(sentimentValue: number): void {
    const sentimentColor =
      this.animations.getColorFromSentiment(sentimentValue);

    // Update particle colors using animations module
    const particles = this.particleSystem.getParticles();
    this.animations.updateParticleColors(particles, sentimentColor);

    // Update background gradient
    this.animations.updateBackgroundGradient(sentimentValue);
  }

  public celebrate(): void {
    const celebrationContainer =
      this.backgroundEffects.createCelebrationParticles();
    this.container.appendChild(celebrationContainer);

    // Animate celebration particles
    this.particleSystem.animateCelebration(celebrationContainer);

    // Remove celebration container after animation
    setTimeout(() => {
      if (celebrationContainer.parentNode) {
        celebrationContainer.remove();
      }
    }, 2000);
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Clean up all modules
    this.particleSystem.destroy();
    this.backgroundEffects.destroy();
    this.animations.destroy();
  }
}
