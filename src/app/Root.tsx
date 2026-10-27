import { Outlet, ScrollRestoration } from "react-router-dom";

export default function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
