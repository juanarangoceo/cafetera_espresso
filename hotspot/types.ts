export interface ProductFeature {
  id: string;
  title: string;
  description: string;
  price?: string;
  // Percentage coordinates (0-100)
  x: number;
  y: number;
}

export interface HotspotProps {
  feature: ProductFeature;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onClose: () => void;
}
