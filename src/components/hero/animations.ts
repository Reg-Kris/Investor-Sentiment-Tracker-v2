/**
 * Animations Module
 * Handles GSAP animations for hero elements and effects
 */
import { gsap } from 'gsap';

export class HeroAnimations {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public animateIn(): gsap.core.Timeline {
    const timeline = gsap.timeline();

    // Animate the main container
    timeline.fromTo(
      this.container,
      {
        opacity: 0,
        y: 100,
        scale: 0.8,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: 'power3.out',
      },
    );

    // Animate floating shapes
    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    shapes.forEach((shape, index) => {
      timeline.fromTo(
        shape,
        {
          opacity: 0,
          y: 50,
          rotation: -180,
        },
        {
          opacity: 0.6,
          y: 0,
          rotation: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
        },
        `-=${0.8 - index * 0.2}`,
      );
    });

    return timeline;
  }

  public animateHoverIn(): void {
    const wrapper = this.container.querySelector('.sentiment-cluster-wrapper');
    if (!wrapper) return;

    // Enhanced hover animation with GSAP
    gsap.to(wrapper, {
      scale: 1.05,
      y: -10,
      boxShadow: '0 30px 80px rgba(59, 130, 246, 0.4)',
      duration: 0.6,
      ease: 'power2.out',
    });

    // Add glowing effect to floating shapes
    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    shapes.forEach((shape) => {
      gsap.to(shape, {
        opacity: 1,
        scale: 1.2,
        filter: 'brightness(1.5) blur(0.5px)',
        duration: 0.5,
        ease: 'power2.out',
      });
    });
  }

  public animateHoverOut(): void {
    const wrapper = this.container.querySelector('.sentiment-cluster-wrapper');
    if (!wrapper) return;

    // Return to normal state
    gsap.to(wrapper, {
      scale: 1,
      y: 0,
      boxShadow: '0 25px 50px rgba(59, 130, 246, 0.25)',
      duration: 0.8,
      ease: 'power2.out',
    });

    // Return shapes to normal
    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    shapes.forEach((shape) => {
      gsap.to(shape, {
        opacity: 0.6,
        scale: 1,
        filter: 'brightness(1) blur(0px)',
        duration: 0.8,
        ease: 'power2.out',
      });
    });
  }

  public updateParticleColors(
    particles: HTMLElement[],
    sentimentColor: string,
  ): void {
    particles.forEach((particle) => {
      gsap.to(particle, {
        backgroundColor: sentimentColor,
        duration: 2,
        ease: 'power2.inOut',
      });
    });
  }

  public updateBackgroundGradient(sentimentValue: number): void {
    const backgroundElement = document.querySelector(
      '.background-gradient',
    ) as HTMLElement;
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

  public getColorFromSentiment(value: number): string {
    if (value < 25) return 'rgba(239, 68, 68, 0.3)'; // Red for fear
    if (value < 45) return 'rgba(245, 158, 11, 0.3)'; // Orange for mild fear
    if (value > 75) return 'rgba(34, 197, 94, 0.3)'; // Green for greed
    if (value > 55) return 'rgba(16, 185, 129, 0.3)'; // Teal for mild greed
    return 'rgba(59, 130, 246, 0.3)'; // Blue for neutral
  }

  public killAllAnimations(): void {
    gsap.killTweensOf(this.container);

    const shapes = this.container.querySelectorAll('[class*="floating-"]');
    gsap.killTweensOf(Array.from(shapes));

    const wrapper = this.container.querySelector('.sentiment-cluster-wrapper');
    if (wrapper) {
      gsap.killTweensOf(wrapper);
    }
  }

  public destroy(): void {
    this.killAllAnimations();
  }
}
