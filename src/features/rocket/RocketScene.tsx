import type { RocketSceneProps } from './types';
import './rocket.css';

/** Member 3: replace this static illustration with the 3D renderer; keep this fallback. */
export function RocketScene({ className = '' }: RocketSceneProps) {
  return <div className={`rocket-scene ${className}`}>
    <div className="orbit-ring orbit-ring--one" aria-hidden="true" /><div className="orbit-ring orbit-ring--two" aria-hidden="true" />
    <svg className="rocket-illustration" viewBox="0 0 360 550" role="img" aria-label="Illustration of a rocket pointed toward the stars">
      <defs>
        <linearGradient id="hull" x1="0" x2="1"><stop stopColor="#66829c"/><stop offset=".35" stopColor="#fff"/><stop offset=".6" stopColor="#dfebf4"/><stop offset="1" stopColor="#7898b3"/></linearGradient>
        <linearGradient id="nose" x1="0" x2="1"><stop stopColor="#34506d"/><stop offset=".5" stopColor="#b5cee0"/><stop offset="1" stopColor="#34506d"/></linearGradient>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff"/><stop offset=".3" stopColor="#b9ddff" stopOpacity=".8"/><stop offset="1" stopColor="#7dadde" stopOpacity="0"/></linearGradient>
      </defs>
      <path d="M159 389q21 114 42 0Z" fill="url(#flame)"/>
      <path d="m151 290-38 55-7 66 45-24zm58 0 38 55 7 66-45-24z" fill="url(#nose)" stroke="#b9d1e5" strokeWidth="1"/>
      <path d="M150 143q0-63 30-106 30 43 30 106v236q-30 14-60 0Z" fill="url(#hull)"/>
      <path d="M150 143q0-63 30-106 30 43 30 106Z" fill="url(#nose)"/>
      <path d="M150 167h60M150 321h60" stroke="#34506d" strokeWidth="5"/>
      <path d="M157 383h46l-5 17h-36z" fill="#34506d" stroke="#adc9de"/>
      <circle cx="180" cy="205" r="15" fill="#102437" stroke="#7695ae" strokeWidth="4"/><circle cx="177" cy="201" r="6" fill="#d8edff" opacity=".5"/>
      <path d="m179 339-5 42 6 36 6-36-5-42z" fill="#34506d"/>
      <text x="181" y="258" transform="rotate(90 181 258)" fill="#34506d" fontFamily="monospace" fontSize="10" letterSpacing="3">AEROVATE</text>
      <path d="M155 180v130" stroke="#fff" strokeWidth="2" opacity=".65"/>
    </svg>
    <span className="scene-note scene-note--top">THE NEXT FRONTIER <span>↗</span></span>
    <span className="scene-note scene-note--bottom">CONCEPT ILLUSTRATION</span>
  </div>;
}
