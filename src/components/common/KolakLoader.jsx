import React from 'react'

const LETTERS = ['K', 'O', 'L', 'A', 'K']

/**
 * <KolakLoader />                 -> inline, sits in a card/section while content loads
 * <KolakLoader fullscreen />      -> covers the viewport, use for route/page transitions
 * <KolakLoader size="sm|md|lg" />
 */
export const KolakLoader = ({ fullscreen = false, size = 'md', label = 'Loading' }) => {
  const dims = {
    sm: { letter: 'text-2xl', gap: 'gap-1', pulseW: 140, pulseH: 32 },
    md: { letter: 'text-4xl', gap: 'gap-1.5', pulseW: 200, pulseH: 44 },
    lg: { letter: 'text-6xl', gap: 'gap-2', pulseW: 280, pulseH: 56 },
  }[size] || { letter: 'text-4xl', gap: 'gap-1.5', pulseW: 200, pulseH: 44 }

  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className={`flex ${dims.gap}`}>
        {LETTERS.map((ch, i) => (
          <span
            key={i}
            className={`kolak-letter font-bold text-primary ${dims.letter}`}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            {ch}
          </span>
        ))}
      </div>

      <svg
        width={dims.pulseW}
        height={dims.pulseH}
        viewBox={`0 0 ${dims.pulseW} ${dims.pulseH}`}
        fill="none"
        className="mt-2"
      >
        <path
          d={`M0 ${dims.pulseH / 2}
              H${dims.pulseW * 0.28}
              L${dims.pulseW * 0.35} ${dims.pulseH * 0.15}
              L${dims.pulseW * 0.44} ${dims.pulseH * 0.9}
              L${dims.pulseW * 0.52} ${dims.pulseH / 2}
              H${dims.pulseW}`}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="kolak-pulse-line text-primary"
        />
      </svg>

      {/* <span className="mt-2 text-xs text-base-content/60 kolak-dots">{label}</span> */}

      <style>{`
        @keyframes kolakFade {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
        .kolak-letter {
          display: inline-block;
          animation: kolakFade 1.1s ease-in-out infinite;
        }

        @keyframes kolakDash {
          0% { stroke-dashoffset: 300; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -300; }
        }
        .kolak-pulse-line {
          stroke-dasharray: 300;
          animation: kolakDash 1.8s ease-in-out infinite;
        }

        @keyframes kolakDots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
        .kolak-dots::after {
          content: '';
          animation: kolakDots 1.4s steps(1) infinite;
        }
      `}</style>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-100">
        {content}
      </div>
    )
  }

  return <div className="py-10">{content}</div>
}

export default KolakLoader