import { useRef } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BARS = [38, 62, 100, 54];

/**
 * Decorative 3D "stack of cards" built with CSS transforms only (no WebGL, no external assets).
 * It follows the pointer slightly; with prefers-reduced-motion the animation and parallax are off.
 */
export function HeroScene({ panel = false }) {
  const { t } = useTranslation();
  const ref = useRef(null);

  const onMove = (event) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--ry', `${-14 + x * 16}deg`);
    el.style.setProperty('--rx', `${8 - y * 12}deg`);
  };
  const onLeave = () => {
    ref.current?.style.removeProperty('--ry');
    ref.current?.style.removeProperty('--rx');
  };

  return (
    <div className={`scene${panel ? ' scene--panel' : ''}`} onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      <div className="scene__stack" ref={ref}>
        <div className="scene__card scene__card--back">
          <div className="scene__title" style={{ color: '#fff' }}>
            <BarChart3 aria-hidden="true" style={{ color: '#fff' }} /> {t('scene.results')}
          </div>
          <div className="scene__bars" style={{ height: 90 }}>
            {BARS.map((h, i) => (
              <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 120}ms`, background: 'rgba(255,255,255,0.55)' }} />
            ))}
          </div>
        </div>
        <div className="scene__card scene__card--mid">
          <div className="scene__title">
            <Vote aria-hidden="true" /> {t('scene.election')}
          </div>
          <div className="scene__lines">
            <div className="scene__line" style={{ width: '88%' }} />
            <div className="scene__line" style={{ width: '64%' }} />
            <div className="scene__line" style={{ width: '76%' }} />
          </div>
          <div className="scene__bars">
            {BARS.map((h, i) => (
              <i key={i} style={{ height: `${h}%`, animationDelay: `${300 + i * 140}ms` }} />
            ))}
          </div>
        </div>
        <div className="scene__card scene__card--front">
          <div className="scene__ballot">
            <ShieldCheck aria-hidden="true" />
          </div>
          <div>
            <div className="bold">{t('scene.recorded')}</div>
            <div className="muted sm">{t('scene.anonymous')}</div>
          </div>
        </div>
        <div className="scene__pill">
          <CheckCircle2 aria-hidden="true" /> {t('scene.verified')}
        </div>
      </div>
    </div>
  );
}
