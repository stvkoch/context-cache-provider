import React, {useContext} from "react";
import Link from "./../link";

import usersContext from "./../../contexts/users";

function throwPromise() {
  const p = new Promise(resolve => {
    setTimeout(resolve, 5000);
  });

  throw p;
}

export default function Topbar() {
  const {clearCache} = useContext(usersContext);

  return (
    <div className="topbar">
      <Link href="/">Home</Link>
      <Link href="/users">People</Link>
      <Link href="/products">Products</Link>
      <Link onClick={()=>clearCache()}>Clear cache</Link>
      <Link onClick={throwPromise}>Throw</Link>
    </div>
  );
}
