"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type ActionError, type ActionResult } from "@/lib/action";
import { type UserType } from "@/lib/prisma/generated/zod/schemas";
import { type UserInput } from "@/lib/users/schema";

type ListedUser = Pick<UserType, "email" | "id" | "name">;

export function UserForm({
  action,
}: {
  action: (
    state: ActionResult<ListedUser, UserInput>,
    formData: FormData,
  ) => Promise<ActionResult<ListedUser, UserInput>>;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    error: {},
    ok: false,
  });

  const error: ActionError<UserInput> = state.ok ? {} : state.error;
  const values = state.ok ? undefined : state.values;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      key={
        state.ok
          ? state.data.id
          : values
            ? `${values.email}:${values.name}`
            : "idle"
      }
      noValidate
    >
      <FieldGroup>
        <Field data-invalid={error.name?.length ? true : undefined}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            aria-describedby={error.name ? "name-error" : undefined}
            aria-invalid={Boolean(error.name?.length)}
            defaultValue={values?.name}
            id="name"
            name="name"
            required
            type="text"
          />
          <FieldError errors={toFieldErrors(error.name)} id="name-error" />
        </Field>
        <Field data-invalid={error.email?.length ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            aria-describedby={error.email ? "email-error" : undefined}
            aria-invalid={Boolean(error.email?.length)}
            defaultValue={values?.email}
            id="email"
            name="email"
            required
            type="email"
          />
          <FieldError errors={toFieldErrors(error.email)} id="email-error" />
        </Field>
      </FieldGroup>
      <FieldError errors={toFieldErrors(error.form)} id="form-error" />
      <Button disabled={isPending} type="submit">
        {isPending ? <Spinner data-icon="inline-start" /> : null}
        Add user
      </Button>
    </form>
  );
}

function toFieldErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }));
}
