// types/navigation.ts

export type Product = {
  id: number;
  title: string;
  price: {
    type: 'fixed' | 'variable';
    amount: number;
  };
  discount: {
    type: 'none' | 'fixed';
    amount: number;
  };
  city: string;
  section: {
    id: number;
    name: string;
  };
  image: string;
  content: string | null;
  status: string;
  tax: number | null;
  date: string;
  locale: string;
};


export type RootStackParamList = {
  AddScreen: { updatedProduct?: Product };
  EditPriceScreen: { product: Product };
  
};
