import { gsap } from 'gsap';
import { CardData } from '../types';
import { StyleManager } from '../style-manager';

export class AnimationEffects {
  animateCardEntrance(card: HTMLElement): void {
    gsap.fromTo(card, 
      { 
        opacity: 0, 
        y: 50, 
        scale: 0.9,
        rotationX: -15 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotationX: 0,
        duration: 1.2, 
        ease: "back.out(1.7)" 
      }
    );
  }

  animateValueCounting(valueElement: HTMLElement, data: CardData): void {
    const targetValue = parseFloat(String(data.value).replace(/[^0-9.-]/g, ''));
    if (isNaN(targetValue)) return;

    gsap.fromTo({ value: 0 }, 
      { value: targetValue },
      {
        duration: 2,
        ease: "power2.out",
        onUpdate: function() {
          const currentValue = this.targets()[0].value;
          valueElement.textContent = typeof data.value === 'string' 
            ? String(data.value).replace(/[\d.-]+/, currentValue.toFixed(2))
            : currentValue.toFixed(2);
        }
      }
    );
  }

  animateMessageReveal(message: HTMLElement): void {
    gsap.fromTo(message,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: "power2.out" }
    );
  }

  animateTrendLine(trendLine: HTMLElement, trend?: string): void {
    const color = StyleManager.getTrendColor(trend);
    trendLine.style.background = color;

    gsap.fromTo(trendLine,
      { width: '0%', opacity: 0 },
      { 
        width: '100%', 
        opacity: 1, 
        duration: 1.5, 
        delay: 0.8,
        ease: "power2.out" 
      }
    );
  }

  animateHover(card: HTMLElement, gauge?: HTMLElement, value?: HTMLElement): void {
    gsap.to(card, {
      y: -8,
      scale: 1.02,
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
      duration: 0.4,
      ease: "power2.out"
    });

    if (gauge) {
      gsap.to(gauge, {
        rotation: 360,
        scale: 1.1,
        duration: 0.6,
        ease: "power2.out"
      });
    }

    if (value) {
      gsap.to(value, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }

  animateHoverOut(card: HTMLElement, gauge?: HTMLElement, value?: HTMLElement): void {
    gsap.to(card, {
      y: 0,
      scale: 1,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      duration: 0.6,
      ease: "power2.out"
    });

    if (gauge) {
      gsap.to(gauge, {
        rotation: 0,
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)"
      });
    }

    if (value) {
      gsap.to(value, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }

  animateClick(card: HTMLElement): void {
    gsap.to(card, {
      scale: 0.98,
      duration: 0.1,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(card, {
          scale: 1.02,
          duration: 0.2,
          ease: "back.out(2)"
        });
      }
    });
  }

  animateValueUpdate(valueElement: HTMLElement, newValue: string | number): void {
    gsap.to(valueElement, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        valueElement.textContent = String(newValue);
        gsap.to(valueElement, {
          scale: 1,
          duration: 0.3,
          ease: "back.out(2)"
        });
      }
    });
  }

  animateMessageUpdate(messageElement: HTMLElement, newMessage: string): void {
    gsap.to(messageElement, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        messageElement.textContent = newMessage;
        gsap.to(messageElement, {
          opacity: 1,
          duration: 0.3
        });
      }
    });
  }

  animatePulse(card: HTMLElement): void {
    gsap.to(card, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  }

  destroy(elements: HTMLElement[]): void {
    gsap.killTweensOf(elements);
  }
}