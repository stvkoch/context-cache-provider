export function fromPromise(fetchResource) {
  return () => {
    const promise = fetchResource.apply(null, arguments);
    if (typeof promise.then === "function") throw promise;
  };
}

export function resource() {}

export function fromObservable(fetchResource) {}
