export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  image: string;
  qty: number;
  note: string;
  stock?: number;
  available?: boolean;
};
