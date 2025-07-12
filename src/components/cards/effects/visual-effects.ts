import anime from 'animejs';
import { gsap } from 'gsap';
import { CardData } from '../types';
import { StyleManager } from '../style-manager';

export class VisualEffects {
  private morphingShapes: HTMLElement[] = [];

  createMorphingBackground(container: HTMLElement, data: CardData): HTMLElement[] {
    const background = container.querySelector('.morphing-background') as HTMLElement;
    if (!background) return [];

    background.style.cssText = StyleManager.createBackgroundStyle();

    // Create animated blob shapes
    for (let i = 0; i < 3; i++) {
      const shape = document.createElement('div');
      shape.className = `morphing-shape-${i}`;
      shape.style.cssText = StyleManager.createMorphingShapeStyle(i, data.color);
      
      this.morphingShapes.push(shape);
      background.appendChild(shape);
    }

    return this.morphingShapes;
  }

  createRippleEffect(card: HTMLElement): void {
    const ripple = document.createElement('div');
    ripple.style.cssText = StyleManager.createRippleStyle();

    card.appendChild(ripple);

    gsap.to(ripple, {
      width: 200,
      height: 200,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });
  }

  startMorphingAnimation(shapes: HTMLElement[], delay: number = 0): void {
    shapes.forEach((shape, index) => {
      const shapeDelay = delay + (index * 300);
      
      gsap.to(shape, {
        opacity: 0.6,
        delay: shapeDelay / 1000,
        duration: 1,
        ease: "power2.out"
      });

      // Continuous morphing animation
      anime({
        targets: shape,
        translateX: [
          { value: Math.random() * 100 - 50, duration: 4000 },
          { value: Math.random() * 100 - 50, duration: 4000 }
        ],
        translateY: [
          { value: Math.random() * 100 - 50, duration: 5000 },
          { value: Math.random() * 100 - 50, duration: 5000 }
        ],
        scale: [
          { value: Math.random() * 0.5 + 0.5, duration: 3000 },
          { value: Math.random() * 0.5 + 0.8, duration: 3000 }
        ],
        delay: shapeDelay,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    });
  }

  intensifyMorphingShapes(shapes: HTMLElement[]): void {
    shapes.forEach(shape => {
      gsap.to(shape, {
        opacity: 0.8,
        scale: 1.2,
        filter: 'blur(8px) brightness(1.2)',
        duration: 0.4,
        ease: "power2.out"
      });
    });
  }

  normalizeMorphingShapes(shapes: HTMLElement[]): void {
    shapes.forEach(shape => {
      gsap.to(shape, {
        opacity: 0.6,
        scale: 1,
        filter: 'blur(15px) brightness(1)',
        duration: 0.6,
        ease: "power2.out"
      });
    });
  }

  updateShapeColors(shapes: HTMLElement[], color: string): void {
    shapes.forEach(shape => {
      gsap.to(shape, {
        background: `linear-gradient(135deg, ${color}, ${color})`,
        duration: 1,
        ease: "power2.inOut"
      });
    });
  }

  getMorphingShapes(): HTMLElement[] {
    return this.morphingShapes;
  }

  destroy(): void {
    anime.remove(this.morphingShapes);
    gsap.killTweensOf(this.morphingShapes);
    this.morphingShapes = [];
  }
}