import React from "react";

import useRoute from "./use-route";

import RouterContext from "./../../contexts/router";

function Router({ children }) {
  const [url, go] = useRoute();

  return (
    <RouterContext.Provider value={{ url, go }}>
      {children}
    </RouterContext.Provider>
  );
}

export { Router as default };
