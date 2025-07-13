/**
 * Background Effects Module
 * Handles particle background creation and floating elements
 */
export class BackgroundEffects {
  private container: HTMLElement;
  private particles: HTMLElement[] = [];
  private particleContainer: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public createParticleBackground(): HTMLElement[] {
    this.particleContainer = document.createElement('div');
    this.particleContainer.className = 'particle-container';
    this.particleContainer.style.cssText = `
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
      const particle = this.createParticle();
      this.particles.push(particle);
      this.particleContainer.appendChild(particle);
    }

    this.container.appendChild(this.particleContainer);
    return this.particles;
  }

  private createParticle(): HTMLElement {
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
    return particle;
  }

  public createFloatingElements(): void {
    const shapes = ['circle', 'triangle', 'square'];
    shapes.forEach((shape, index) => {
      const element = this.createFloatingShape(shape, index);
      this.container.appendChild(element);
    });
  }

  private createFloatingShape(shape: string, index: number): HTMLElement {
    const element = document.createElement('div');
    element.className = `floating-${shape}`;

    const shapeStyles = this.getShapeStyles(shape);
    element.style.cssText = `
      position: absolute;
      ${shapeStyles}
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

    return element;
  }

  private getShapeStyles(shape: string): string {
    switch (shape) {
      case 'circle':
        return 'border-radius: 50%;';
      case 'triangle':
        return 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);';
      case 'square':
      default:
        return '';
    }
  }

  public getParticles(): HTMLElement[] {
    return this.particles;
  }

  public getFloatingShapes(): NodeListOf<Element> {
    return this.container.querySelectorAll('[class*="floating-"]');
  }

  public updateParticleColors(color: string): void {
    this.particles.forEach((particle) => {
      particle.style.background = color;
    });
  }

  public createCelebrationParticles(): HTMLElement {
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

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 50%;
        border-radius: 50%;
      `;
      celebrationContainer.appendChild(confetti);
    }

    return celebrationContainer;
  }

  public destroy(): void {
    if (this.particleContainer && this.particleContainer.parentNode) {
      this.particleContainer.parentNode.removeChild(this.particleContainer);
    }
    this.particles = [];
  }
}
