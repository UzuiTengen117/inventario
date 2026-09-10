export type MovementType = 'entrada' | 'salida' | 'ajuste';

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  reason: string;
}

export interface MovementDraft {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}
