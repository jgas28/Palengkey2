export interface CustomerSettings {
  service_fee_rate: number;
  service_fee_percent: number;
  service_fee_max_amount: number;
  service_fee_fixed_amount: number;
  delivery_base_fee: number;
  delivery_base_distance: number;
  delivery_increment_fee: number;
  delivery_increment_distance: number;
  minimum_order_amount: number;
  paymongo_public_key: string;
  /** Every checkout method; `enabled: false` while an admin has it switched off. */
  payment_methods?: { method: string; enabled: boolean; reason: string | null }[];
}
