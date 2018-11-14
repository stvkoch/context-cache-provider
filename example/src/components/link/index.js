import React, { useContext } from "react";
import RouterContext from "./../../contexts/router";

function buttonHtml(props) {
  return <button {...props} />;
}

export default function Link({ path, component, ...props }) {
  const { go } = useContext(RouterContext);

  const Bnt = component || buttonHtml;
  return <Bnt {...props} onClick={() => go(path)} />;
}
