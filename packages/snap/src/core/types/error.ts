export type FormFieldError<Field = string> = {
  message: string;
  value: Field;
} | null;
