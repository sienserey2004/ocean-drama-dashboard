export const formatBenefitKey = (key: string) => {
  const formatted = key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Shorten specific benefits for mobile
  if (formatted === 'Unlimited Uploads') return 'Unlimited Uploads';
  if (formatted === 'Advanced Analytics') return 'Analytics';
  if (formatted === 'Priority Support') return 'Priority Support';
  if (formatted === 'Custom Branding') return 'Custom Branding';
  
  return formatted;
};
