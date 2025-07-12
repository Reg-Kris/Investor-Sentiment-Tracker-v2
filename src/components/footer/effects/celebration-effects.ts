import anime from 'animejs';

export class CelebrationEffects {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  celebrate(): void {
    const floatingContainer = this.container.querySelector('.floating-elements-container') as HTMLElement;
    if (!floatingContainer) return;

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
      
      floatingContainer.appendChild(particle);

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
}