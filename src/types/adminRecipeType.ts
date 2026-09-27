export interface AdminRecipeType {
  id: number;
  name: string;
  status: boolean;
}

export interface AdminRecipeTypePage {
  data: AdminRecipeType[];
  current_page: number;
  last_page: number;
}
