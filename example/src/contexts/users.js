import { createContext } from "react";
import nop from "./../utils/nop";

const context = createContext({
  users: [],
  requestUsers: nop,
  hello: null
});

export default context;
