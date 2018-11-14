import React from "react";
import Provider from 'context-cache-provider';

import RouterProvider from "./router";

import usersContext from "./../contexts/users";
import productsContext from "./../contexts/products";

function fetchUsers() {
  return fetch("/people.json").then(resp => resp.json());
}

function fetchUser(query = {}) {
  if (!query.id) return new Promise(resolve => resolve([]));

  return fetch("/people.json")
    .then(resp => resp.json())
    .then(data => data.filter(people => Number(people.id) == Number(query.id)));
}

function fetchProducts() {
  return fetch("/starships.json").then(resp => resp.json());
}

function fetchProduct(query = {}) {
  if (!query.id) return new Promise(resolve => resolve([]));

  return fetch("/starships.json")
    .then(resp => resp.json())
    .then(data =>
      data.filter(starship => Number(starship.id) == Number(query.id))
    );
}

/**
 * external resources
 *
 * You could have your external resources using separate provider and context
 *
 * @type {{loadImage: (function(*=): Promise<any>)}}
 */
const externalResources = {
  loadImage: function(src) {
    const image = new Image();
    return new Promise(resolve => {
      image.onload = () => setTimeout(() => resolve(src), 3000);
      image.src = src;
    });
  }
};

export default function Providers({ children }) {
  return (
    <Provider
      context={productsContext}
      fetchProducts={fetchProducts}
      fetchProduct={fetchProduct}
    >
      <Provider
        context={usersContext}
        fetchUsers={fetchUsers}
        fetchUser={fetchUser}
        {...externalResources}
      >
        <RouterProvider>{children}</RouterProvider>
      </Provider>
    </Provider>
  );
}
