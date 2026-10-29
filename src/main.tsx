import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { store } from "./store";
import { Inicio } from "./paginas/Inicio";
import { Kiosco } from "./paginas/Kiosco";
import { Ventanilla } from "./paginas/Ventanilla";
import { Sala } from "./paginas/Sala";
import { Panel } from "./paginas/Panel";
import "./estilos.css";

const router = createBrowserRouter([
  { path: "/", element: <Inicio /> },
  { path: "/kiosco", element: <Kiosco /> },
  { path: "/ventanilla", element: <Ventanilla /> },
  { path: "/sala", element: <Sala /> },
  { path: "/panel", element: <Panel /> },
  { path: "*", element: <Inicio /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
