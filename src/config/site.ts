export const site = {
  name: 'Aerovate',
  tagline: 'Ideas take flight.',
  // Official VIT Stellar contact/channels, verified from the reference site.
  // Replace here when dedicated Aerovate channels are provided.
  contact: { label: 'VIT Stellar', email: 'astronomy@vit.ac.in' },
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/vit_stellar/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/company/vit-stellar/' },
    { label: 'Stellar website', url: 'https://vitstellar.vercel.app/' },
  ],
  // Profile URLs are platform-neutral; replace GitHub links with LinkedIn here when provided.
  developers: [
    { name: 'Aadit Garg', role: 'Foundation, UI, integration & deployment', url: 'https://github.com/aaditgarg01' },
    { name: 'Darsh L', role: 'Background artwork', url: 'https://github.com/Dracula27581234' },
    { name: 'Harsh Choudhary', role: 'Scroll animation & cursor interactivity', url: 'https://github.com/SpyApple-web' },
    { name: 'Rishit Aggarwal', role: 'Thrust Tech section', url: 'https://github.com/aggarwalrishit9' },
    { name: 'Sushant Singh', role: 'Glimpses gallery', url: 'https://github.com/singhsushant4684-eng' },
  ],
} as const;

export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Thrust Tech', to: '/#thrust-tech' },
  { label: 'The event', to: '/#event' },
  { label: 'Past POCs', to: '/#pocs' },
  { label: 'Glimpses', to: '/#glimpses' },
] as const;

export const sections = { home: 'home', thrust: 'thrust-tech', event: 'event', pocs: 'pocs', glimpses: 'glimpses', contact: 'contact' } as const;
