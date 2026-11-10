export interface Customer {
  id: number;
  name: string;
  email?: string;
}

export interface Order {
  id: number;
  code: string;
  status: string;
  total: number | string;
  customer?: Customer;
}