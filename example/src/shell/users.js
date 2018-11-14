import React, { Suspense } from "react";

import ListUsers from "./../components/list-users";

export default function UserShell({ id }) {
  return (
    <Suspense fallback={<div>Loading user list...</div>}>
      <ListUsers id={id} />
    </Suspense>
  );
}
