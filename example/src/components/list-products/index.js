import React, { useContext } from "react";

import context from "./../../contexts/products";
import routerContext from "./../../contexts/router";

import List from "./../list";
import ListItem from "./../list-item";

export default function ListProduct() {
  const { getResource } = useContext(context);
  const { url, params } = useContext(routerContext);

  const data = getResource("fetchProducts")({ id: 9, name: "Leonard" });

  return (
    <List items={data}>
      {product => <ListItem key={product.id}>{product.name}</ListItem>}
    </List>
  );
}
