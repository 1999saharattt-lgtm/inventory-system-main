export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @keyframes main-page-enter {
          0% {
            opacity: 0;
            transform: translate3d(0, 8px, 0) scale(0.995);
            filter: blur(2px);
          }

          55% {
            opacity: 1;
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        .main-page-transition {
          width: 100%;
          min-width: 0;
          animation:
            main-page-enter
            280ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .main-page-transition {
            animation: none !important;
            will-change: auto;
          }
        }
      `}</style>

      <div className="main-page-transition">
        {children}
      </div>
    </>
  );
}
