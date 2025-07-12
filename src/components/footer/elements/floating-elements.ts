import anime from 'animejs';
import { gsap } from 'gsap';

export class FloatingElements {
  private floatingIcons: HTMLElement[] = [];
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  create(): void {
    const floatingContainer = this.container.querySelector('.floating-elements-container') as HTMLElement;
    if (!floatingContainer) return;

    this.createCodeSnippets(floatingContainer);
    this.createGeometricShapes(floatingContainer);
  }

  private createCodeSnippets(container: HTMLElement): void {
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

    codeSnippets.forEach((code) => {
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
  }

  private createGeometricShapes(container: HTMLElement): void {
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

  startAnimations(): void {
    this.floatingIcons.forEach((element, index) => {
      const delay = index * 200;
      
      gsap.to(element, {
        opacity: 0.3,
        delay: delay / 1000,
        duration: 1,
        ease: "power2.out"
      });

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

  destroy(): void {
    anime.remove(this.floatingIcons);
    gsap.killTweensOf(this.floatingIcons);
  }

  getElements(): HTMLElement[] {
    return this.floatingIcons;
  }
}