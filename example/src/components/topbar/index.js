import React from "react";
import Link from "./../link";

export default function Topbar() {
  return (
    <div className="topbar">
      <Link path="/">Home</Link>
      <Link path="/users">People</Link>
      <Link path="/products">Products</Link>
    </div>
  );
}
