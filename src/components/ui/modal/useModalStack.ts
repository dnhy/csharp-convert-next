import { jotaiStore } from "@/components/jotaiStore";
import { useId } from "react";
import { ModalProps, modalStackAtom } from "./ModalStack";
import { actions } from "./ModalActionContext";

// 分离出来使用store，可以脱离react环境调用
export const presentModal = (
  options: ModalProps,
  modalId = ((Math.random() * 10) | 0).toString()
) => {
  const modalProps = {
    ...options,
    id: options.id ?? modalId,
  } satisfies ModalProps;

  jotaiStore.set(modalStackAtom, (p) => {
    return p.concat(modalProps);
  });

  return () => {
    jotaiStore.set(modalStackAtom, (p) => {
      return p.filter((x) => x.id !== modalId);
    });
  };
};

export const useModalStack = () => {
  const id = useId();
  let currIdx = 0;

  return {
    present(options: ModalProps) {
      const modalId = `${id}-${currIdx++}`;
      return presentModal(options, modalId);
    },

    ...actions,
  };
};
