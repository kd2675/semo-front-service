export type ResponseEnvelope<T> = {
  success: boolean;
  code: string | number;
  message: string;
  data?: T | null;
};
