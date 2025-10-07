import { useState } from 'react';

type Address = {
  firstName: string;
  lastName: string;
  line: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
};

export function useCheckoutStore() {
  const [address, setAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    line: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    address,
    setAddress,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
  };
}
