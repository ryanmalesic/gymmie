import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { NavMain } from "@/components/dashboard/shell/sidebar/nav-main";
import { SidebarProvider } from "@/components/ui/sidebar";

test("renders navigation items with labels and links", () => {
  render(
    <SidebarProvider>
      <NavMain
        items={[
          {
            icon: <span data-testid="icon" />,
            isActive: true,
            title: "Overview",
            url: "/dashboard",
          },
        ]}
      />
    </SidebarProvider>,
  );

  expect(screen.getByText("Menu")).toBeInTheDocument();
  expect(screen.getByText("Overview")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
