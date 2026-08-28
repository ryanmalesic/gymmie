"use client";

import { useForm } from "@tanstack/react-form";
import { lazy, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type CreateUser, createUserSchema } from "@/domain/users/schema";
import { type MutationError, useCreateUserMutation } from "@/hooks/users";

const FormDevtools = lazy(() =>
  import("@tanstack/react-devtools").then((module) => ({
    default: module.TanStackDevtools,
  })),
);

export function UserForm() {
  const mutation = useCreateUserMutation();
  const [formError, setFormError] = useState<null | string>(null);

  const form = useForm({
    defaultValues: { email: "", name: "" } as CreateUser,
    onSubmit: async ({ createValidationError, value }) => {
      setFormError(null);

      try {
        await mutation.mutateAsync(value);
        form.reset();
      } catch (error: unknown) {
        const failure = error as MutationError;

        setFormError(failure?.error ?? "Unable to create user");

        return createValidationError({
          fields: {
            email: failure?.fieldErrors?.email?.join(", "),
            name: failure?.fieldErrors?.name?.join(", "),
          },
        });
      }
    },
    validators: [
      {
        run: createUserSchema,
        triggerDebounceMs: 300,
        triggers: ["change", "blur"] as const,
      },
    ],
  });

  return (
    <>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => (
              <Field data-invalid={field.meta.isInvalid || undefined}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  aria-describedby={
                    field.meta.isInvalid ? "name-error" : undefined
                  }
                  aria-invalid={field.meta.isInvalid}
                  id="name"
                  name="name"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  required
                  type="text"
                  value={field.value}
                />
                <FieldError
                  errors={field.errors.map((error) => ({
                    message: error.message,
                  }))}
                  id="name-error"
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <Field data-invalid={field.meta.isInvalid || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  aria-describedby={
                    field.meta.isInvalid ? "email-error" : undefined
                  }
                  aria-invalid={field.meta.isInvalid}
                  id="email"
                  name="email"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  required
                  type="email"
                  value={field.value}
                />
                <FieldError
                  errors={field.errors.map((error) => ({
                    message: error.message,
                  }))}
                  id="email-error"
                />
              </Field>
            )}
          </form.Field>
        </FieldGroup>
        <FieldError>{formError}</FieldError>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || isSubmitting} type="submit">
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              Add user
            </Button>
          )}
        </form.Subscribe>
      </form>
      {process.env.NODE_ENV === "development" && (
        <Suspense>
          <FormDevtools config={{ hideUntilHover: true }} plugins={[]} />
        </Suspense>
      )}
    </>
  );
}

export function UserFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="user-name">Name</FieldLabel>
          <Input id="user-name" readOnly type="text" />
        </Field>
        <Field>
          <FieldLabel htmlFor="user-email">Email</FieldLabel>
          <Input id="user-email" readOnly type="email" />
        </Field>
      </FieldGroup>
      <Button type="button">Add user</Button>
    </div>
  );
}
