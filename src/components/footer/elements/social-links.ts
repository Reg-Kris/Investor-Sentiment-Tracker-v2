import { gsap } from 'gsap';

export class SocialLinks {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setupInteractions(): void {
    const socialLinks = this.container.querySelectorAll('.social-link');
    
    socialLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        gsap.to(link, {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        });

        this.createRippleEffect(link as HTMLElement);
      });

      link.addEventListener('mouseleave', () => {
        gsap.to(link, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }

  private createRippleEffect(element: HTMLElement): void {
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

  animateIn(): void {
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
  }
}