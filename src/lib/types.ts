export type Side = "inbar" | "eli";

export const SIDES: Side[] = ["inbar", "eli"];

export type Lang = "he" | "en";

export const LANGS: Lang[] = ["he", "en"];

export type SideProfile = {
  side: Side;
  display_name: string;
  display_name_he: string;
  tagline: string;
  tagline_he: string;
  bio: string;
  bio_he: string;
  hero_image: string | null;
  visits: number;
};

export type Category = {
  id: string;
  side: Side;
  name: string;
  name_he: string;
  sort_order: number;
};

export type MediaKind = "image" | "video";

export type ItemPhoto = {
  id: string;
  item_id: string;
  path: string;
  caption: string;
  kind: MediaKind;
  sort_order: number;
};

export type Item = {
  id: string;
  side: Side;
  category_id: string | null;
  title: string;
  title_he: string;
  description: string;
  description_he: string;
  year: number | null;
  materials: string | null;
  materials_he: string | null;
  manufacturer: string | null;
  model: string | null;
  process: string | null;
  process_he: string | null;
  cover_path: string | null;
  before_path: string | null;
  audio_path: string | null;
  video_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  view_count: number;
  like_count: number;
  share_count: number;
  item_photos: ItemPhoto[];
};

export type Post = {
  id: string;
  side: Side;
  title: string;
  title_he: string;
  body: string;
  body_he: string;
  location: string;
  event_date: string | null;
  image_path: string | null;
  published: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  side: Side;
  item_id: string | null;
  name: string;
  email: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type SidePortfolio = {
  profile: SideProfile;
  categories: Category[];
  items: Item[];
  posts: Post[];
};

export type Portfolio = Record<Side, SidePortfolio>;
