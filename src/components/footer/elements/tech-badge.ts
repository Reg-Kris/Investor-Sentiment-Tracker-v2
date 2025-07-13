import { gsap } from 'gsap';

export class TechBadge {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setupInteractions(): void {
    const techItems = this.container.querySelectorAll('.tech-item');
    techItems.forEach((item) => {
      item.addEventListener('click', () => {
        gsap.to(item, {
          scale: 0.95,
          duration: 0.1,
          onComplete: () => {
            gsap.to(item, {
              scale: 1,
              duration: 0.2,
              ease: 'back.out(2)',
            });
          },
        });
      });
    });
  }

  animateIn(): void {
    gsap.fromTo(
      '.footer-tech-info',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
    );
  }
}
