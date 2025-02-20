import React from "react";
import { useField } from "formik";
import { Input, InputProps } from "@nextui-org/react";

type FormikInputProps = Omit<InputProps, "name"> & {
  name: string;
  label: string;
};

const FormikInput: React.FC<FormikInputProps> = ({ label, name, ...props }) => {
  const [field, meta, helpers] = useField(name);

  const handleChange: InputProps["onChange"] = (e) => {
    field.onChange(e);
    helpers.setTouched(true);
  };

  const handleBlur: InputProps["onBlur"] = (e) => {
    field.onBlur(e);
    if (e.target instanceof HTMLInputElement && e.target.value !== "") {
      helpers.setTouched(true);
    }
  };

  const inputProps: InputProps = {
    ...props,
    ...field,
    name,
    label,
    isInvalid: meta.touched && !!meta.error,
    errorMessage: meta.touched && meta.error ? meta.error : undefined,
    onChange: handleChange,
    onBlur: handleBlur,
  };

  return <Input {...inputProps} />;
};

export default FormikInput;
