import React, { Suspense } from "react";

import Route from "./components/route";
import Topbar from "./components/topbar";
import UserShell from "./shell/users";
import ListProdutcs from "./components/list-products";

export default function Routes() {
  return (
    <Suspense fallback={<div>global loading...</div>}>
      <Route path="(.*)">{params => <Topbar />}</Route>
      <Route path="/">{params => <div>initial</div>}</Route>
      <Route path="/users/:id?">{params => <UserShell {...params} />}</Route>
      <Route path="/products(/.*)?">{params => <ListProdutcs />}</Route>
    </Suspense>
  );
}
