import { useEffect, useRef } from 'react';
import { blueprintMotion } from './blueprintMotion';

/** Pointer-driven vector artwork; no idle animation loop. */
export function ExperienceDiagram() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => ref.current ? blueprintMotion(ref.current) : undefined, []);
  return <figure ref={ref} className="experience-blueprint">
    <div className="experience-blueprint-top"><span>Mission / AER–03</span><span>Model rocketry</span></div>
    <svg viewBox="0 0 480 340" fill="none" aria-hidden="true" className="experience-blueprint-svg">
      <defs>
        <linearGradient id="experience-body" x1="200" y1="80" x2="270" y2="290" gradientUnits="userSpaceOnUse"><stop stopColor="#bbd7ed" stopOpacity=".18" /><stop offset="1" stopColor="#34506d" stopOpacity=".06" /></linearGradient>
        <linearGradient id="experience-flame" x1="240" y1="260" x2="240" y2="322" gradientUnits="userSpaceOnUse"><stop stopColor="#ffd1a0" /><stop offset="1" stopColor="#ff9356" stopOpacity="0" /></linearGradient>
      </defs>
      <g stroke="#bbd7ed" strokeOpacity=".12">
        <circle cx="240" cy="174" r="125" /><circle cx="240" cy="174" r="90" strokeDasharray="3 8" />
        <path d="M45 174H435M240 27V320" strokeDasharray="3 7" />
        <ellipse cx="240" cy="174" rx="192" ry="64" transform="rotate(-28 240 174)" />
      </g>
      <path d="M80 302C131 260 171 177 241 133S350 73 401 36" stroke="#63d5ef" strokeOpacity=".5" strokeDasharray="4 6" />
      <path d="m389 36 13-1-4 13" stroke="#63d5ef" />
      <g className="experience-blueprint-rocket"><g transform="rotate(25 240 174)">
        <path d="M228 255Q224 280 240 319Q256 280 252 255" fill="url(#experience-flame)" />
        <path d="M212 201 183 259 212 248M268 201 297 259 268 248" fill="#34506d" fillOpacity=".5" stroke="#8fb8d6" />
        <path d="M240 48C218 81 212 111 212 139V247H268V139C268 111 262 81 240 48Z" fill="url(#experience-body)" stroke="#d6eafa" strokeWidth="1.5" />
        <path d="M214 126H266M212 221H268M226 248V259H254V248M240 53V244" stroke="#8fb8d6" strokeOpacity=".65" />
        <circle cx="240" cy="157" r="12" fill="#63d5ef" fillOpacity=".1" stroke="#63d5ef" />
        <circle cx="240" cy="157" r="5" stroke="#63d5ef" strokeOpacity=".5" />
        <path d="M221 233H259" stroke="#63d5ef" strokeWidth="2" />
      </g></g>
      <g stroke="#8fb8d6" strokeOpacity=".5"><path d="M111 89H161L190 119M302 184H359L374 168M173 265H121L107 278" /><circle cx="190" cy="119" r="2.5" fill="#63d5ef" /><circle cx="302" cy="184" r="2.5" fill="#63d5ef" /><circle cx="173" cy="265" r="2.5" fill="#63d5ef" /></g>
      <g fill="#a4c6df" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1.6"><text x="72" y="79">STABILITY</text><text x="347" y="157">DESIGN</text><text x="53" y="296">PROPULSION</text></g>
      <g stroke="#63d5ef" strokeOpacity=".55"><path d="M18 38V18H38M442 18H462V38M18 302V322H38M442 322H462V302" /></g>
      <g className="experience-blueprint-probe" stroke="#8ce8ff" strokeWidth=".8"><circle r="16" /><circle r="3" /><path d="M-24 0H-11M11 0H24M0-24V-11M0 11V24" /></g>
    </svg>
    <figcaption><span className="experience-signal" />From concept to launch<span className="experience-blueprint-hint" aria-hidden="true">Move to explore</span><span aria-hidden="true">↗</span></figcaption>
  </figure>;
}
