import React, { useContext, Suspense } from "react";

import usersContext from "./../../contexts/users";
import routerContext from "./../../contexts/router";

import List from "./../list";
import ListItem from "./../list-item";
import UserDetail from "./../user-detail";

export default function ListUsers({ id }) {
  /**
   * Now I can use my context to getResource and use Suspense
   */
  const { getResource } = useContext(usersContext);
  const { go } = useContext(routerContext);

  const data = getResource("fetchUsers")({});

  return (
    <List items={data}>
      {user => (
        <ListItem key={user.id}>
          {user.id != id && (
            <h2>
              <a onClick={() => go("/users/" + user.id)}>{user.name}</a>
            </h2>
          )}
          {user.id == id && (
            <Suspense fallback={<div>Loading user detail...</div>}>
              <UserDetail id={id} />
            </Suspense>
          )}
        </ListItem>
      )}
    </List>
  );
}
