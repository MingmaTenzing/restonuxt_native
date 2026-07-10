// Menu contracts — mirrors API_REFERENCE.md exactly.

export interface MenuOption {
  id: string;
  name: string;
  priceCents: number;
  menuItemId: string;
}

export interface MenuOptionInput {
  name: string;
  priceCents: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  options?: MenuOption[];
}

/** Body for POST /api/menu and PUT /api/menu/{menu_id}. */
export interface MenuItemInput {
  name: string;
  category: string;
  priceCents: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  options?: MenuOptionInput[];
}
