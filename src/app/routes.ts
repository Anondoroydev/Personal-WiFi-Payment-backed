import { createBrowserRouter } from "react-router-dom";
import Root from "./Root";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        lazy: () => import("./pages/Home").then(({ default: Component }) => ({ Component })),
      },
      {
        path: "login",
        lazy: () => import("./pages/Login").then(({ default: Component }) => ({ Component })),
      },
      {
        path: "contact",
        lazy: () => import("./pages/Contact").then(({ default: Component }) => ({ Component })),
      },
      {
        path: "user/signup",
        lazy: () => import("./pages/UserSignup").then(({ default: Component }) => ({ Component })),
      },
      {
        path: "forgot-password",
        lazy: () => import("./pages/ForgotPassword").then(({ default: Component }) => ({ Component })),
      },
      {
        path: "*",
        lazy: () => import("./pages/NotFound").then(({ default: Component }) => ({ Component })),
      },

      // Protected: requires user login
      {
        Component: ProtectedRoute,
        children: [
          {
            path: "user/profile",
            lazy: () => import("./pages/UserProfile").then(({ default: Component }) => ({ Component })),
          },
        ],
      },
      {
        Component: AdminProtectedRoute,
        children: [
          {
            path: "admin/dashboard",
            lazy: () => import("./pages/AdminDashboard").then(({ default: Component }) => ({ Component })),
          },
        ],
      },
    ],
  },
]);