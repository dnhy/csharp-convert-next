import { jotaiStore } from "@/components/jotaiStore";
import { modalStackAtom } from "./ModalStack";

export const actions = {
  dismiss(id: string) {
    jotaiStore.set(modalStackAtom, (p) => {
      return p.filter((x) => x.id !== id);
    });
  },
  dismissTop() {
    jotaiStore.set(modalStackAtom, (p) => {
      return p.slice(0, -1);
    });
  },
  dismissAll() {
    jotaiStore.set(modalStackAtom, []);
  },
};
