import React from "react";

export default function List({ items = [], children, ...props }) {
  if (!items) return null;
  return <ul {...props}>{items.map(children)}</ul>;
}
