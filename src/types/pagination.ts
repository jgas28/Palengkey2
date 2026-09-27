/** Shape of Laravel's default paginate() JSON response — only the fields we use. */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  total: number;
}
