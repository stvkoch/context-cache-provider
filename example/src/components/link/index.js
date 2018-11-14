import React, { useContext } from "react";
import RouterContext from "./../../contexts/router";

function LinkGenerator({ href, children, ...props }) {
  return <a {...props} href={href || '!#'} >{children}</a>;
}

export default function Link({ component, ...props }) {
  const { go } = useContext(RouterContext);
  const LinkComponent = component || LinkGenerator;

  return <LinkComponent {...props} onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onClick && props.onClick(e);
    props.href && go(props.href);
  }} />
}

