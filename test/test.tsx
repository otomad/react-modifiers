import React from "react";
import mod from "../src";

const a = <div onPointerDown={mod.exact.ctrl.left(e => {})} />;
