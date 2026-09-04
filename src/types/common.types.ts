export type TApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};
