"use client";

import {
  createContext,
  createElement,
  FC,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModalProps, modalStackAtom } from "./ModalStack";
import { Modal } from "antd";
import { useSetAtom } from "jotai";

// provide to content element
const modalActionContext = createContext<{
  dismiss: (e: unknown) => void;
}>(null!);

export const useCurrentModalAction = () => useContext(modalActionContext);

// 作为子组件使用memo
export const ModalImpl: FC<
  Omit<ModalProps, "id"> & { id: string; index: number }
> = memo((props) => {
  const { content, ...modalProps } = props;
  const [open, setOpen] = useState(true);

  const setStack = useSetAtom(modalStackAtom);

  //   useEffect中使用removeModalFromStack作为依赖，防止每次重渲染都生成新的函数
  const removeModalFromStack = useCallback(() => {
    setStack((p) => {
      return p.filter((x) => x.id !== props.id);
    });
  }, [props.id, setStack]);

  const onCancel = useCallback(
    (e: unknown) => {
      setOpen(false);
      props.onCancel?.(e as React.MouseEvent<HTMLButtonElement>);
    },
    [props]
  );

  useEffect(() => {
    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timerId: any = null;
    if (!open) {
      timerId = setTimeout(() => {
        if (isCancelled) return;

        removeModalFromStack();
      }, 500);

      return () => {
        isCancelled = true;
        clearTimeout(timerId);
        timerId = null;
      };
    }
  }, [open, removeModalFromStack]);

  return (
    <modalActionContext.Provider
      value={useMemo(
        () => ({
          dismiss: onCancel,
        }),
        [onCancel]
      )}
    >
      {/* destroyOnHidden弹窗关闭时才会销毁 */}
      <Modal open={open} onCancel={onCancel} destroyOnHidden {...modalProps}>
        {typeof content === "function"
          ? createElement(content, { dismiss: onCancel })
          : content}
      </Modal>
    </modalActionContext.Provider>
  );
});

ModalImpl.displayName = "ModalImpl";
