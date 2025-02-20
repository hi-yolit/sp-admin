
import { InputProps } from "@nextui-org/react";

export type FormikInputProps = Omit<InputProps, "name"> & {
  name: string;
  label: string;
};


export type loginFormData = {
  email: string;
  password: string;
};