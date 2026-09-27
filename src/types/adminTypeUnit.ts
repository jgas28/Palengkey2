export interface AdminProductType {
  id: number;
  name: string;
  status: boolean;
  active_items_count: number;
}

export interface AdminProductTypePage {
  data: AdminProductType[];
  current_page: number;
  last_page: number;
}

export interface AdminUnit {
  id: number;
  name: string;
  short_name: string;
  status: boolean;
  active_items_count: number;
}

export interface AdminUnitPage {
  data: AdminUnit[];
  current_page: number;
  last_page: number;
}
