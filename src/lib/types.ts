export type Side = "inbar" | "eli";

export const SIDES: Side[] = ["inbar", "eli"];

export type SideProfile = {
  side: Side;
  display_name: string;
  tagline: string;
  bio: string;
  hero_image: string | null;
};

export type Category = {
  id: string;
  side: Side;
  name: string;
  sort_order: number;
};

export type ItemPhoto = {
  id: string;
  item_id: string;
  path: string;
  caption: string;
  sort_order: number;
};

export type Item = {
  id: string;
  side: Side;
  category_id: string | null;
  title: string;
  description: string;
  year: number | null;
  materials: string | null;
  manufacturer: string | null;
  model: string | null;
  process: string | null;
  cover_path: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  item_photos: ItemPhoto[];
};

export type SidePortfolio = {
  profile: SideProfile;
  categories: Category[];
  items: Item[];
};

export type Portfolio = Record<Side, SidePortfolio>;
