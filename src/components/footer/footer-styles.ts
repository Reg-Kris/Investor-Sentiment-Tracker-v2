export class FooterStyles {
  static inject(): void {
    const style = document.createElement('style');
    style.textContent = `
      .footer-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 1;
      }

      .footer-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.05) 0%,
          rgba(139, 92, 246, 0.05) 50%,
          rgba(6, 214, 160, 0.05) 100%
        );
        opacity: 0;
        transition: opacity 2s ease;
      }

      .footer-background.visible .footer-gradient {
        opacity: 1;
      }

      .floating-elements-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .footer-content {
        position: relative;
        z-index: 2;
      }

      .footer-social {
        margin: 2rem 0;
        opacity: 0;
        transform: translateY(20px);
      }

      .social-links {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
      }

      .social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .social-link::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
      }

      .social-link:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
      }

      .social-link:hover::before {
        left: 100%;
      }

      .footer-tech-info {
        margin-top: 2rem;
        opacity: 0;
        transform: translateY(20px);
      }

      .tech-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 1rem 2rem;
        backdrop-filter: blur(10px);
        max-width: 300px;
        margin: 0 auto;
      }

      .tech-label {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      .tech-stack {
        display: flex;
        gap: 1rem;
      }

      .tech-item {
        font-size: 0.75rem;
        color: var(--accent-primary);
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-weight: 500;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .tech-item:hover {
        background: rgba(59, 130, 246, 0.2);
        transform: translateY(-2px);
      }

      .floating-element {
        position: absolute;
        pointer-events: none;
        opacity: 0.1;
      }

      .floating-code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--accent-primary);
        white-space: nowrap;
      }

      .floating-icon {
        width: 20px;
        height: 20px;
        opacity: 0.2;
      }

      @media (max-width: 768px) {
        .social-links {
          gap: 1rem;
        }
        
        .social-link {
          width: 40px;
          height: 40px;
        }
        
        .tech-badge {
          padding: 0.75rem 1.5rem;
        }
        
        .tech-stack {
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}