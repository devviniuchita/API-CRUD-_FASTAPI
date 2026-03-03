export interface Client {
  id: string;
  name: string;
  email: string;
  document: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
  email: string;
  document: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string;
  document?: string;
}

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[];
}
