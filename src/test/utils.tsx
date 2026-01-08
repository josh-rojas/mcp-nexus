/* eslint-disable react-refresh/only-export-components */
import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper as React.ComponentType<{ children: ReactNode }>, ...renderOptions }),
    queryClient,
  };
}

export {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  act,
  type RenderResult,
} from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
