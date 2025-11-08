export interface AttributeValue {
  id: number;
  attributeId: number;
  attributeName: string;
  value: string;
}

export interface Variant {
  id: number | string;
  stockQuantity: number;
  priceModifier: number;
  attributes: AttributeValue[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  variants: Variant[];
  // Tu peux ajouter categoryId, shopId, etc.
}