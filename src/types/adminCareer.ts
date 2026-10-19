export type CareerJobType = "full-time" | "part-time" | "contract";
export type CareerStatus = "open" | "filled" | "closed";

export interface AdminCareer {
  id: number;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
  job_type: CareerJobType;
  salary_range: string | null;
  status: CareerStatus;
  expires_at: string | null;
  is_active: boolean;
  created_by: { id: number; fname: string; lname: string } | null;
  created_at: string;
}

export interface AdminCareerPage {
  data: AdminCareer[];
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}
