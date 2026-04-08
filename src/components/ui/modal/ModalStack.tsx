"use client";

import { ModalProps as AntdModalProps } from "antd";
import { atom, useAtomValue } from "jotai";
import { ReactNode } from "react";
import { ModalImpl } from "./ModalImpl";

type ModalContentProps = {
  dismiss: (e: unknown) => void;
};

export type ModalProps = {
  id?: string;
  content: ReactNode | ((props: ModalContentProps) => ReactNode);
} & Omit<AntdModalProps, "open">;

export const modalStackAtom = atom(
  [] as (Omit<ModalProps, "id"> & { id: string })[]
);

const ModalStack = () => {
  const stack = useAtomValue(modalStackAtom);

  return (
    <>
      {/* 条件渲染解决组件挂载modal未打开但内部children仍然渲染、内部业务逻辑仍然执行 */}
      {stack.map((props, index) => {
        return <ModalImpl key={props.id} {...props} index={index} />;
      })}
    </>
  );
};

export default ModalStack;
