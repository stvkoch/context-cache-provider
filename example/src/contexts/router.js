import { createContext } from "react";
import nop from "./../utils/nop";

const context = createContext({
  url: null,
  go: nop,
  params: {},
  setParams: nop
});

export default context;
