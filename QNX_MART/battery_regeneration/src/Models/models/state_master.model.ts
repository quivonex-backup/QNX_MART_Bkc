export interface StateResponse {
  msg: string;
  status: string;
  data: {
    id: number;
    state_code: string;
    state_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}