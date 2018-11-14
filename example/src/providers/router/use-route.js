// eslint-disable-next-line
import React, { useState, useEffect } from "react";
import history from "browser-history";

export default function useRoute() {
  const [url, setUrl] = useState(window.location.pathname);

  useEffect(() => {
    history((e, url) => setUrl(url));
  });

  function go(url) {
    setUrl(url);
    history(url);
  }

  return [url, go];
}
