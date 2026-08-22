"use client";

import { useForm } from "@tanstack/react-form";
import { lazy, Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type ActionResult } from "@/lib/action";
import {
  type CreateUserMutationError,
  useCreateUserMutation,
} from "@/lib/users/mutations";
import { type ListedUser } from "@/lib/users/queries";
import { type UserInput, userInputSchema } from "@/lib/users/schema";

const FormDevtools = lazy(() =>
  import("@tanstack/react-devtools").then((m) => ({
    default: m.TanStackDevtools,
  })),
);

export function UserForm({
  action,
}: {
  action: (input: UserInput) => Promise<ActionResult<ListedUser, UserInput>>;
}) {
  const mutation = useCreateUserMutation(action);

  const form = useForm({
    defaultValues: { email: "", name: "" },
    onSubmit: async ({ createValidationError, value }) => {
      try {
        await mutation.mutateAsync(value);
        form.reset();
      } catch (thrown: unknown) {
        const failure = thrown as CreateUserMutationError;
        return createValidationError({
          fields: {
            email: failure.error.email?.join(", "),
            name: failure.error.name?.join(", "),
          },
          form: failure.error.form?.join(", "),
        });
      }
    },
    validators: [
      {
        run: userInputSchema,
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
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                  type="text"
                  value={field.value}
                />
                <FieldError
                  errors={field.errors.map((e) => ({ message: e.message }))}
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
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                  type="email"
                  value={field.value}
                />
                <FieldError
                  errors={field.errors.map((e) => ({ message: e.message }))}
                  id="email-error"
                />
              </Field>
            )}
          </form.Field>
        </FieldGroup>
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
