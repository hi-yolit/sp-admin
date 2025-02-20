'use client';

import React, { useState } from "react";
import { Formik, Form } from "formik";
import { Button } from "@nextui-org/button";
import FormikInput from "@/components/ui/input";
import { loginValidationSchema } from "@/lib/validation-schemas";
import { loginFormData } from "@/types/forms";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";

interface LoginFormProps {
  error: string;
  loading: boolean;
  onSubmit: (formData: loginFormData) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ error, loading, onSubmit }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const MemoizedFormikInput = React.memo(FormikInput);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  return (
    <>
      {error && (
        <div
          className="mb-4 bg-red-100 border text-danger-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginValidationSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <MemoizedFormikInput
              isRequired
              name="email"
              label="Email"
              type="email"
              variant="bordered"
            />
            <MemoizedFormikInput
              isRequired
              name="password"
              label="Password"
              type={isVisible ? "text" : "password"}
              variant="bordered"
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                  aria-label="toggle password visibility"
                >
                  {isVisible ? (
                    <EyeSlashIcon className="icon pointer-events-none" />
                  ) : (
                    <EyeIcon className="icon pointer-events-none" />
                  )}
                </button>
              }
            />

            <div className="flex flex-col gap-4 items-center justify-between">
              <Button
                type="submit"
                disabled={isSubmitting}
                color="primary"
                isLoading={loading}
                fullWidth={true}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default LoginForm;