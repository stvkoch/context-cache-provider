import React, { useContext, Suspense } from "react";

import usersContext from "./../../contexts/users";
// import routerContext from "./../../contexts/router";

import Link from "./../link";
import List from "./../list";
import ListItem from "./../list-item";
import UserDetail from "./../user-detail";

export default function ListUsers({ id }) {
  /**
   * Now I can use my context to getResource and use Suspense
   */
  const { getResource } = useContext(usersContext);
  // const { go } = useContext(routerContext);

  const data = getResource("fetchUsers")({});

  if (!data)
    return null;

  return (
    <List items={data}>
      {user => (
        <ListItem key={user.id}>
          {String(user.id) !== String(id) && (
            <h2>
              <Link href={"/users/" + user.id}>{user.name}</Link>
            </h2>
          )}
          {String(user.id) === String(id) && (
            <Suspense fallback={<div>Loading user detail...</div>}>
              <UserDetail id={id} />
            </Suspense>
          )}
        </ListItem>
      )}
    </List>
  );
}
