// eslint-disable-next-line
import React, { useContext } from "react";
import pathMatch from "path-match";

import RouterContext from "./../../contexts/router";

const route = pathMatch();

export default function Route({ path, children }) {
  const { url } = useContext(RouterContext);
  const match = route(path);
  const params = match(url);
  if (params !== false) {
    url.split("/")
      .filter(r => r)
      .map((v,i) => (params[i] = v))
    return children(params);
  }
  return null;
}
