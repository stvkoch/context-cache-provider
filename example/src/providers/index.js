import React from 'react'
import Provider from 'context-cache-provider'

import RouterProvider from './router'

import usersContext from './../contexts/users'
import productsContext from './../contexts/products'

function nameToId(item, index) {
  return {
    ...item,
    id: index + 1,
    slug: item.name.toLowerCase().replace(' ', '_')
  }
}

function fetchUsers() {
  return fetch('https://swapi.co/api/people/')
    .then(resp => resp.json())
    .then(response => response.results)
    .then(data => data.map(nameToId))
}

function fetchUser(query = {}) {
  if (!query.id) return new Promise(resolve => resolve([]))

  return fetch('https://swapi.co/api/people/' + query.id)
    .then(resp => resp.json())
    .then(nameToId)
}

function fetchProducts() {
  return fetch('https://swapi.co/api/starships/')
    .then(resp => resp.json())
    .then(response => response.results)
    .then(data => data.map(nameToId))
}

function fetchProduct(query = {}) {
  if (!query.id) return new Promise(resolve => resolve([]))

  return fetch('https://swapi.co/api/starships/' + query.id)
    .then(resp => resp.json())
    .then(nameToId)
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
    const image = new Image()
    return new Promise(resolve => {
      image.onload = () => setTimeout(() => resolve(src), 3000)
      image.src = src
    })
  }
}

export default function Providers({ children }) {
  return (
    <Provider
      context={productsContext}
      fetchProducts={fetchProducts}
      fetchProduct={fetchProduct}
    >
      <Provider
        limit='3'
        context={usersContext}
        fetchUsers={fetchUsers}
        fetchUser={fetchUser}
        {...externalResources}
      >
        <RouterProvider>{children}</RouterProvider>
      </Provider>
    </Provider>
  )
}
