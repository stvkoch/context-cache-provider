import React, { useContext } from "react";
import pathMatch from "path-match";

import RouterContext from "./../../contexts/router";

const route = pathMatch();

export default function Route({ path, children }) {
  const { url } = useContext(RouterContext);

  const match = route(path);
  const params = match(url);
  const splitRoute = url.split("/").filter(r => r);
  if (params !== false) {
    console.log("route", url, params, splitRoute);
    return children(params, splitRoute);
  }
  return null;
}
