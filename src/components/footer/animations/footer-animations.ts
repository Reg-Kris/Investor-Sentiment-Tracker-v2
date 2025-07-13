import { gsap } from 'gsap';

export class FooterAnimations {
  private container: HTMLElement;
  private observer: IntersectionObserver | null = null;
  private isVisible: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setupIntersectionObserver(onVisible: () => void): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.isVisible) {
              this.isVisible = true;
              onVisible();
            }
          });
        },
        { threshold: 0.1 },
      );

      this.observer.observe(this.container);
    } else {
      this.isVisible = true;
      onVisible();
    }
  }

  animateMainContent(): void {
    const background = this.container.querySelector(
      '.footer-background',
    ) as HTMLElement;
    if (background) {
      background.classList.add('visible');
    }

    const timeline = gsap.timeline();

    timeline.fromTo(
      '.footer-main',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
    );

    timeline.fromTo(
      '.footer-social',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.5',
    );

    timeline.fromTo(
      '.footer-tech-info',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.3',
    );
  }

  setupScrollAnimations(): void {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = this.container.querySelector(
        '.footer-gradient',
      ) as HTMLElement;

      if (parallax) {
        const speed = scrolled * 0.1;
        parallax.style.transform = `translateY(${speed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  updateWithAnimation(timestamp: string): void {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
      gsap.to(lastUpdateElement, {
        scale: 1.1,
        color: '#3b82f6',
        duration: 0.3,
        onComplete: () => {
          lastUpdateElement.textContent = timestamp;
          gsap.to(lastUpdateElement, {
            scale: 1,
            color: 'inherit',
            duration: 0.3,
            delay: 0.5,
          });
        },
      });
    }
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    gsap.killTweensOf(this.container);
  }
}
