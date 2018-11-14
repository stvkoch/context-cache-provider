import React from "react";
import ReactDOM from "react-dom";

import Routes from "./routes";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <Routes />
  </React.StrictMode>,
  rootElement
);
