import { useModalStack } from "./useModalStack";

export const useBizModel = () => {
  const { present } = useModalStack();

  return {
    presentBizModal: () => {
      present({
        title: "Biz1",
        content: () => <ModalContent />,
      });
    },
  };
};

const ModalContent = () => {
  return <div>Content</div>;
};
