import React, { useContext, Suspense } from "react";

import context from "./../../contexts/users";

export default function UserDetail({ id }) {
  const { getResource } = useContext(context);

  const data = getResource("fetchUser")({ id });

  if (!data)
    return null;

  function RenderImage({ src }) {
    const srcImage = getResource("loadImage")(
      "https://raw.githubusercontent.com/johnlindquist/swapi-json-server/master/public/" + data.image
    );
    return <img src={srcImage} alt={data.name} />;
  }

  return (
    <div className="user-detail">
      <div className="image">
        <Suspense fallback={<div>loading image...</div>}>
          {data.image && <RenderImage src={data.image} />}
        </Suspense>
      </div>
      <div className="name">Name: {data.name}</div>
      <div className="name">Gender: {data.gender}</div>
      <div className="name">Birth Year: {data.birth_year}</div>
    </div>
  );
}
