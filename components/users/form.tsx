"use client";

import { useActionState } from "react";

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
      className="flex flex-col gap-3"
      key={
        state.ok
          ? state.data.id
          : values
            ? `${values.email}:${values.name}`
            : "idle"
      }
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input
            aria-describedby={error.name ? "name-error" : undefined}
            aria-invalid={Boolean(error.name)}
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-base font-normal dark:border-white/15"
            defaultValue={values?.name}
            name="name"
            required
            type="text"
          />
        </label>
        <FieldError id="name-error" messages={error.name} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            aria-describedby={error.email ? "email-error" : undefined}
            aria-invalid={Boolean(error.email)}
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-base font-normal dark:border-white/15"
            defaultValue={values?.email}
            name="email"
            required
            type="email"
          />
        </label>
        <FieldError id="email-error" messages={error.email} />
      </div>
      <FieldError id="form-error" messages={error.form} />
      <button
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        disabled={isPending}
        type="submit"
      >
        Add user
      </button>
    </form>
  );
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} role="alert">
      {messages.join(" ")}
    </p>
  );
}
