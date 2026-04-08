"use client";

import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

const showBar = atom(true);

export default function JotaiTest() {
    const setShowCount = useSetAtom(showBar);
    console.log('showBar :', showBar);
//   const [showCount, setShowCount] = useAtom(showBar);

  console.log("JotaiTest Rerender");
  return (
    <>
      <Bar />
      <br />
      <button
        onClick={() => {
          setShowCount((p) => !p);
        }}
      >
        +
      </button>
    </>
  );
}

const Bar = () => {
  const isShowBar = useAtomValue(showBar);

  console.log("Bar Rerender");

  return <>This is bar:{isShowBar + ""}</>;
};
