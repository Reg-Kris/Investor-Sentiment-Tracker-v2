/**
 * Particle System Module
 * Handles particle animations and management using anime.js
 */
import anime from 'animejs';

export class ParticleSystem {
  private particles: HTMLElement[] = [];
  private isAnimating: boolean = false;

  constructor(particles: HTMLElement[]) {
    this.particles = particles;
  }

  public startContinuousAnimation(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animateParticles();
  }

  private animateParticles(): void {
    this.particles.forEach((particle, index) => {
      const delay = index * 200;

      anime({
        targets: particle,
        translateY: [
          {
            value: Math.random() * -50 - 10,
            duration: 2000 + Math.random() * 1000,
          },
          {
            value: Math.random() * 50 + 10,
            duration: 2000 + Math.random() * 1000,
          },
        ],
        translateX: [
          {
            value: Math.random() * -30 - 10,
            duration: 3000 + Math.random() * 1000,
          },
          {
            value: Math.random() * 30 + 10,
            duration: 3000 + Math.random() * 1000,
          },
        ],
        opacity: [
          { value: Math.random() * 0.8 + 0.2, duration: 1000 },
          { value: Math.random() * 0.3 + 0.1, duration: 1000 },
        ],
        scale: [
          { value: Math.random() * 0.5 + 0.5, duration: 1500 },
          { value: Math.random() * 1.5 + 0.5, duration: 1500 },
        ],
        delay: delay,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine',
      });
    });
  }

  public animateHoverIntensity(): void {
    this.particles.forEach((particle, index) => {
      anime({
        targets: particle,
        scale: Math.random() * 2 + 1,
        opacity: Math.random() * 1 + 0.5,
        duration: 800,
        delay: index * 50,
        easing: 'easeOutElastic(1, .8)',
      });
    });
  }

  public animateHoverNormal(): void {
    this.particles.forEach((particle) => {
      anime({
        targets: particle,
        scale: 1,
        opacity: Math.random() * 0.6 + 0.2,
        duration: 1000,
        easing: 'easeOutQuart',
      });
    });
  }

  public animateCelebration(celebrationContainer: HTMLElement): void {
    const confettiElements = celebrationContainer.children;

    for (let i = 0; i < confettiElements.length; i++) {
      const confetti = confettiElements[i] as HTMLElement;

      anime({
        targets: confetti,
        translateX: (Math.random() - 0.5) * 400,
        translateY: (Math.random() - 0.5) * 400,
        rotate: Math.random() * 720,
        opacity: [1, 0],
        duration: 2000,
        easing: 'easeOutCubic',
        complete: () => confetti.remove(),
      });
    }
  }

  public updateParticleColors(_color: string): void {
    // Note: This will be handled by GSAP in the animations module
    // This method exists for interface consistency
  }

  public stopAnimations(): void {
    anime.remove(this.particles);
    this.isAnimating = false;
  }

  public destroy(): void {
    this.stopAnimations();
    this.particles = [];
  }

  public getParticles(): HTMLElement[] {
    return this.particles;
  }

  public isRunning(): boolean {
    return this.isAnimating;
  }
}
