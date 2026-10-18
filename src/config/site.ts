export const site = {
  name: 'Aerovate',
  tagline: 'Ideas take flight.',
  // Official VIT Stellar contact/channels, verified from the reference site.
  // Replace here when dedicated Aerovate channels are provided.
  contact: { label: 'VIT Stellar', email: 'astronomy@vit.ac.in' },
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/vit_stellar/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/company/vit-stellar/' },
    { label: 'GitHub', url: 'https://github.com/AstronomyClub-VITStellar' },
  ],
  // Profile destinations live here so they can be updated independently of the footer.
  developers: [
    { name: 'Aadit Garg', profiles: [
      { label: 'GitHub', url: 'https://github.com/aaditgarg01' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/aadit-garg22/' },
    ] },
    { name: 'Darsh L', profiles: [
      { label: 'GitHub', url: 'https://github.com/Dracula27581234' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/darsh-lakshmikanth-b83326388/' },
    ] },
    { name: 'Harsh Choudhary', profiles: [
      { label: 'GitHub', url: 'https://github.com/SpyApple-web' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/harsh-choudhary-4b4300424/' },
    ] },
    { name: 'Rishit Aggarwal', profiles: [
      { label: 'GitHub', url: 'https://github.com/aggarwalrishit9' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/rishit-aggarwal-88504b419/' },
    ] },
    { name: 'Sushant Singh', profiles: [
      { label: 'GitHub', url: 'https://github.com/singhsushant4684-eng' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/sushant-singh-663301378/' },
    ] },
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
